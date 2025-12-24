from django.urls import path
from .views import (
    RegistroUsuarioView,
    LoginUsuarioView,
    LogoutUsuarioView,
    RecuperarContrasenaView,
    ContactView,
    dashboard_summary,
    user_profile
)
from .views import institucion_config

app_name = 'accounts'

urlpatterns = [
    # Autenticación
    path('auth/register/', RegistroUsuarioView.as_view(), name='register'),
    path('auth/login/', LoginUsuarioView.as_view(), name='login'),
    path('auth/logout/', LogoutUsuarioView.as_view(), name='logout'),
    path('auth/reset-password/',
        RecuperarContrasenaView.as_view(), name='password-reset'),

    # Contacto
    path('contact/', ContactView.as_view(), name='contact'),

    # Dashboard y perfil
    path('dashboard/', dashboard_summary, name='dashboard'),
    path('profile/', user_profile, name='profile'),
    path('config/global/', institucion_config, name='global-config'),
]
