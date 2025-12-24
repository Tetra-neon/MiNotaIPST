from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from decimal import Decimal
from datetime import timedelta
from django.utils import timezone

from .models import Subject, Evaluation, Attendance, GradeCalculation, PeriodoAcademico
from .serializers import (
    SubjectSerializer, SubjectCreateSerializer, EvaluationSerializer,
    AttendanceSerializer, GradeCalculationSerializer, GradeEstimationSerializer,
    PeriodoAcademicoSerializer
)

# ==================== PERIODOS ACADEMICOS ====================

class PeriodoViewSet(viewsets.ModelViewSet):
    """
    Gestiona los semestres (Crear, listar, activar)
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PeriodoAcademicoSerializer

    def get_queryset(self):
        return PeriodoAcademico.objects.filter(usuario=self.request.user)

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)

    @action(detail=False, methods=['get'])
    def active(self, request):
        """
        Endpoint rápido para obtener el semestre activo actual
        GET /api/periodos/active/
        """
        periodo = self.get_queryset().filter(activo=True).first()
        if periodo:
            serializer = self.get_serializer(periodo)
            return Response(serializer.data)
        return Response(None) # Si no hay activo, devuelve null


# ==================== SUBJECT VIEWSET ====================

class SubjectViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Ahora permite filtrar por periodo.
        Si no se especifica, devuelve TODAS las asignaturas del usuario (útil para historiales).
        Se puede filtrar con: ?periodo=ID o ?periodo=active
        """
        queryset = Subject.objects.filter(user=self.request.user).prefetch_related('evaluations', 'attendance', 'periodo')
        
        periodo_param = self.request.query_params.get('periodo')
        
        if periodo_param == 'active':
            queryset = queryset.filter(periodo__activo=True)
        elif periodo_param:
            queryset = queryset.filter(periodo_id=periodo_param)
            
        return queryset

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return SubjectCreateSerializer
        return SubjectSerializer

    def update(self, request, *args, **kwargs):
        
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        
        if serializer.is_valid():
            if 'evaluations_data' in serializer.validated_data:
                evaluations_data = serializer.validated_data.pop('evaluations_data')
                
                # Actualizar campos básicos
                for field, value in serializer.validated_data.items():
                    setattr(instance, field, value)
                instance.save()
                
                # Actualizar evaluaciones 
                existing_evaluations = instance.evaluations.all()
                evaluations_with_grades = existing_evaluations.filter(is_completed=True)
                
                # Borrar solo las que no tienen nota
                existing_evaluations.filter(is_completed=False).delete()
                
                for eval_data in evaluations_data:
                    existing_eval = existing_evaluations.filter(name=eval_data['name']).first()
                    if existing_eval and existing_eval.is_completed:
                        existing_eval.percentage = Decimal(str(eval_data['percentage']))
                        existing_eval.save()
                    else:
                        Evaluation.objects.create(
                            subject=instance,
                            name=eval_data['name'],
                            percentage=Decimal(str(eval_data['percentage']))
                        )
            else:
                instance = serializer.save()
            
            if not hasattr(instance, 'attendance'):
                Attendance.objects.create(subject=instance)
            
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
        # Usamos tu método de cálculo corregido
        estimation = self._calculate_grade_estimation_corrected(subject, target_grade)

        GradeCalculation.objects.create(subject=subject, calculation_data=estimation)
        return Response(estimation, status=200)

    @action(detail=True, methods=['get'])
    def calculation_history(self, request, pk=None):
        subject = self.get_object()
        history = GradeCalculation.objects.filter(subject=subject)
        serializer = GradeCalculationSerializer(history, many=True)
        return Response(serializer.data)

    def _calculate_grade_estimation_corrected(self, subject, target_grade):
        # ... (Tu lógica matemática original se mantiene intacta) ...
        # Copia exacta de tu método original para ahorrar espacio aquí
        # pero asegúrate de que esté incluido en el archivo final.
        evaluations = subject.evaluations.all()
        completed_evaluations = evaluations.filter(is_completed=True)
        pending_evaluations = evaluations.filter(is_completed=False)
        
        puntos_actuales = Decimal('0')
        peso_completado = Decimal('0')
        completed_data = []
        for evaluation in completed_evaluations:
            peso = evaluation.percentage / 100
            puntos_contribuidos = evaluation.grade * peso
            puntos_actuales += puntos_contribuidos
            peso_completado += peso
            completed_data.append({
                'name': evaluation.name, 'percentage': float(evaluation.percentage),
                'grade': float(evaluation.grade), 'points_contributed': float(puntos_contribuidos)
            })
            
        puntos_necesarios = target_grade - puntos_actuales
        peso_pendiente = Decimal('0')
        pending_data = []
        for evaluation in pending_evaluations:
            peso = evaluation.percentage / 100
            peso_pendiente += peso
            pending_data.append({
                'id': evaluation.id, 'name': evaluation.name,
                'percentage': float(evaluation.percentage), 'weight': float(peso)
            })
            
        status = ''
        recommendations = []
        if peso_pendiente == 0:
            promedio_final = puntos_actuales
            if promedio_final >= target_grade:
                status = 'objetivo_alcanzado'
                recommendations.append(f'¡Felicidades! Ya alcanzaste el promedio objetivo con {promedio_final:.2f}')
            else:
                status = 'objetivo_no_alcanzado'
                recommendations.append(f'Promedio actual: {promedio_final:.2f}. No alcanzaste el objetivo de {target_grade}')
        else:
            if puntos_necesarios <= 0:
                status = 'objetivo_alcanzado'
                recommendations.append('¡Ya alcanzaste tu objetivo! Cualquier nota en las evaluaciones restantes mantendrá tu promedio.')
                for pending in pending_data: pending['suggested_grade'] = 1.0
            else:
                promedio_necesario = puntos_necesarios / peso_pendiente
                if promedio_necesario > 7.0:
                    status = 'objetivo_imposible'
                    recommendations.append(f'Es imposible alcanzar el objetivo. Necesitarías un promedio de {promedio_necesario:.2f}')
                    for pending in pending_data: pending['suggested_grade'] = 7.0
                elif promedio_necesario <= 4.0:
                    status = 'objetivo_facil'
                    recommendations.append(f'Objetivo fácil. Promedio necesario: {promedio_necesario:.2f}')
                else:
                    status = 'objetivo_dificil'
                    recommendations.append(f'Objetivo posible. Promedio necesario: {promedio_necesario:.2f}')
                
                for pending in pending_data:
                    nota_minima = max(1.0, min(7.0, float(promedio_necesario)))
                    pending['suggested_grade'] = round(nota_minima, 1)
        
        return {
            'subject_id': subject.id, 'subject_name': subject.name,
            'target_grade': float(target_grade), 'current_points': float(puntos_actuales),
            'points_needed': float(puntos_necesarios), 'completed_evaluations': completed_data,
            'pending_evaluations': pending_data, 'status': status, 'recommendations': recommendations
        }

# ==================== EVALUATION VIEWSET  ====================

class EvaluationViewSet(viewsets.ModelViewSet):
    serializer_class = EvaluationSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        return Evaluation.objects.filter(subject__user=self.request.user)

# ==================== DASHBOARD  ====================

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def dashboard_summary(request):
    user = request.user
    
    # IMPORTANTE: Filtrar dashboard solo por el periodo ACTIVO
    # Si no hay periodo activo, no muestra nada (o muestra todo, depende de tu gusto)
    subjects = Subject.objects.filter(user=user).prefetch_related('evaluations', 'attendance')
    
    periodo_activo = PeriodoAcademico.objects.filter(usuario=user, activo=True).first()
    if periodo_activo:
        subjects = subjects.filter(periodo=periodo_activo)
        # Podrías agregar el nombre del periodo en la respuesta
        periodo_label = periodo_activo.nombre
    else:
        # Si no tiene semestres creados, mostramos todo por defecto (compatibilidad)
        periodo_label = "Histórico (Sin Periodo)"

    summary = {
        'period_name': periodo_label,
        'total_subjects': subjects.count(),
        'subjects_at_risk': 0,
        'subjects_passed': 0,
        'subjects_pending': 0,
        'attendance_alerts': 0,
        'recent_calculations': 0
    }

    for subject in subjects:
        if hasattr(subject, 'attendance') and subject.attendance.is_at_risk:
            summary['attendance_alerts'] += 1

        completed = subject.evaluations.filter(is_completed=True)
        if completed.exists():
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

    summary['recent_calculations'] = GradeCalculation.objects.filter(
        subject__user=user,
        created_at__gte=timezone.now() - timedelta(days=7)
    ).count()

    return Response(summary, status=200)