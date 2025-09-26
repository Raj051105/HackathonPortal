from django.core.management.base import BaseCommand
from judging.models import RubricCriterion

class Command(BaseCommand):
    help = "Seeds the database with rubric criteria for scoring"

    def handle(self, *args, **options):
        criteria = [
            ("Problem Understanding", 20),
            ("Innovativeness", 20),
            ("Feasibility", 15),
            ("Prototype Quality", 20),
            ("Impact", 15),
            ("Presentation/Teamwork", 10),
        ]

        for name, max_score in criteria:
            RubricCriterion.objects.update_or_create(
                name=name,
                defaults={'max_score': max_score, 'description': ''}
            )
        self.stdout.write(self.style.SUCCESS("Rubric criteria created/updated"))
