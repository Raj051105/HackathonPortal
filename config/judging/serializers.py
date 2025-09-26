from rest_framework import serializers
from .models import RubricCriterion, IdeaScore

class RubricCriterionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RubricCriterion
        fields = ['id', 'name', 'description']

class IdeaScoreSerializer(serializers.ModelSerializer):
    # Optional: to show rubric criterion name and max score in API output
    criterion_name = serializers.CharField(source='criterion.name', read_only=True)
    criterion_max_score = serializers.IntegerField(source='criterion.max_score', read_only=True)

    class Meta:
        model = IdeaScore
        fields = [
            'id',
            'idea',
            'judge',
            'criterion',
            'criterion_name',       # additional read-only fields
            'criterion_max_score',
            'score',
            'comments',
            'scored_at',
        ]
        read_only_fields = ['judge', 'scored_at']  # judge is auto-set

    def validate_score(self, value):
        criterion = self.initial_data.get('criterion')

        # If criterion is provided by ID, fetch max_score
        try:
            criterion_obj = RubricCriterion.objects.get(id=criterion)
        except RubricCriterion.DoesNotExist:
            raise serializers.ValidationError("Rubric criterion does not exist.")

        max_score = criterion_obj.max_score
        if value > max_score:
            raise serializers.ValidationError(f"Score cannot exceed the maximum of {max_score} for this criterion.")
        if value < 0:
            raise serializers.ValidationError("Score cannot be negative.")

        return value

    def create(self, validated_data):
        # Set judge based on logged-in user
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['judge'] = request.user
        return super().create(validated_data)

