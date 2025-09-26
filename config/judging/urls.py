from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RubricCriterionViewSet, IdeaScoreViewSet

router = DefaultRouter()
router.register(r'rubrics', RubricCriterionViewSet)
router.register(r'scores', IdeaScoreViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
