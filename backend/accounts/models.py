from django.contrib.auth.models import AbstractUser
from django.db import models


class Usuario(AbstractUser):
    """
    Modelo de usuario personalizado que extiende AbstractUser
    """
    email = models.EmailField(
        unique=True,
        verbose_name='Correo Electrónico',
        help_text='Dirección de correo electrónico única'
    )
    
    first_name = models.CharField(
        max_length=30,
        verbose_name='Nombre',
        blank=False
    )
    
    last_name = models.CharField(
        max_length=30,
        verbose_name='Apellido',
        blank=False
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de Registro'
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Última Actualización'
    )
    
    # Hacer que el email sea el campo de login principal
    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email', 'first_name', 'last_name']
    
    class Meta:
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
        ordering = ['username']
    
    def __str__(self):
        return f"{self.username} - {self.first_name} {self.last_name}"
    
    def get_full_name(self):
        """
        Retorna el nombre completo del usuario
        """
        return f"{self.first_name} {self.last_name}".strip()
    
    def get_short_name(self):
        """
        Retorna el primer nombre del usuario
        """
        return self.first_name