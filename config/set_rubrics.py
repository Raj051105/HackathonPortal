from judging.models import RubricCriterion

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
print("Rubric criteria created/updated")