from django.db import models
from django.conf import settings
from teams.models import Idea  # import Idea model to link here if needed

class RubricCriterion(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    max_score = models.IntegerField(default=0)  # add max score field

    def __str__(self):
        return f"{self.name} ({self.max_score} marks)"


class IdeaScore(models.Model):
    
    idea = models.ForeignKey(Idea, related_name='scores', on_delete=models.CASCADE)
    judge = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    criterion = models.ForeignKey(RubricCriterion, on_delete=models.CASCADE)
    score = models.DecimalField(max_digits=5, decimal_places=2)  # Score scale
    comments = models.TextField(blank=True, null=True)
    scored_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('idea', 'judge', 'criterion')

    def __str__(self):
        return f"Score: {self.score} for {self.criterion} by {self.judge}"
