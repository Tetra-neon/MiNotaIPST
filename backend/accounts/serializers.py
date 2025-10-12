from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings

Usuario = get_user_model()

class UsuarioRegistroSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    password_confirm = serializers.CharField(write_only=True)
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)

    class Meta:
        model = Usuario
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'password', 'password_confirm')
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
        }

    def validate_email(self, value):
        if Usuario.objects.filter(email=value).exists():
            raise serializers.ValidationError("Este email ya está registrado.")
        return value

    def validate_username(self, value):
        if len(value) < 3:
            raise serializers.ValidationError("El nombre de usuario debe tener al menos 3 caracteres.")
        return value

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({"password_confirm": "Las contraseñas no coinciden."})
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        usuario = Usuario.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name']
        )
        
        # Enviar correo de bienvenida
        try:
            send_mail(
                subject='¡Bienvenido a MiNotaIPST! 🎓',
                message=f"""
                Hola {usuario.first_name},
                
                ¡Tu cuenta en MiNotaIPST ha sido creada exitosamente!
                
                Ahora puedes:
                - Gestionar tus asignaturas
                - Calcular tus notas
                - Controlar tu asistencia
                - Ver estadísticas de tu rendimiento
                
                Usuario: {usuario.username}
                
                ¡Éxito en tus estudios!
                
                Equipo MiNotaIPST
                """,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[usuario.email],
                fail_silently=True,
            )
        except Exception as e:
            print(f"Error al enviar email de bienvenida: {e}")
            
        return usuario

class UsuarioSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Usuario
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'full_name', 'created_at')
        read_only_fields = ('created_at',)
    
    def get_full_name(self, obj):
        return obj.get_full_name()