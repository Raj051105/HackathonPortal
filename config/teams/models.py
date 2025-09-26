from django.db import models
from django.conf import settings

class Team(models.Model):
    team_id = models.CharField(max_length=50, unique=True)
    team_name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.team_name

class Idea(models.Model):
    team = models.ForeignKey(Team, related_name='ideas', on_delete=models.CASCADE)
    sih_ps_id = models.CharField(max_length=100)  # Problem Statement ID
    ps_title = models.CharField(max_length=300)   # Problem Statement title
    ps_description = models.TextField()           # Problem Statement detailed description
    idea_title = models.CharField(max_length=200)  # Idea title
    idea_description = models.TextField()         # Idea description
    link = models.URLField(max_length=500, blank=True, null=True)  # Optional Idea URL
    is_primary = models.BooleanField(default=False)  # Primary idea flag
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.idea_title} ({'Primary' if self.is_primary else 'Secondary'}) - {self.team.team_name}"