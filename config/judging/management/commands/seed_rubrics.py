from django.core.management.base import BaseCommand
from judging.models import RubricCriterion

class Command(BaseCommand):
    help = "Seeds the database with rubric criteria for scoring"

    def handle(self, *args, **options):
        criteria = [
            ("Relevance to the Problem Statement", 20),
            ("Innovativeness & Creativity", 20),
            ("Technical Feasibility", 20),
            ("Implementation & Prototype Quality", 25),
            ("Impact & Usefulness", 10),
            ("Presentation & Teamwork", 5),
        ]

        for name, max_score in criteria:
            RubricCriterion.objects.update_or_create(
                name=name,
                defaults={'max_score': max_score, 'description': ''}
            )
        self.stdout.write(self.style.SUCCESS("Rubric criteria created/updated"))
