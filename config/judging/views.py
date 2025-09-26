from rest_framework import viewsets
from .models import RubricCriterion, IdeaScore
from .serializers import RubricCriterionSerializer, IdeaScoreSerializer
from accounts.permissions import IsAdminUser, IsJudgeOrAdmin
from rest_framework.permissions import IsAuthenticated

class RubricCriterionViewSet(viewsets.ModelViewSet):
    queryset = RubricCriterion.objects.all()
    serializer_class = RubricCriterionSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]  # Only admins can manage rubrics

class IdeaScoreViewSet(viewsets.ModelViewSet):
    serializer_class = IdeaScoreSerializer
    permission_classes = [IsAuthenticated, IsJudgeOrAdmin]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'judge':
            return IdeaScore.objects.filter(judge=user)
        elif user.role == 'admin':
            return IdeaScore.objects.all()
        return IdeaScore.objects.none()

    def perform_create(self, serializer):
        serializer.save(judge=self.request.user)
