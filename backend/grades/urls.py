from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SubjectViewSet, EvaluationViewSet, dashboard_summary, PeriodoViewSet # <-- Importa PeriodoViewSet

router = DefaultRouter()
router.register(r'subjects', SubjectViewSet, basename='subject')
router.register(r'evaluations', EvaluationViewSet, basename='evaluation')
router.register(r'periodos', PeriodoViewSet, basename='periodo')  # <-- Registra el ViewSet de Periodos

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/summary/', dashboard_summary, name='dashboard-summary'),
]