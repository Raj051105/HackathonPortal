from django.contrib import admin
from .models import Team, Idea

@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ('team_id', 'team_name', 'created_at')
    search_fields = ('team_id', 'team_name')

@admin.register(Idea)
class IdeaAdmin(admin.ModelAdmin):
    list_display = ('idea_title', 'team', 'sih_ps_id', 'created_at')
    search_fields = ('idea_title', 'sih_ps_id', 'ps_title')
    list_filter = ('sih_ps_id',)
