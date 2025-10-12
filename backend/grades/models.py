from decimal import Decimal
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models


class Subject(models.Model):
    SUBJECT_TYPES = [
        ('carrera', 'Asignatura de Carrera (5.3)'),
        ('complementaria', 'Asignatura Complementaria (5.5)'),
    ]

    CLASS_TYPES = [
        ('teoria', 'Teoría (75% asistencia)'),
        ('laboratorio', 'Laboratorio (90% asistencia)'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='subjects',
        verbose_name='Usuario'
    )

    name = models.CharField(
        max_length=200,
        verbose_name='Nombre de la Asignatura'
    )

    subject_type = models.CharField(
        max_length=15,
        choices=SUBJECT_TYPES,
        verbose_name='Tipo de Asignatura'
    )

    class_type = models.CharField(
        max_length=15,
        choices=CLASS_TYPES,
        default='teoria',
        verbose_name='Tipo de Clase'
    )

    total_evaluations = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(10)],
        verbose_name='Cantidad Total de Evaluaciones',
        blank=True  # Recomendación para evitar errores en formularios
    )

    total_theory_classes = models.PositiveIntegerField(
        default=0,
        verbose_name='Total de Clases Teóricas'
    )

    total_lab_classes = models.PositiveIntegerField(
        default=0,
        verbose_name='Total de Clases de Laboratorio'
    )

    has_attendance_reduction = models.BooleanField(
        default=False,
        verbose_name='Tiene Rebaja de Asistencia'
    )

    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de Creación')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Última Actualización')

    class Meta:
        verbose_name = 'Asignatura'
        verbose_name_plural = 'Asignaturas'
        ordering = ['name']
        unique_together = ['user', 'name']

    def __str__(self):
        return f"{self.name} - {self.user.username}"

    @property
    def passing_grade(self):
        return Decimal('5.3') if self.subject_type == 'carrera' else Decimal('5.5')

    @property
    def minimum_grade_for_exam(self):
        return Decimal('3.9') #La nota para no dar examen verificar con los profesores y cambiar si es otro numero (reglamento interno verifiacar)

    @property
    def required_attendance_percentage(self):
        if self.class_type == 'teoria':
            return 75
        elif self.class_type == 'laboratorio':
            return 90


class Evaluation(models.Model):
    subject = models.ForeignKey(
        Subject,
        on_delete=models.CASCADE,
        related_name='evaluations',
        verbose_name='Asignatura'
    )

    name = models.CharField(max_length=100, verbose_name='Nombre de la Evaluación')

    percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(0.01), MaxValueValidator(100.00)],
        verbose_name='Porcentaje (%)'
    )

    grade = models.DecimalField(
        max_digits=3,
        decimal_places=1,
        null=True,
        blank=True,
        validators=[MinValueValidator(1.0), MaxValueValidator(7.0)],
        verbose_name='Nota Obtenida'
    )

    is_completed = models.BooleanField(default=False, verbose_name='Evaluación Completada')

    date_completed = models.DateField(null=True, blank=True, verbose_name='Fecha de Realización')

    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de Creación')

    class Meta:
        verbose_name = 'Evaluación'
        verbose_name_plural = 'Evaluaciones'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} - {self.subject.name}"

    def save(self, *args, **kwargs):
        if self.grade is not None:
            self.is_completed = True
            if not self.date_completed:
                from django.utils import timezone
                self.date_completed = timezone.now().date()
        else:
            self.is_completed = False
            self.date_completed = None

        super().save(*args, **kwargs)


class Attendance(models.Model):
    subject = models.OneToOneField(
        Subject,
        on_delete=models.CASCADE,
        related_name='attendance',
        verbose_name='Asignatura'
    )

    theory_absences = models.PositiveIntegerField(default=0, verbose_name='Inasistencias Teoría')
    lab_absences = models.PositiveIntegerField(default=0, verbose_name='Inasistencias Laboratorio')
    last_updated = models.DateTimeField(auto_now=True, verbose_name='Última Actualización')

    class Meta:
        verbose_name = 'Asistencia'
        verbose_name_plural = 'Asistencias'

    def __str__(self):
        return f"Asistencia - {self.subject.name}"

    @property
    def total_theory_classes_attended(self):
        return max(0, self.subject.total_theory_classes - self.theory_absences)

    @property
    def total_lab_classes_attended(self):
        return max(0, self.subject.total_lab_classes - self.lab_absences)

    @property
    def theory_attendance_percentage(self):
        if self.subject.total_theory_classes == 0:
            return 100
        attended = self.total_theory_classes_attended
        total = self.subject.total_theory_classes
        return (attended / total) * 100

    @property
    def lab_attendance_percentage(self):
        if self.subject.total_lab_classes == 0:
            return 100
        attended = self.total_lab_classes_attended
        total = self.subject.total_lab_classes
        return (attended / total) * 100

    @property
    def is_at_risk(self):
        theory_ok = True
        lab_ok = True

        if self.subject.total_theory_classes > 0:
            required = 65 if self.subject.has_attendance_reduction else 75
            theory_ok = self.theory_attendance_percentage >= required

        if self.subject.total_lab_classes > 0:
            required = 80 if self.subject.has_attendance_reduction else 90
            lab_ok = self.lab_attendance_percentage >= required

        return not (theory_ok and lab_ok)

    @property
    def max_additional_absences(self):
        max_theory_absences = 0
        max_lab_absences = 0

        if self.subject.total_theory_classes > 0:
            required_percentage = 65 if self.subject.has_attendance_reduction else 75
            min_attendance = int((self.subject.total_theory_classes * required_percentage) / 100)
            max_theory_absences = max(0, self.subject.total_theory_classes - min_attendance - self.theory_absences)

        if self.subject.total_lab_classes > 0:
            required_percentage = 80 if self.subject.has_attendance_reduction else 90
            min_attendance = int((self.subject.total_lab_classes * required_percentage) / 100)
            max_lab_absences = max(0, self.subject.total_lab_classes - min_attendance - self.lab_absences)

        return {
            'theory': max_theory_absences,
            'lab': max_lab_absences
        }


class GradeCalculation(models.Model):
    subject = models.ForeignKey(
        Subject,
        on_delete=models.CASCADE,
        related_name='calculations',
        verbose_name='Asignatura'
    )

    calculation_data = models.JSONField(verbose_name='Datos del Cálculo')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de Cálculo')

    class Meta:
        verbose_name = 'Cálculo de Notas'
        verbose_name_plural = 'Cálculos de Notas'
        ordering = ['-created_at']

    def __str__(self):
        return f"Cálculo - {self.subject.name} - {self.created_at.strftime('%d/%m/%Y')}"
