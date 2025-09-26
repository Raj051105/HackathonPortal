from rest_framework import serializers
from .models import RubricCriterion, IdeaScore

class RubricCriterionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RubricCriterion
        fields = ['id', 'name', 'description']

class IdeaScoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = IdeaScore
        fields = [
            'id',
            'idea',
            'judge',
            'criterion',
            'score',
            'comments',
            'scored_at',
        ]
        read_only_fields = ['judge', 'scored_at']  # Judge set based on logged-in user
