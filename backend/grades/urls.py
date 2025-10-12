from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SubjectViewSet,
    EvaluationViewSet,
    dashboard_summary
)

# Crear router y registrar los ViewSets
router = DefaultRouter()
router.register(r'subjects', SubjectViewSet, basename='subject')
router.register(r'evaluations', EvaluationViewSet, basename='evaluation')

urlpatterns = [
    # Endpoints REST automáticos generados por los ViewSets
    path('', include(router.urls)),
    
    # Dashboard específico de grades
    path('dashboard/', dashboard_summary, name='grades-dashboard'),
]
