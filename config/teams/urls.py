from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TeamViewSet, IdeaViewSet, LandingPageViewSet, TeamDetailView, SubmitRubricScoresView

router = DefaultRouter()
router.register(r'teams', TeamViewSet)
router.register(r'ideas', IdeaViewSet)
router.register(r'landing', LandingPageViewSet, basename='landing')

urlpatterns = [
    path('', include(router.urls)),
    path('teams/<str:team_id>/details/', TeamDetailView.as_view(), name='team-detail'),
    path('teams/scores/submit/', SubmitRubricScoresView.as_view(), name='submit-rubric-scores'),
]
