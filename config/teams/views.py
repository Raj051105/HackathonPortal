from rest_framework import viewsets, permissions, filters
from rest_framework.views import APIView
from .models import Team, Idea
from .serializers import TeamSerializer, IdeaSerializer
from django_filters.rest_framework import DjangoFilterBackend
from accounts.permissions import IsAdminUser
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum
from judging.models import IdeaScore, RubricCriterion
from django.db.models import Avg


class TeamViewSet(viewsets.ModelViewSet):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['team_id', 'team_name']
    search_fields = ['team_id', 'team_name']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAuthenticated, IsAdminUser]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

class IdeaViewSet(viewsets.ModelViewSet):
    queryset = Idea.objects.all()
    serializer_class = IdeaSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['team', 'sih_ps_id']
    search_fields = ['idea_title', 'sih_ps_id', 'ps_title']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAuthenticated, IsAdminUser]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
class LandingPageViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]  # Adjust if needed

    @action(detail=False, methods=['get'])
    def landing_data(self, request):
        teams = Team.objects.all()
        data = []

        for team in teams:
            primary_idea = team.ideas.filter(is_primary=True).first()
            if not primary_idea:
                continue

            progress = IdeaScore.objects.filter(idea=primary_idea).exists()
            total_marks = IdeaScore.objects.filter(idea=primary_idea).aggregate(total=Sum('score'))['total'] or 0

            data.append({
                'team_id': team.team_id,
                'team_name': team.team_name,
                'primary_ps_id': primary_idea.sih_ps_id,
                'primary_ps_title': primary_idea.ps_title,
                'progress': progress,
                'marks': total_marks,
            })

        return Response(data)
    
class TeamDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, team_id):
        try:
            team = Team.objects.get(team_id=team_id)
        except Team.DoesNotExist:
            return Response({"detail": "Team not found"}, status=404)

        # Primary idea
        primary_idea = team.ideas.filter(is_primary=True).first()
        if not primary_idea:
            return Response({"detail": "Primary idea not found"}, status=404)

        # Aggregate average rubric scores per criterion for primary idea
        scores = IdeaScore.objects.filter(idea=primary_idea)

        rubric_scores = {}
        criteria = RubricCriterion.objects.all()
        for crit in criteria:
            avg_score = scores.filter(criterion=crit).aggregate(avg=Avg('score'))['avg'] or 0
            rubric_scores[crit.name] = avg_score

        # Secondary ideas list (all except primary)
        secondary_ideas_qs = team.ideas.filter(is_primary=False)
        secondary_ideas = [
            {
                "primary_ps_title": idea.ps_title,       # Add PS title
                "primary_ps_description": idea.ps_description,  # Add PS description
                "idea_title": idea.idea_title,
                "idea_description": idea.idea_description,
                "ppt_link": idea.link,
            }
            for idea in secondary_ideas_qs
        ]

        response = {
            "team_id": team.team_id,
            "team_name": team.team_name,
            "primary_idea": {
                "idea_title": primary_idea.idea_title,
                "idea_description": primary_idea.idea_description,
                "primary_ppt_link": primary_idea.link,
            },
            "rubric_scores": rubric_scores,
            "secondary_ideas": secondary_ideas,
        }

        return Response(response)