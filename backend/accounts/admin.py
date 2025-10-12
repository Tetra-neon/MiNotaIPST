from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Usuario

# REGISTRO
@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    """
    Configuración del admin para el modelo Usuario personalizado
    """
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'date_joined')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'date_joined')
    search_fields = ('username', 'first_name', 'last_name', 'email')
    ordering = ('-date_joined',)
    
    # Configurar los fieldsets para el formulario de edición
    fieldsets = UserAdmin.fieldsets + (
        ('Información Adicional', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    
    # Campos de solo lectura
    readonly_fields = ('created_at', 'updated_at', 'date_joined', 'last_login')
    
    # Configurar el formulario de creación
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'first_name', 'last_name', 'password1', 'password2'),
        }),
    )