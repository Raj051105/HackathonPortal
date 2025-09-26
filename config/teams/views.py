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
from django.shortcuts import get_object_or_404
from rest_framework import status


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

            total_ideas = team.ideas.count()
            approved_count = team.ideas.filter(approved=True).count()

            # collect titles of approved ideas for this team
            approved_titles = list(team.ideas.filter(approved=True).values_list('idea_title', flat=True))

            data.append({
                'team_id': team.team_id,
                'team_name': team.team_name,
                'primary_ps_id': primary_idea.sih_ps_id,
                'primary_ps_title': primary_idea.ps_title,
                'progress': progress,
                'marks': total_marks,
                'approved_count': f"{approved_count}/{total_ideas}",
                'approved_titles': approved_titles
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
            }
            for idea in secondary_ideas_qs
        ]

        response = {
            "team_id": team.team_id,
            "team_name": team.team_name,
            "primary_idea": {
                "idea_title": primary_idea.idea_title,
                "idea_description": primary_idea.idea_description,
            },
            "rubric_scores": rubric_scores,
            "secondary_ideas": secondary_ideas,
        }

        return Response(response)
    
class SubmitRubricScoresView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data
        team_id = data.get('team_id')
        scores_data = {k: v for k, v in data.items() if k != 'team_id'}

        team = get_object_or_404(Team, team_id=team_id)
        primary_idea = team.ideas.filter(is_primary=True).first()
        if not primary_idea:
            return Response({"detail": "Primary idea not found for team"}, status=status.HTTP_404_NOT_FOUND)

        judge = request.user

        errors = {}
        saved_scores = []

        for rubric_name, score_value in scores_data.items():
            try:
                criterion = RubricCriterion.objects.get(name=rubric_name)
            except RubricCriterion.DoesNotExist:
                errors[rubric_name] = "Criterion not found"
                continue

            # Validate score_value within range
            if not isinstance(score_value, (int, float)) or score_value < 0 or score_value > criterion.max_score:
                errors[rubric_name] = f"Invalid score. Must be 0 to {criterion.max_score}"
                continue

            # Save or update score
            obj, created = IdeaScore.objects.update_or_create(
                idea=primary_idea,
                judge=judge,
                criterion=criterion,
                defaults={'score': score_value}
            )
            saved_scores.append({
                "criterion": rubric_name,
                "score": score_value,
                "created": created,
            })

        if errors:
            return Response({"errors": errors, "saved_scores": saved_scores}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"detail": "Scores saved", "scores": saved_scores}, status=status.HTTP_200_OK)
    
class ApproveIdeasView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, team_id):
        team = Team.objects.filter(team_id=team_id).first()
        if not team:
            return Response({"detail": "Team not found."}, status=status.HTTP_404_NOT_FOUND)

        approved_idea_titles = request.data.get('approved_ideas', [])

        # Validate idea titles belong to this team
        all_ideas = team.ideas.all()
        all_idea_titles = set(idea.idea_title for idea in all_ideas)
        invalid_titles = [title for title in approved_idea_titles if title not in all_idea_titles]
        if invalid_titles:
            return Response({"detail": f"Invalid idea titles for team: {invalid_titles}"}, status=status.HTTP_400_BAD_REQUEST)

        # Update approval statuses
        # Mark all ideas unapproved first
        all_ideas.update(approved=False)
        # Approve only ideas matching titles
        team.ideas.filter(idea_title__in=approved_idea_titles).update(approved=True)

        return Response({"detail": "Approval statuses updated."}, status=status.HTTP_200_OK)