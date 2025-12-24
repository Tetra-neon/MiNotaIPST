from rest_framework import serializers
from django.contrib.auth import authenticate
from django.core.mail import send_mail
from django.conf import settings
from decimal import Decimal
from .models import Subject, Evaluation, Attendance, GradeCalculation, PeriodoAcademico # <-- Agregado PeriodoAcademico
from django.contrib.auth import get_user_model
User = get_user_model()

# ==================== USUARIOS ====================

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6, style={'input_type': 'password'})
    password_confirm = serializers.CharField(write_only=True, style={'input_type': 'password'})
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm', 'first_name', 'last_name']
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
        }
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Este email ya está registrado.")
        return value
    
    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Este nombre de usuario ya está registrado.")
        return value
    
    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError("Las contraseñas no coinciden.")
        return data
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name']
        )
        try:
            send_mail(
                subject='¡Bienvenido a Calculadora de Notas!',
                message=f'Hola {user.first_name},\n\nTu cuenta ha sido creada exitosamente.\nUsuario: {user.username}\n\n¡Ya puedes comenzar a gestionar tus calificaciones!',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=True,
            )
        except Exception as e:
            print(f"Error enviando email: {e}")
        return user

class UserLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(style={'input_type': 'password'})
    
    def validate(self, data):
        username = data.get('username')
        password = data.get('password')
        if username and password:
            user = authenticate(username=username, password=password)
            if user:
                if user.is_active:
                    data['user'] = user
                else:
                    raise serializers.ValidationError("La cuenta está desactivada.")
            else:
                raise serializers.ValidationError("Credenciales incorrectas.")
        else:
            raise serializers.ValidationError("Debe proporcionar usuario y contraseña.")
        return data

class PasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()
    def validate_email(self, value):
        try:
            self.user = User.objects.get(email=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("No existe una cuenta con este email.")
        return value

# ==================== PERIODOS ACADÉMICOS ====================

class PeriodoAcademicoSerializer(serializers.ModelSerializer):
    class Meta:
        model = PeriodoAcademico
        fields = ['id', 'nombre', 'fecha_inicio', 'fecha_fin', 'activo']
        read_only_fields = ['id']

# ==================== EVALUACIONES Y ASISTENCIA ====================

class EvaluationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Evaluation
        fields = ['id', 'name', 'percentage', 'grade', 'is_completed', 'date_completed', 'created_at']
        read_only_fields = ['id', 'is_completed', 'date_completed', 'created_at']
    
    def validate_grade(self, value):
        if value is not None and (value < 1.0 or value > 7.0):
            raise serializers.ValidationError("La nota debe estar entre 1.0 y 7.0")
        return value

class AttendanceSerializer(serializers.ModelSerializer):
    theory_attendance_percentage = serializers.ReadOnlyField()
    lab_attendance_percentage = serializers.ReadOnlyField()
    is_at_risk = serializers.ReadOnlyField()
    max_additional_absences = serializers.ReadOnlyField()
    
    class Meta:
        model = Attendance
        fields = ['theory_absences', 'lab_absences', 'last_updated', 'theory_attendance_percentage', 'lab_attendance_percentage', 'is_at_risk', 'max_additional_absences']
        read_only_fields = ['last_updated']

# ==================== ASIGNATURAS (Actualizado con Periodo) ====================

class SubjectSerializer(serializers.ModelSerializer):
    evaluations = EvaluationSerializer(many=True, read_only=True)
    attendance = AttendanceSerializer(read_only=True)
    # Mostramos el nombre del periodo para referencia
    periodo_nombre = serializers.CharField(source='periodo.nombre', read_only=True)
    
    passing_grade = serializers.ReadOnlyField()
    minimum_grade_for_exam = serializers.ReadOnlyField()
    required_attendance_percentage = serializers.ReadOnlyField()
    
    current_average = serializers.SerializerMethodField()
    remaining_evaluations = serializers.SerializerMethodField()
    needs_final_exam = serializers.SerializerMethodField()
    
    class Meta:
        model = Subject
        fields = [
            'id', 'name', 'subject_type', 'class_type', 'periodo', 'periodo_nombre', # <-- Agregado
            'total_evaluations', 'total_theory_classes', 'total_lab_classes', 'has_attendance_reduction',
            'passing_grade', 'minimum_grade_for_exam', 'required_attendance_percentage',
            'evaluations', 'attendance', 'current_average', 'remaining_evaluations',
            'needs_final_exam', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate(self, data):
        total_theory = data.get('total_theory_classes', 0)
        total_lab = data.get('total_lab_classes', 0)
        if total_theory == 0 and total_lab == 0:
            raise serializers.ValidationError("Debe tener al menos clases de teoría o laboratorio.")
        return data
    
    def get_current_average(self, obj):
        completed_evaluations = obj.evaluations.filter(is_completed=True)
        if not completed_evaluations.exists():
            return None
        
        total_weight = Decimal('0')
        weighted_sum = Decimal('0')
        
        for evaluation in completed_evaluations:
            weight = evaluation.percentage / 100
            weighted_sum += evaluation.grade * weight
            total_weight += weight
        
        if total_weight > 0:
            current_avg = weighted_sum / total_weight
            return round(float(current_avg), 1)
        return None
    
    def get_remaining_evaluations(self, obj):
        pending = obj.evaluations.filter(is_completed=False)
        return EvaluationSerializer(pending, many=True).data
    
    def get_needs_final_exam(self, obj):
        current_avg = self.get_current_average(obj)
        if current_avg is None:
            return None
        return current_avg < float(obj.passing_grade)

class SubjectCreateSerializer(serializers.ModelSerializer):
    evaluations_data = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        help_text="Lista de evaluaciones con 'name' y 'percentage'"
    )
    
    class Meta:
        model = Subject
        fields = [
            'name', 'subject_type', 'class_type', 'periodo', # <-- Agregado periodo
            'total_evaluations', 'total_theory_classes', 'total_lab_classes', 
            'has_attendance_reduction', 'evaluations_data'
        ]
        extra_kwargs = {
            'periodo': {'required': False} # Opcional, si no se envía, lo manejamos en la vista
        }
    
    def validate_evaluations_data(self, value):
        if len(value) != self.initial_data.get('total_evaluations'):
            raise serializers.ValidationError("El número de evaluaciones no coincide con total_evaluations")
        
        total_percentage = Decimal('0')
        for eval_data in value:
            if 'name' not in eval_data or 'percentage' not in eval_data:
                raise serializers.ValidationError("Cada evaluación debe tener 'name' y 'percentage'")
            try:
                percentage = Decimal(str(eval_data['percentage']))
                if percentage <= 0 or percentage > 100:
                    raise serializers.ValidationError("Los porcentajes deben estar entre 0.01 y 100")
                total_percentage += percentage
            except (ValueError, TypeError):
                raise serializers.ValidationError("Los porcentajes deben ser números válidos")
        
        if total_percentage != 100:
            raise serializers.ValidationError(f"Los porcentajes deben sumar 100%. Suma actual: {total_percentage}%")
        return value
    
    def create(self, validated_data):
        evaluations_data = validated_data.pop('evaluations_data')
        validated_data['user'] = self.context['request'].user
        
        # Si no enviaron periodo, buscamos el activo
        if 'periodo' not in validated_data or validated_data['periodo'] is None:
            periodo_activo = PeriodoAcademico.objects.filter(usuario=validated_data['user'], activo=True).first()
            if periodo_activo:
                validated_data['periodo'] = periodo_activo
            # Si no hay activo, se creará sin periodo (o podrías lanzar error)

        subject = Subject.objects.create(**validated_data)
        
        for eval_data in evaluations_data:
            Evaluation.objects.create(
                subject=subject,
                name=eval_data['name'],
                percentage=Decimal(str(eval_data['percentage']))
            )
        Attendance.objects.create(subject=subject)
        return subject

# ==================== CALCULOS Y ESTIMACIONES ====================

class GradeCalculationSerializer(serializers.ModelSerializer):
    class Meta:
        model = GradeCalculation
        fields = ['id', 'calculation_data', 'created_at']
        read_only_fields = ['id', 'created_at']

class GradeEstimationSerializer(serializers.Serializer):
    target_grade = serializers.DecimalField(max_digits=3, decimal_places=1, required=False)
    
    def validate_target_grade(self, value):
        if value is not None and (value < 1.0 or value > 7.0):
            raise serializers.ValidationError("La nota objetivo debe estar entre 1.0 y 7.0")
        return value