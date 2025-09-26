from django.contrib import admin
from .models import RubricCriterion, IdeaScore

@admin.register(RubricCriterion)
class RubricCriterionAdmin(admin.ModelAdmin):
    list_display = ('name',)

@admin.register(IdeaScore)
class IdeaScoreAdmin(admin.ModelAdmin):
    list_display = ('idea', 'judge', 'criterion', 'score', 'scored_at')
    list_filter = ('criterion', 'judge')
