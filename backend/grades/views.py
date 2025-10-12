from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from decimal import Decimal
from datetime import timedelta
from django.utils import timezone

from .models import Subject, Evaluation, Attendance, GradeCalculation
from .serializers import (
    SubjectSerializer, SubjectCreateSerializer, EvaluationSerializer,
    AttendanceSerializer, GradeCalculationSerializer, GradeEstimationSerializer
)

# ==================== SUBJECT VIEWSET ====================

class SubjectViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Subject.objects.filter(user=self.request.user).prefetch_related('evaluations', 'attendance')

    def get_serializer_class(self):
        # 🔧 SOLUCION: Usar SubjectCreateSerializer tanto para crear como para actualizar
        if self.action in ['create', 'update', 'partial_update']:
            return SubjectCreateSerializer
        return SubjectSerializer

    def update(self, request, *args, **kwargs):
        """
        🔧 METODO PERSONALIZADO PARA MANEJAR ACTUALIZACION DE EVALUACIONES
        """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        
        if serializer.is_valid():
            # Si hay evaluations_data, manejar la actualización
            if 'evaluations_data' in serializer.validated_data:
                evaluations_data = serializer.validated_data.pop('evaluations_data')
                
                # Actualizar los campos básicos de la asignatura
                for field, value in serializer.validated_data.items():
                    setattr(instance, field, value)
                instance.save()
                
                # 🔄 ACTUALIZAR EVALUACIONES
                print(f"🔧 Actualizando evaluaciones para asignatura {instance.id}")
                print(f"📊 Nueva cantidad de evaluaciones: {instance.total_evaluations}")
                print(f"📋 Evaluaciones recibidas: {len(evaluations_data)}")
                
                # Eliminar evaluaciones existentes que no tengan notas
                existing_evaluations = instance.evaluations.all()
                evaluations_with_grades = existing_evaluations.filter(is_completed=True)
                
                print(f"📝 Evaluaciones existentes con notas: {evaluations_with_grades.count()}")
                
                # Solo eliminar evaluaciones sin notas para evitar pérdida de datos
                evaluations_without_grades = existing_evaluations.filter(is_completed=False)
                deleted_count = evaluations_without_grades.count()
                evaluations_without_grades.delete()
                
                print(f"🗑️ Evaluaciones sin notas eliminadas: {deleted_count}")
                
                # Crear las nuevas evaluaciones
                for eval_data in evaluations_data:
                    # Verificar si ya existe una evaluación con este nombre
                    existing_eval = existing_evaluations.filter(name=eval_data['name']).first()
                    
                    if existing_eval and existing_eval.is_completed:
                        # Si existe y tiene nota, solo actualizar el porcentaje
                        existing_eval.percentage = Decimal(str(eval_data['percentage']))
                        existing_eval.save()
                        print(f"✏️ Actualizada evaluación existente: {existing_eval.name}")
                    else:
                        # Crear nueva evaluación
                        new_evaluation = Evaluation.objects.create(
                            subject=instance,
                            name=eval_data['name'],
                            percentage=Decimal(str(eval_data['percentage']))
                        )
                        print(f"➕ Nueva evaluación creada: {new_evaluation.name}")
                
                print(f"✅ Actualizacion de evaluaciones completada")
                
            else:
                # Si no hay evaluations_data, solo actualizar campos básicos
                instance = serializer.save()
            
            # Asegurar que existe el registro de asistencia
            if not hasattr(instance, 'attendance'):
                Attendance.objects.create(subject=instance)
            
            # Devolver la asignatura actualizada con todas sus relaciones
            response_serializer = SubjectSerializer(instance)
            return Response(response_serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get', 'patch'])
    def attendance(self, request, pk=None):
        subject = self.get_object()
        try:
            attendance = subject.attendance
        except Attendance.DoesNotExist:
            return Response({'error': 'No se encontró asistencia'}, status=404)

        if request.method == 'GET':
            serializer = AttendanceSerializer(attendance)
            return Response(serializer.data)

        elif request.method == 'PATCH':
            serializer = AttendanceSerializer(attendance, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=400)

    @action(detail=True, methods=['post'])
    def estimate_grades(self, request, pk=None):
        subject = self.get_object()
        serializer = GradeEstimationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        target_grade = serializer.validated_data.get('target_grade') or subject.passing_grade
        estimation = self._calculate_grade_estimation_corrected(subject, target_grade)

        # Guardar el cálculo en el historial
        GradeCalculation.objects.create(subject=subject, calculation_data=estimation)
        return Response(estimation, status=200)

    @action(detail=True, methods=['get'])
    def calculation_history(self, request, pk=None):
        subject = self.get_object()
        history = GradeCalculation.objects.filter(subject=subject)
        serializer = GradeCalculationSerializer(history, many=True)
        return Response(serializer.data)

    def _calculate_grade_estimation_corrected(self, subject, target_grade):
        """
        CÁLCULO CORREGIDO de estimación de notas
        """
        print(f"\n=== INICIANDO CÁLCULO PARA {subject.name} ===")
        print(f"Nota objetivo: {target_grade}")
        
        evaluations = subject.evaluations.all()
        completed_evaluations = evaluations.filter(is_completed=True)
        pending_evaluations = evaluations.filter(is_completed=False)
        
        print(f"Evaluaciones completadas: {completed_evaluations.count()}")
        print(f"Evaluaciones pendientes: {pending_evaluations.count()}")
        
        # Calcular puntos actuales (notas ponderadas)
        puntos_actuales = Decimal('0')
        peso_completado = Decimal('0')
        
        completed_data = []
        for evaluation in completed_evaluations:
            peso = evaluation.percentage / 100  # Convertir porcentaje a decimal
            puntos_contribuidos = evaluation.grade * peso
            puntos_actuales += puntos_contribuidos
            peso_completado += peso
            
            completed_data.append({
                'name': evaluation.name,
                'percentage': float(evaluation.percentage),
                'grade': float(evaluation.grade),
                'points_contributed': float(puntos_contribuidos)
            })
            
            print(f"  {evaluation.name}: {evaluation.grade} × {peso} = {puntos_contribuidos}")
        
        print(f"Puntos actuales: {puntos_actuales}")
        print(f"Peso completado: {peso_completado}")
        
        # Calcular puntos necesarios para alcanzar el objetivo
        puntos_necesarios = target_grade - puntos_actuales
        print(f"Puntos necesarios: {puntos_necesarios}")
        
        # Calcular peso pendiente
        peso_pendiente = Decimal('0')
        pending_data = []
        
        for evaluation in pending_evaluations:
            peso = evaluation.percentage / 100
            peso_pendiente += peso
            pending_data.append({
                'id': evaluation.id,
                'name': evaluation.name,
                'percentage': float(evaluation.percentage),
                'weight': float(peso)
            })
        
        print(f"Peso pendiente: {peso_pendiente}")
        
        # Determinar status y calcular notas sugeridas
        status = ''
        recommendations = []
        
        if peso_pendiente == 0:
            # No hay evaluaciones pendientes
            promedio_final = puntos_actuales
            if promedio_final >= target_grade:
                status = 'objetivo_alcanzado'
                recommendations.append(f'¡Felicidades! Ya alcanzaste el promedio objetivo con {promedio_final:.2f}')
            else:
                status = 'objetivo_no_alcanzado'
                recommendations.append(f'Promedio actual: {promedio_final:.2f}. No alcanzaste el objetivo de {target_grade}')
        else:
            # Hay evaluaciones pendientes
            if puntos_necesarios <= 0:
                status = 'objetivo_alcanzado'
                recommendations.append('¡Ya alcanzaste tu objetivo! Cualquier nota en las evaluaciones restantes mantendrá tu promedio.')
                # Para evaluaciones pendientes, sugerir nota mínima (1.0)
                for pending in pending_data:
                    pending['suggested_grade'] = 1.0
            else:
                # Calcular el promedio necesario en las evaluaciones restantes
                promedio_necesario = puntos_necesarios / peso_pendiente
                print(f"Promedio necesario en evaluaciones restantes: {promedio_necesario}")
                
                if promedio_necesario > 7.0:
                    status = 'objetivo_imposible'
                    recommendations.append(f'Es imposible alcanzar el objetivo. Necesitarías un promedio de {promedio_necesario:.2f} en las evaluaciones restantes.')
                    # Asignar nota máxima (7.0) aunque sea imposible
                    for pending in pending_data:
                        pending['suggested_grade'] = 7.0
                elif promedio_necesario <= 4.0:
                    status = 'objetivo_facil'
                    recommendations.append(f'Objetivo fácil de alcanzar. Promedio necesario: {promedio_necesario:.2f}')
                elif promedio_necesario <= 5.5:
                    status = 'objetivo_moderado'
                    recommendations.append(f'Objetivo alcanzable con esfuerzo moderado. Promedio necesario: {promedio_necesario:.2f}')
                else:
                    status = 'objetivo_dificil'
                    recommendations.append(f'Objetivo difícil pero posible. Promedio necesario: {promedio_necesario:.2f}')
                
                # Asignar la nota mínima necesaria a cada evaluación pendiente
                # (todas deben tener al menos esta nota)
                for pending in pending_data:
                    nota_minima = max(1.0, min(7.0, float(promedio_necesario)))
                    pending['suggested_grade'] = round(nota_minima, 1)
        
        # Preparar la respuesta
        estimation = {
            'subject_id': subject.id,
            'subject_name': subject.name,
            'target_grade': float(target_grade),
            'current_points': float(puntos_actuales),
            'points_needed': float(puntos_necesarios),
            'completed_evaluations': completed_data,
            'pending_evaluations': pending_data,
            'status': status,
            'recommendations': recommendations
        }
        
        print("=== RESULTADO FINAL ===")
        print(f"Status: {status}")
        print(f"Puntos actuales: {puntos_actuales}")
        print(f"Puntos necesarios: {puntos_necesarios}")
        for pending in pending_data:
            print(f"  {pending['name']}: nota mínima {pending['suggested_grade']}")
        
        return estimation

# ==================== EVALUATION VIEWSET ====================

class EvaluationViewSet(viewsets.ModelViewSet):
    serializer_class = EvaluationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Evaluation.objects.filter(subject__user=self.request.user)

# ==================== DASHBOARD ====================

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def dashboard_summary(request):
    user = request.user
    subjects = Subject.objects.filter(user=user).prefetch_related('evaluations', 'attendance')

    summary = {
        'total_subjects': subjects.count(),
        'subjects_at_risk': 0,
        'subjects_passed': 0,
        'subjects_pending': 0,
        'attendance_alerts': 0,
        'recent_calculations': 0
    }

    for subject in subjects:
        # Verificar alertas de asistencia
        if hasattr(subject, 'attendance') and subject.attendance.is_at_risk:
            summary['attendance_alerts'] += 1

        # Calcular estado académico
        completed = subject.evaluations.filter(is_completed=True)
        if completed.exists():
            # Calcular promedio ponderado actual
            total_weight = Decimal('0')
            weighted_sum = Decimal('0')
            
            for evaluation in completed:
                weight = evaluation.percentage / 100
                weighted_sum += evaluation.grade * weight
                total_weight += weight
            
            if total_weight > 0:
                current_avg = weighted_sum / total_weight
                
                if current_avg >= subject.passing_grade:
                    summary['subjects_passed'] += 1
                elif current_avg < subject.minimum_grade_for_exam:
                    summary['subjects_at_risk'] += 1
                else:
                    summary['subjects_pending'] += 1
            else:
                summary['subjects_pending'] += 1
        else:
            summary['subjects_pending'] += 1

    # Contar cálculos recientes
    summary['recent_calculations'] = GradeCalculation.objects.filter(
        subject__user=user,
        created_at__gte=timezone.now() - timedelta(days=7)
    ).count()

    return Response(summary, status=200)