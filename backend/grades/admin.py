from django.contrib import admin
from .models import Subject, Evaluation, Attendance, GradeCalculation

class EvaluationInline(admin.TabularInline):
    model = Evaluation
    extra = 1

@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'subject_type', 'class_type', 'user', 'total_evaluations', 'created_at')
    list_filter = ('subject_type', 'class_type', 'has_attendance_reduction')
    search_fields = ('name', 'user__username')
    inlines = [EvaluationInline]

@admin.register(Evaluation)
class EvaluationAdmin(admin.ModelAdmin):
    list_display = ('name', 'subject', 'percentage', 'grade', 'is_completed', 'date_completed')
    list_filter = ('subject', 'is_completed')
    search_fields = ('name', 'subject__name')

@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('subject', 'theory_absences', 'lab_absences', 'last_updated')
    search_fields = ('subject__name',)

@admin.register(GradeCalculation)
class GradeCalculationAdmin(admin.ModelAdmin):
    list_display = ('subject', 'created_at')
    search_fields = ('subject__name',)
    readonly_fields = ('calculation_data',)
