from judging.models import RubricCriterion

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
print("Rubric criteria created/updated")