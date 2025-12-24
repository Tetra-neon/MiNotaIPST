from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)

urlpatterns = [
    # Panel de administración
    path('admin/', admin.site.urls),

    # Endpoints JWT estándar
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),

    # Apps del proyecto
    # URLs de autenticación personalizada
    path('api/auth/', include('djoser.urls')),
    path('api/auth/', include('djoser.urls.jwt')), # Para login/refresh/verify con djoser
    path('api/', include('accounts.urls')),
    # URLs de grades (subjects, evaluations, etc.)
    path('api/', include('grades.urls')),
]
