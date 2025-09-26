from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model
from teams.models import Team, Idea
from judging.models import IdeaScore
import pandas as pd
from django.db import transaction

User = get_user_model()

class Command(BaseCommand):
    help = 'Import data from an Excel file to populate Users, Teams and Ideas (primary + up to 4 extra ideas per team). Rubrics are intentionally not modified.'

    def add_arguments(self, parser):
        parser.add_argument('file', type=str, help='Path to the Excel file to import')

    def handle(self, *args, **options):
        filepath = options['file']
        try:
            xls = pd.ExcelFile(filepath)
        except Exception as e:
            raise CommandError(f'Failed to open Excel file: {e}')

        # Helper to read sheet if exists
        def read_sheet(name):
            if name in xls.sheet_names:
                return pd.read_excel(xls, sheet_name=name)
            return None

        # Read sheets by conventional names
        users_df = read_sheet('Users')
        teams_df = read_sheet('Teams')
        ideas_df = read_sheet('Ideas')
        scores_df = read_sheet('IdeaScores') or read_sheet('Scores')

        with transaction.atomic():
            # Import users (optional)
            if users_df is not None:
                self.stdout.write('Importing Users...')
                for _, row in users_df.fillna('').iterrows():
                    username = str(row.get('username') or row.get('email') or '').strip()
                    if not username:
                        continue
                    email = str(row.get('email') or '').strip()
                    role = str(row.get('role') or 'judge').strip()
                    password = str(row.get('password') or 'changeme123')
                    user, created = User.objects.update_or_create(
                        username=username,
                        defaults={'email': email, 'role': role}
                    )
                    if created:
                        user.set_password(password)
                        user.save()

            # NOTE: Rubric imports intentionally skipped as requested

            # Import teams and parse primary + up to 4 extra ideas from each row
            if teams_df is not None:
                self.stdout.write('Importing Teams and Ideas from Teams sheet...')
                for _, row in teams_df.fillna('').iterrows():
                    team_id = str(row.get('team_id') or row.get('Team ID') or '').strip()
                    if not team_id:
                        continue
                    team_name = str(row.get('team_name') or row.get('Team Name') or '').strip() or team_id
                    team, _ = Team.objects.update_or_create(
                        team_id=team_id,
                        defaults={'team_name': team_name}
                    )

                    # helper to safely extract several possible column names
                    def pick(r, *keys):
                        for k in keys:
                            v = r.get(k)
                            if v is not None and str(v).strip() != '':
                                return str(v).strip()
                        return None

                    # Primary idea fields (accept multiple column name variants)
                    primary_sih = pick(row, 'primary_sih_ps_id', 'primary_ps_id', 'sih_ps_id', 'PS ID')
                    primary_ps_title = pick(row, 'primary_ps_title', 'primary_ps_name', 'PS Title')
                    primary_ps_desc = pick(row, 'primary_ps_description', 'primary_ps_desc')
                    primary_idea_title = pick(row, 'primary_idea_title', 'primary_idea', 'primary idea', 'primary_idea_title')
                    primary_idea_desc = pick(row, 'primary_idea_description', 'primary_idea_desc', 'primary_idea_description')
                    # links intentionally ignored per request

                    if primary_idea_title or primary_idea_desc or primary_sih or primary_ps_title:
                        # unset other primary flags if we create a primary here
                        team.ideas.update(is_primary=False)
                        Idea.objects.update_or_create(
                            team=team,
                            idea_title=primary_idea_title or f"Primary idea for {team_id}",
                            defaults={
                                'sih_ps_id': primary_sih or '',
                                'ps_title': primary_ps_title or '',
                                'ps_description': primary_ps_desc or '',
                                'idea_description': primary_idea_desc or '',
                                'is_primary': True,
                            }
                        )

                    # Up to 4 extra ideas, look for columns with suffixes 1..4
                    for i in range(1, 5):
                        idea_title = pick(row, f'idea{i}_title', f'idea_{i}_title', f'extra{i}_idea_title', f'idea{i} title')
                        idea_desc = pick(row, f'idea{i}_description', f'idea_{i}_description', f'extra{i}_idea_description')
                        ps_title = pick(row, f'idea{i}_ps_title', f'extra{i}_ps_title', f'idea{i}_ps_title')
                        ps_desc = pick(row, f'idea{i}_ps_description', f'extra{i}_ps_description', f'idea{i}_ps_description')
                        # links intentionally ignored per request
                        if idea_title or idea_desc or ps_title:
                            Idea.objects.update_or_create(
                                team=team,
                                idea_title=idea_title or f"Idea {i} for {team_id}",
                                defaults={
                                    'sih_ps_id': primary_sih or '',
                                    'ps_title': ps_title or '',
                                    'ps_description': ps_desc or '',
                                    'idea_description': idea_desc or '',
                                    'is_primary': False,
                                }
                            )

            # Import ideas from separate Ideas sheet (optional)
            if ideas_df is not None:
                self.stdout.write('Importing Ideas from Ideas sheet...')
                for _, row in ideas_df.fillna('').iterrows():
                    team_id = str(row.get('team_id') or row.get('Team ID') or '').strip()
                    if not team_id:
                        continue
                    try:
                        team = Team.objects.get(team_id=team_id)
                    except Team.DoesNotExist:
                        self.stdout.write(self.style.WARNING(f'Team {team_id} not found, skipping idea'))
                        continue

                    idea_title = str(row.get('idea_title') or row.get('Idea Title') or '').strip()
                    sih_ps_id = str(row.get('sih_ps_id') or row.get('PS ID') or '').strip()
                    ps_title = str(row.get('ps_title') or row.get('PS Title') or '').strip()
                    ps_description = str(row.get('ps_description') or row.get('PS Description') or '')
                    idea_description = str(row.get('idea_description') or row.get('Idea Description') or '')
                    # links intentionally ignored per request
                    link = None
                    is_primary = bool(row.get('is_primary') or row.get('primary') or False)
                    approved = bool(row.get('approved') or False)

                    # If this idea is primary, unset other primary flags
                    if is_primary:
                        team.ideas.update(is_primary=False)

                    Idea.objects.update_or_create(
                        team=team,
                        idea_title=idea_title,
                        defaults={
                            'sih_ps_id': sih_ps_id,
                            'ps_title': ps_title,
                            'ps_description': ps_description,
                            'idea_description': idea_description,
                            # link removed
                            'is_primary': is_primary,
                            'approved': approved,
                        }
                    )

            # Import idea scores (optional) - requires existing RubricCriterion and judge users
            if scores_df is not None:
                self.stdout.write('Importing Idea Scores...')
                for _, row in scores_df.fillna('').iterrows():
                    team_id = str(row.get('team_id') or row.get('Team ID') or '').strip()
                    idea_title = str(row.get('idea_title') or row.get('Idea Title') or '').strip()
                    criterion_name = str(row.get('criterion') or row.get('rubric') or '').strip()
                    score_val = row.get('score')
                    judge_username = str(row.get('judge') or row.get('judge_username') or '').strip()

                    if not (team_id and idea_title and criterion_name and score_val):
                        continue

                    try:
                        team = Team.objects.get(team_id=team_id)
                        idea = team.ideas.get(idea_title=idea_title)
                        from judging.models import RubricCriterion
                        criterion = RubricCriterion.objects.get(name=criterion_name)
                        judge = User.objects.get(username=judge_username)
                    except Exception as e:
                        self.stdout.write(self.style.WARNING(f'Skipping score row due to missing entity: {e}'))
                        continue

                    # create or update score (uses unique_together)
                    IdeaScore.objects.update_or_create(
                        idea=idea,
                        judge=judge,
                        criterion=criterion,
                        defaults={'score': float(score_val), 'comments': str(row.get('comments') or '')}
                    )

        self.stdout.write(self.style.SUCCESS('Import completed successfully'))
