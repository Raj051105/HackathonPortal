from rest_framework import serializers
from .models import User

class HelloSerializer(serializers.Serializer):
    message = serializers.CharField(max_length=100)

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role']
