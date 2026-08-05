import os
import csv
import json
from pathlib import Path
from django.core.management.base import BaseCommand
from api.models import Investor, UserProfile

def _parse_json_field(val):
    if not val:
        return []
    try:
        data = json.loads(val)
        if isinstance(data, list):
            return [str(x).strip() for x in data if x]
        return [str(data).strip()]
    except Exception:
        return [x.strip() for x in str(val).split(',') if x.strip()]

class Command(BaseCommand):
    help = 'Seeds investors into SQLite database from UserProfiles and investors.csv'

    def handle(self, *args, **options):
        csv_path = Path(__file__).resolve().parent.parent.parent.parent.parent / 'investors.csv'

        self.stdout.write("Clearing existing Investor records...")
        Investor.objects.all().delete()

        # ── 1. Add Registered User Profiles with firm set (role='INVESTOR') ──
        db_profiles = UserProfile.objects.filter(role='INVESTOR').select_related('user').exclude(firm__isnull=True).exclude(firm='')
        registered_count = 0

        for p in db_profiles:
            u = p.user
            full_name = f"{u.first_name} {u.last_name}".strip() or u.username
            firm_name = p.firm or 'Independent'
            industries_list = [i.strip() for i in (p.preferred_industries or '').split(',') if i.strip()]
            stages_list     = [s.strip() for s in (p.preferred_stages or '').split(',') if s.strip()]
            locations_list  = [p.location.strip()] if p.location else []

            Investor.objects.create(
                user=u,
                name=full_name,
                firm=firm_name,
                investor_type='Registered Investor',
                description=p.bio or 'VentureIQ Registered Investor Profile',
                thesis=p.investment_thesis or '',
                about=p.bio or '',
                industries=json.dumps(industries_list),
                stages=json.dumps(stages_list),
                locations=json.dumps(locations_list),
                min_amount=p.min_ticket or '',
                max_amount=p.max_ticket or '',
                ticket_size=p.min_ticket or '',
                portfolio_size=p.total_investments or 0,
                exits=p.successful_exits or 0,
                total_deals=p.total_investments or 0,
                website=p.website or '',
                email=u.email,
                linkedin=p.linkedin or '',
                verified=True
            )
            registered_count += 1

        self.stdout.write(f"Added {registered_count} registered user investor account(s) to Investor database table.")

        # ── 2. Add CSV investors up to total of 60 ────────────────────
        if csv_path.exists() and Investor.objects.count() < 60:
            with open(csv_path, mode='r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    if Investor.objects.count() >= 60:
                        break

                    name = row.get('name', '').strip()
                    firm = row.get('investment_firm', '').strip()
                    if not name or not firm:
                        continue

                    if Investor.objects.filter(name=name, firm=firm).exists():
                        continue

                    industries_list = _parse_json_field(row.get('preferred_industries', ''))
                    stages_list     = _parse_json_field(row.get('preferred_funding_stages', ''))
                    locations_list  = _parse_json_field(row.get('preferred_locations', ''))

                    try:
                        portfolio_size = int(float(row.get('portfolio_size', 0) or 0))
                    except (ValueError, TypeError):
                        portfolio_size = 0

                    try:
                        exits = int(float(row.get('successful_exits', 0) or 0))
                    except (ValueError, TypeError):
                        exits = 0

                    try:
                        total_deals = int(float(row.get('total_investments', 0) or 0))
                    except (ValueError, TypeError):
                        total_deals = 0

                    verified = row.get('verified', 'false').lower() == 'true'

                    Investor.objects.create(
                        name=name,
                        firm=firm,
                        investor_type=row.get('investor_type', ''),
                        firm_logo=row.get('firm_logo', ''),
                        description=row.get('short_description', ''),
                        thesis=row.get('investment_thesis', ''),
                        about=row.get('about_details', ''),
                        industries=json.dumps(industries_list),
                        stages=json.dumps(stages_list),
                        locations=json.dumps(locations_list),
                        min_amount=row.get('min_investment_amount', ''),
                        max_amount=row.get('max_investment_amount', ''),
                        ticket_size=row.get('typical_check_size', ''),
                        portfolio_size=portfolio_size,
                        portfolio=row.get('portfolio_companies', ''),
                        exits=exits,
                        total_deals=total_deals,
                        website=row.get('website', ''),
                        email=row.get('contact_email', ''),
                        linkedin=row.get('linkedin', ''),
                        verified=verified,
                        photo=row.get('representative_photo', '')
                    )

        total_count = Investor.objects.count()
        self.stdout.write(self.style.SUCCESS(f"Successfully seeded exactly {total_count} investors (including registered user profiles) in SQLite database!"))
