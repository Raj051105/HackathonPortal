from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import viewsets
from .models import User
from .serializers import UserSerializer
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.permissions import BasePermission

class IsAdminUser(BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'admin'

class IsJudgeUser(BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'judge'

class HelloView(APIView):
    def get(self, request):
        return Response({"message": "Hello, DRF!"})

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_permissions(self):
        if self.action in ['create', 'destroy', 'update', 'partial_update']:
            permission_classes = [IsAdminUser]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
