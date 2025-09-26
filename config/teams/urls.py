from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TeamViewSet, IdeaViewSet, LandingPageViewSet

router = DefaultRouter()
router.register(r'teams', TeamViewSet)
router.register(r'ideas', IdeaViewSet)
router.register(r'landing', LandingPageViewSet, basename='landing')

urlpatterns = [
    path('', include(router.urls)),
]
