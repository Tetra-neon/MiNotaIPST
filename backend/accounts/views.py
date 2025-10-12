from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate, get_user_model
from django.core.mail import send_mail, EmailMultiAlternatives
from django.conf import settings
from django.utils.crypto import get_random_string
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from .serializers import UsuarioRegistroSerializer, UsuarioSerializer
import re 

Usuario = get_user_model()


class RegistroUsuarioView(APIView):
    """Vista para registrar un nuevo usuario"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = UsuarioRegistroSerializer(data=request.data)
        if serializer.is_valid():
            usuario = serializer.save()

            # Crear token JWT
            refresh = RefreshToken.for_user(usuario)

            return Response({
                "message": "Usuario registrado correctamente",
                "user": {
                    "id": usuario.id,
                    "username": usuario.username,
                    "email": usuario.email,
                    "first_name": usuario.first_name,
                    "last_name": usuario.last_name,
                },
                "tokens": {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                }
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginUsuarioView(APIView):
    """Vista para iniciar sesión (login)"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        if not username or not password:
            return Response(
                {"error": "Por favor proporciona usuario y contraseña"},
                status=status.HTTP_400_BAD_REQUEST
            )

        usuario = authenticate(username=username, password=password)

        if usuario is not None:
            refresh = RefreshToken.for_user(usuario)
            return Response({
                "message": "Login exitoso",
                "user": {
                    "id": usuario.id,
                    "username": usuario.username,
                    "email": usuario.email,
                    "first_name": usuario.first_name,
                    "last_name": usuario.last_name,
                },
                "tokens": {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                }
            })
        else:
            return Response(
                {"error": "Credenciales inválidas"},
                status=status.HTTP_401_UNAUTHORIZED
            )


class LogoutUsuarioView(APIView):
    """Vista para cerrar sesión (blacklist del token)"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh_token")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response(
                {"message": "Sesión cerrada correctamente"},
                status=status.HTTP_205_RESET_CONTENT
            )
        except Exception as e:
            return Response(
                {"error": "Token inválido o expirado"},
                status=status.HTTP_400_BAD_REQUEST
            )


class RecuperarContrasenaView(APIView):
    """Vista para recuperación de contraseña por email"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get("email")

        if not email:
            return Response(
                {"error": "Por favor proporciona un correo electrónico"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            usuario = Usuario.objects.get(email=email)
            nueva_contrasena = get_random_string(length=8)
            usuario.set_password(nueva_contrasena)
            usuario.save()

            # Enviar nueva contraseña por correo
            send_mail(
                subject='Recuperación de contraseña - MiNotaIPST',
                message=f"""
                Hola {usuario.first_name},
                
                Has solicitado restablecer tu contraseña.
                
                Tu nueva contraseña temporal es: {nueva_contrasena}
                
                Por seguridad, te recomendamos cambiar esta contraseña después de iniciar sesión.
                
                Si no solicitaste este cambio, por favor contáctanos inmediatamente.
                
                Saludos,
                Equipo MiNotaIPST
                """,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[usuario.email],
                fail_silently=False,
            )

            return Response(
                {"message": "Nueva contraseña enviada al correo."},
                status=status.HTTP_200_OK
            )
        except Usuario.DoesNotExist:
            return Response(
                {"error": "No existe una cuenta con ese correo electrónico"},
                status=status.HTTP_404_NOT_FOUND
            )


class ContactView(APIView):
    """Vista para manejar el formulario de contacto"""
    permission_classes = [permissions.AllowAny]  # Permitir acceso sin autenticación

    def post(self, request):
        nombre = request.data.get("nombre")
        email = request.data.get("email")
        asunto = request.data.get("asunto")
        mensaje = request.data.get("mensaje")
        tipo_consulta = request.data.get("tipo_consulta", "general")

        # Validaciones
        if not all([nombre, email, asunto, mensaje]):
            return Response(
                {"error": "Todos los campos son requeridos"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validar formato de email
        if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
            return Response(
                {"error": "El formato del email no es válido"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Preparar el mensaje HTML
            mensaje_html = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }}
                    .content {{ background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }}
                    .field {{ margin-bottom: 15px; }}
                    .field-label {{ font-weight: bold; color: #4a5568; }}
                    .field-value {{ margin-top: 5px; padding: 10px; background: white; border-radius: 4px; }}
                    .footer {{ margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 0.9em; color: #718096; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>🎓 Nuevo Mensaje de Contacto - MiNotaIPST</h2>
                    </div>
                    <div class="content">
                        <div class="field">
                            <div class="field-label">Tipo de Consulta:</div>
                            <div class="field-value">{tipo_consulta.upper()}</div>
                        </div>
                        <div class="field">
                            <div class="field-label">Nombre:</div>
                            <div class="field-value">{nombre}</div>
                        </div>
                        <div class="field">
                            <div class="field-label">Email:</div>
                            <div class="field-value">{email}</div>
                        </div>
                        <div class="field">
                            <div class="field-label">Asunto:</div>
                            <div class="field-value">{asunto}</div>
                        </div>
                        <div class="field">
                            <div class="field-label">Mensaje:</div>
                            <div class="field-value">{mensaje}</div>
                        </div>
                        <div class="footer">
                            <p>Este mensaje fue enviado desde el formulario de contacto de MiNotaIPST</p>
                            <p>Fecha: {timezone.localtime().strftime('%d/%m/%Y %H:%M')}</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
            """

            # Enviar email
            email_subject = f"[MiNotaIPST - {tipo_consulta.upper()}] {asunto}"
            
            # Crear mensaje de texto plano como respaldo
            mensaje_texto = f"""
            Nuevo mensaje de contacto - MiNotaIPST
            
            Tipo de Consulta: {tipo_consulta.upper()}
            Nombre: {nombre}
            Email: {email}
            Asunto: {asunto}
            
            Mensaje:
            {mensaje}
            
            ---
            Enviado: {timezone.localtime().strftime('%d/%m/%Y %H:%M')}
            """

            # Crear el email
            msg = EmailMultiAlternatives(
                email_subject,
                mensaje_texto,
                settings.DEFAULT_FROM_EMAIL,
                [settings.DEFAULT_FROM_EMAIL],
                reply_to=[email]  # Permitir responder directamente al remitente
            )
            
            # Adjuntar versión HTML
            msg.attach_alternative(mensaje_html, "text/html")
            
            # Enviar
            msg.send(fail_silently=False)

            # Enviar confirmación al usuario
            confirmacion_html = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px; text-align: center; }}
                    .content {{ padding: 30px; }}
                    .button {{ display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>¡Mensaje Recibido!</h1>
                        <p>Gracias por contactarnos</p>
                    </div>
                    <div class="content">
                        <p>Hola {nombre},</p>
                        <p>Hemos recibido tu mensaje correctamente. Nuestro equipo lo revisará y te responderemos a la brevedad posible.</p>
                        <p><strong>Resumen de tu consulta:</strong></p>
                        <ul>
                            <li><strong>Asunto:</strong> {asunto}</li>
                            <li><strong>Tipo:</strong> {tipo_consulta}</li>
                        </ul>
                        <p>Si tienes alguna pregunta urgente, no dudes en escribirnos nuevamente.</p>
                        <p>Saludos cordiales,<br>Equipo MiNotaIPST</p>
                    </div>
                </div>
            </body>
            </html>
            """

            # Enviar confirmación
            confirmacion = EmailMultiAlternatives(
                "Confirmación: Hemos recibido tu mensaje - MiNotaIPST",
                f"Hola {nombre}, hemos recibido tu mensaje. Te responderemos pronto.",
                settings.DEFAULT_FROM_EMAIL,
                [email]
            )
            confirmacion.attach_alternative(confirmacion_html, "text/html")
            confirmacion.send(fail_silently=True)

            return Response({
                "message": "Mensaje enviado correctamente. Te responderemos pronto.",
                "success": True
            }, status=status.HTTP_200_OK)

        except Exception as e:
            print(f"Error al enviar email de contacto: {e}")
            return Response(
                {"error": "Error al enviar el mensaje. Por favor, intenta más tarde."}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_summary(request):
    """Vista para obtener el resumen del dashboard"""
    usuario = request.user

    # Aquí agregar lógica para obtener datos reales
    # Por ahora retornamos datos de ejemplo
    return Response({
        "message": "Dashboard cargado correctamente",
        "user": {
            "username": usuario.username,
            "full_name": usuario.get_full_name(),
            "email": usuario.email,
        },
        "resumen": {
            "promedio_general": 0,
            "asignaturas_total": 0,
            "asignaturas_aprobadas": 0,
            "creditos_totales": 0,
            "creditos_aprobados": 0,
            "asistencia_promedio": 0,
            "evaluaciones_pendientes": 0,
            "riesgo_reprobacion": []
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    """Vista para obtener el perfil del usuario actual"""
    serializer = UsuarioSerializer(request.user)
    return Response(serializer.data)