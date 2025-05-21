from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authentication import get_authorization_header
from rest_framework import exceptions
from .serializers import UserSerializer
from .models import User,UserToken, Reset
from .authentication import create_access_token, JWTAuthentication, create_refresh_token, decode_refresh_token
import datetime, random, string
from django.core.mail import send_mail
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from google.oauth2 import id_token
from google.auth.transport.requests import Request

class RegisterAPIView(APIView):
    def post(self, request):
        data = request.data

        if data['password'] != data['password_confirm']:
            raise exceptions.APIException('Password do not match!')

        serializer = UserSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class LoginAPIView(APIView):
    def post(self, request):
        email = request.data['email']
        password = request.data['password']

        user = User.objects.filter(email=email).first()

        if user is None:
            raise exceptions.AuthenticationFailed('invalid creditentials')

        if not user.check_password(password):
            raise exceptions.AuthenticationFailed('invalid creditentials')

        access_token = create_access_token(user.id)
        refresh_token = create_refresh_token(user.id)

        UserToken.objects.create(
            user_id = user.id,
            token = refresh_token,
            expired_at = datetime.datetime.utcnow() + datetime.timedelta(days=7),
        )

        response = Response()
        response.set_cookie(key='refresh_token', value=refresh_token, httponly=True)
        response.data = {
            'token': access_token
        }
        return response


class UserAPIView(APIView):
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


@method_decorator(csrf_exempt, name='dispatch')
class RefreshAPIView(APIView):
    def post(self, request):
        refresh_token = request.COOKIES.get('refresh_token')
        id = decode_refresh_token(refresh_token)

        if not UserToken.objects.filter(
            user_id=id,
            token=refresh_token,
            expired_at__gt=datetime.datetime.now(tz=datetime.timezone.utc)
        ).exists():
            raise exceptions.AuthenticationFailed('unauthenticated')
        access_token = create_access_token(id)
        return Response({
            'token': access_token
        })


class LogoutAPIView(APIView):

    def post(self, request):
        refresh_token = request.COOKIES.get('refresh_token')

        UserToken.objects.filter(token=refresh_token).delete()
        response = Response()
        response.delete_cookie(key='refresh_token')
        response.data = {
            'message': 'success'
        }
        return response


class ForgotAPIView(APIView):
    def post(self, request):
        email = request.data['email']
        token = ''.join(random.choice(string.ascii_lowercase + string.digits) for _ in range(10))
        Reset.objects.create(
            email=email,
            token=token
        )
        url = 'http://localhost:3000/reset/'+token
        send_mail(
            subject='Reset your password',
            message='Click <a href="%s">here</a> to reset your password' % url,
            from_email='from@example.com',
            recipient_list=[email]
        )

        return Response({
            'message': 'success'
        })


class ResetAPIView(APIView):
    def post(self, request):
        data = request.data

        if data['password'] != data['password_confirm']:
            raise exceptions.APIException('Password do not match!')

        reset_password = Reset.objects.filter(token=data['token']).first()

        if not reset_password:
            raise exceptions.APIException('Invalid link!')

        user = User.objects.filter(email=reset_password.email).first()

        if not user:
            raise exceptions.APIException('User not found!')

        user.set_password(data['password'])
        user.save()

        return Response({
            'message': 'success'
        })


class GoogleAuthAPIView(APIView):
    def post(self, request):
        token = request.data.get('token')

        if not token:
            raise exceptions.AuthenticationFailed('Token not provided')

        try:
            googleUser = id_token.verify_oauth2_token(
                token,
                Request(),
                "9816983038-gs6t478e6vo67af9p4askcdsf4qctomv.apps.googleusercontent.com"
            )
        except ValueError as e:
            raise exceptions.AuthenticationFailed('Invalid Google token')

        if not googleUser or 'email' not in googleUser:
            raise exceptions.AuthenticationFailed('Failed to retrieve user info from Google')

        email = googleUser['email']
        first_name = googleUser.get('given_name', '')
        last_name = googleUser.get('family_name', '')

        user = User.objects.filter(email=email).first()

        if not user:
            user = User.objects.create(
                first_name=first_name,
                last_name=last_name,
                email=email
            )
            user.set_password(token)
            user.save()

        access_token = create_access_token(user.id)
        refresh_token = create_refresh_token(user.id)

        UserToken.objects.create(
            user_id=user.id,
            token=refresh_token,
            expired_at=datetime.datetime.utcnow() + datetime.timedelta(days=7),
        )

        response = Response({
            'token': access_token  # ✅ Return JSON with token here!
        })
        response.set_cookie(key='refresh_token', value=refresh_token, httponly=True)
        return response