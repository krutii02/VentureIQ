"""
Management command to seed production database with demo accounts and startup data.
Run on Railway console: python manage.py setup_production
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import UserProfile


class Command(BaseCommand):
    help = 'Creates demo user accounts for production and seeds startup/investor data.'

    def handle(self, *args, **options):
        self.stdout.write('=== VentureIQ Production Setup ===\n')

        # ── Demo Founder ──────────────────────────────────────────────
        self._create_user(
            email='founder@ventureiq.com',
            password='demo1234',
            first_name='Demo',
            last_name='Founder',
            role='FOUNDER',
        )

        # ── Demo Investor ─────────────────────────────────────────────
        self._create_user(
            email='investor@ventureiq.com',
            password='demo1234',
            first_name='Demo',
            last_name='Investor',
            role='INVESTOR',
            firm='Demo Ventures',
        )

        # ── Admin ─────────────────────────────────────────────────────
        self._create_user(
            email='admin@ventureiq.com',
            password='admin1234',
            first_name='Admin',
            last_name='VentureIQ',
            role='ADMIN',
            is_staff=True,
        )

        # ── Seed Startups ─────────────────────────────────────────────
        self.stdout.write('\nSeeding startups...')
        try:
            from django.core.management import call_command
            call_command('seed_startups', verbosity=0)
            self.stdout.write(self.style.SUCCESS('  Startups seeded OK'))
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'  seed_startups skipped: {e}'))

        # ── Seed Investors ────────────────────────────────────────────
        self.stdout.write('Seeding investors...')
        try:
            from django.core.management import call_command
            call_command('seed_investors', verbosity=0)
            self.stdout.write(self.style.SUCCESS('  Investors seeded OK'))
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'  seed_investors skipped: {e}'))

        self.stdout.write(self.style.SUCCESS('\n=== Setup complete! ==='))
        self.stdout.write('Accounts created:')
        self.stdout.write('  founder@ventureiq.com  / demo1234  (FOUNDER)')
        self.stdout.write('  investor@ventureiq.com / demo1234  (INVESTOR)')
        self.stdout.write('  admin@ventureiq.com    / admin1234 (ADMIN)')

    def _create_user(self, email, password, first_name, last_name, role,
                     firm=None, is_staff=False):
        if User.objects.filter(email=email).exists():
            self.stdout.write(f'  SKIP {email} (already exists)')
            return
        u = User.objects.create_user(
            username=email, email=email, password=password,
            first_name=first_name, last_name=last_name,
        )
        u.is_staff = is_staff
        u.save()
        UserProfile.objects.create(user=u, role=role, firm=firm or '')
        self.stdout.write(self.style.SUCCESS(f'  CREATED {email} [{role}]'))
