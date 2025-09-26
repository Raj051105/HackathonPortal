from rest_framework import serializers
from .models import Team, Idea

class TeamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Team
        fields = ['id', 'team_id', 'team_name', 'created_at']

class IdeaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Idea
        fields = [
            'id',
            'team',
            'sih_ps_id',
            'ps_title',
            'ps_description',
            'idea_title',
            'idea_description',
            'link',
            'created_at',
        ]
