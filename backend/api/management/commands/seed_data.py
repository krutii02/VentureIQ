import os
import csv
from pathlib import Path
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import Startup, UserProfile

class Command(BaseCommand):
    help = 'Seeds initial users and startups into SQLite database'

    def handle(self, *args, **options):
        # 1. Seed Demo Users
        users_data = [
            {'username': 'founder@ventureiq.com', 'email': 'founder@ventureiq.com', 'password': 'demo1234', 'role': 'FOUNDER', 'first_name': 'Alex', 'last_name': 'Founder', 'avatar': 'AF', 'company': 'QuickRoom Inc.'},
            {'username': 'investor@ventureiq.com', 'email': 'investor@ventureiq.com', 'password': 'demo1234', 'role': 'INVESTOR', 'first_name': 'Sarah', 'last_name': 'Investor', 'avatar': 'SI', 'firm': 'Sequoia Capital'},
            {'username': 'admin@ventureiq.com', 'email': 'admin@ventureiq.com', 'password': 'demo1234', 'role': 'ADMIN', 'first_name': 'Admin', 'last_name': 'User', 'avatar': 'AU', 'is_staff': True, 'is_superuser': True},
        ]

        for udata in users_data:
            user, created = User.objects.get_or_create(
                username=udata['username'],
                defaults={
                    'email': udata['email'],
                    'first_name': udata['first_name'],
                    'last_name': udata['last_name'],
                    'is_staff': udata.get('is_staff', False),
                    'is_superuser': udata.get('is_superuser', False),
                }
            )
            if created or not user.check_password(udata['password']):
                user.set_password(udata['password'])
                user.save()
            
            profile, p_created = UserProfile.objects.get_or_create(
                user=user,
                defaults={
                    'role': udata['role'],
                    'avatar': udata['avatar'],
                    'company': udata.get('company', ''),
                    'firm': udata.get('firm', ''),
                }
            )
            if not p_created:
                profile.role = udata['role']
                profile.avatar = udata['avatar']
                profile.company = udata.get('company', '')
                profile.firm = udata.get('firm', '')
                profile.save()

        self.stdout.write(self.style.SUCCESS("Demo users created/updated successfully!"))

        # 2. Seed Startups from CSV if available, or default startups if CSV not found
        csv_path = Path(__file__).resolve().parent.parent.parent.parent.parent / 'VentureIQ_cleaned_csv.csv'
        if csv_path.exists():
            self.stdout.write(f"Loading startups from {csv_path}...")
            created_count = 0
            with open(csv_path, mode='r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    name = row.get('startup_name', '').strip()
                    if not name or Startup.objects.filter(name=name).exists():
                        continue

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
                    tags_str = f"{industry}, {stage}, B2B"

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
                    if created_count >= 30:
                        break
            self.stdout.write(self.style.SUCCESS(f"Seeded {created_count} startups from CSV!"))
        else:
            # Seed mock startups if CSV not present
            mock_startups = [
                {'name': 'QuickRoom', 'industry': 'Healthcare', 'country': 'India', 'city': 'Bengaluru', 'stage': 'Series A', 'score': 87, 'revenue': '$71.0K/mo', 'growth': '+14.5%', 'team_size': 24, 'risk_level': 'Low', 'valuation': '$8.5M', 'active_users': 12400, 'description': 'An health-wellness company offering a custom B2B fitness and preventive care ecosystem for corporate employees.'},
                {'name': 'Growbazaar', 'industry': 'CleanTech', 'country': 'India', 'city': 'Bengaluru', 'stage': 'Series B', 'score': 82, 'revenue': '$243.9K/mo', 'growth': '+1.4%', 'team_size': 71, 'risk_level': 'Medium', 'valuation': '$195.5M', 'active_users': 42015, 'description': 'Electric vehicle battery-swapping network.'},
                {'name': 'DhanMetrics', 'industry': 'FinTech', 'country': 'India', 'city': 'Bengaluru', 'stage': 'Series A', 'score': 74, 'revenue': '$96.2K/mo', 'growth': '-1.8%', 'team_size': 48, 'risk_level': 'High', 'valuation': '$21.8M', 'active_users': 55695, 'description': 'Financial access platform for underbanked populations.'},
                {'name': 'NeuralDrive', 'industry': 'SaaS', 'country': 'UK', 'city': 'London', 'stage': 'Series B', 'score': 93, 'revenue': '$280.0K/mo', 'growth': '+31.0%', 'team_size': 67, 'risk_level': 'Low', 'valuation': '$85.0M', 'active_users': 14200, 'description': 'Document intelligence platform for legal and compliance.'},
                {'name': 'HealthAI', 'industry': 'Healthcare', 'country': 'USA', 'city': 'San Francisco', 'stage': 'Series A', 'score': 87, 'revenue': '$95.0K/mo', 'growth': '+27.0%', 'team_size': 44, 'risk_level': 'Low', 'valuation': '$32.0M', 'active_users': 3500, 'description': 'Clinical decision support AI for hospital radiology.'},
            ]
            for sdata in mock_startups:
                if not Startup.objects.filter(name=sdata['name']).exists():
                    Startup.objects.create(**sdata)
            self.stdout.write(self.style.SUCCESS("Seeded default mock startups!"))
