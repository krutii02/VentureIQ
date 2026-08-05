import os
import csv
from pathlib import Path
from django.core.management.base import BaseCommand
from api.models import Startup

class Command(BaseCommand):
    help = 'Seeds startups into SQLite database from VentureIQ_cleaned_csv.csv'

    def handle(self, *args, **options):
        # CSV path relative to workspace root
        csv_path = Path(__file__).resolve().parent.parent.parent.parent.parent / 'VentureIQ_cleaned_csv.csv'
        if not csv_path.exists():
            self.stderr.write(f"CSV file not found at {csv_path}")
            return

        self.stdout.write(f"Loading startups from {csv_path}...")
        created_count = 0

        with open(csv_path, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                name = row.get('startup_name', '').strip()
                if not name:
                    continue

                if Startup.objects.filter(name=name).exists():
                    continue

                # Parse metrics
                industry = row.get('industry', 'Technology').strip()
                country = row.get('country', 'India').strip()
                city = row.get('headquarters_city', 'Bengaluru').strip()
                stage = row.get('funding_stage', 'Series A').strip()
                
                rev_num = float(row.get('monthly_revenue_usd', 0) or 0)
                if rev_num >= 1000000:
                    revenue_str = f"${(rev_num/1000000):.2f}M/mo"
                elif rev_num >= 1000:
                    revenue_str = f"${(rev_num/1000):.1f}K/mo"
                else:
                    revenue_str = f"${rev_num:.0f}/mo"

                growth_num = float(row.get('customer_growth_rate', 0) or 0) * 100
                growth_str = f"+{growth_num:.1f}%" if growth_num >= 0 else f"{growth_num:.1f}%"

                team_size = int(float(row.get('team_size', 10) or 10))
                
                val_num = float(row.get('valuation_usd', 10000000) or 10000000)
                if val_num >= 1000000000:
                    val_str = f"${(val_num/1000000000):.2f}B"
                elif val_num >= 1000000:
                    val_str = f"${(val_num/1000000):.1f}M"
                else:
                    val_str = f"${(val_num/1000):.0f}K"

                innov = int(float(row.get('innovation_score', 80) or 80))
                inv_int = int(float(row.get('investor_interest_score', 80) or 80))
                mkt_tr = int(float(row.get('market_trend_score', 80) or 80))
                overall_score = round((innov + inv_int + mkt_tr) / 3)

                risk = 'Low' if overall_score >= 80 else ('Medium' if overall_score >= 70 else 'High')
                desc = row.get('startup_description', '').strip()
                tech_stack = row.get('technology_stack', 'React, Python, PostgreSQL, AWS').strip()
                target_aud = row.get('target_audience', 'Enterprise Clients').strip()

                tags_list = [industry, stage, 'B2B' if 'B2B' in desc else 'B2C']
                tags_str = ', '.join(tags_list)

                Startup.objects.create(
                    name=name,
                    industry=industry,
                    country=country,
                    city=city,
                    founded_year=int(float(row.get('founded_year', 2022) or 2022)),
                    stage=stage,
                    revenue=revenue_str,
                    growth=growth_str,
                    team_size=team_size,
                    risk_level=risk,
                    valuation=val_str,
                    active_users=int(float(row.get('active_users', 1000) or 1000)),
                    score=overall_score,
                    innovation_score=innov,
                    investor_interest_score=inv_int,
                    market_trend_score=mkt_tr,
                    description=desc,
                    tags=tags_str,
                    tech_stack=tech_stack,
                    target_audience=target_aud,
                    website=row.get('website', '')
                )
                created_count += 1
                if created_count >= 30: # Seed top 30 clean startups
                    break

        self.stdout.write(self.style.SUCCESS(f"Successfully seeded {created_count} startups into SQLite!"))
