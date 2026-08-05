from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    ROLE_CHOICES = (
        ('FOUNDER', 'Founder'),
        ('INVESTOR', 'Investor'),
        ('Admin', 'Admin'),
    )
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='FOUNDER')
    company = models.CharField(max_length=100, blank=True, null=True)
    firm = models.CharField(max_length=100, blank=True, null=True)
    avatar = models.CharField(max_length=10, blank=True, null=True)
    # Shared profile fields
    bio = models.TextField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    linkedin = models.URLField(blank=True, null=True)
    location = models.CharField(max_length=100, blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    # Investor-specific fields
    investment_thesis = models.TextField(blank=True, null=True)
    min_ticket = models.CharField(max_length=50, blank=True, null=True)
    max_ticket = models.CharField(max_length=50, blank=True, null=True)
    preferred_industries = models.CharField(max_length=500, blank=True, null=True)
    preferred_stages = models.CharField(max_length=200, blank=True, null=True)
    total_investments = models.IntegerField(default=0)
    successful_exits = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.user.username} ({self.role})"


class Startup(models.Model):
    # Owner FK — null for seeded/CSV startups, set for founder-created startups
    founder = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='startups'
    )
    name = models.CharField(max_length=150)
    industry = models.CharField(max_length=100)
    country = models.CharField(max_length=100, default='India')
    city = models.CharField(max_length=100, blank=True, null=True)
    founded_year = models.IntegerField(default=2022)
    stage = models.CharField(max_length=50, default='Series A')
    revenue = models.CharField(max_length=50, default='$50.0K/mo')
    growth = models.CharField(max_length=50, default='+15.0%')
    team_size = models.IntegerField(default=10)
    risk_level = models.CharField(max_length=20, default='Low')
    valuation = models.CharField(max_length=50, default='$10.0M')
    active_users = models.IntegerField(default=5000)
    score = models.IntegerField(default=85)
    innovation_score = models.IntegerField(default=80)
    investor_interest_score = models.IntegerField(default=82)
    market_trend_score = models.IntegerField(default=84)
    description = models.TextField(blank=True, null=True)
    tags = models.CharField(max_length=255, default='AI, SaaS, B2B')
    tech_stack = models.CharField(max_length=255, default='React, Python, PostgreSQL, AWS')
    target_audience = models.CharField(max_length=255, default='Enterprise Clients')
    website = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)

    def __str__(self):
        return self.name


class Watchlist(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='watchlist')
    startup = models.ForeignKey(Startup, on_delete=models.CASCADE, related_name='watchlisted_by')
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'startup')

    def __str__(self):
        return f"{self.user.username} -> {self.startup.name}"


class MeetingRequest(models.Model):
    STATUS_CHOICES = (
        ('Pending', 'Pending'),
        ('Accepted', 'Accepted'),
        ('Declined', 'Declined'),
    )
    investor = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='sent_meetings', null=True, blank=True
    )
    # Keep 'user' for backward compat (maps to investor)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='meeting_requests')
    startup = models.ForeignKey(Startup, on_delete=models.CASCADE, related_name='meeting_requests')
    message = models.TextField(blank=True, null=True)         # investor's original message
    founder_reply = models.TextField(blank=True, null=True)  # founder's reply
    investor_reply = models.TextField(blank=True, null=True) # investor's follow-up reply to founder
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Meeting req by {self.user.username} for {self.startup.name}"


class DocumentReport(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='documents')
    title = models.CharField(max_length=200)
    doc_type = models.CharField(max_length=50)  # 'ML Prediction', 'SWOT Analysis', etc.
    score = models.IntegerField(blank=True, null=True)
    status = models.CharField(max_length=20, default='Completed')
    summary = models.TextField()
    details_json = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.doc_type})"


class Investor(models.Model):
    user = models.OneToOneField(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='investor_profile')
    name = models.CharField(max_length=200)
    firm = models.CharField(max_length=200, blank=True, null=True)
    investor_type = models.CharField(max_length=100, blank=True, null=True)
    firm_logo = models.CharField(max_length=500, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    thesis = models.TextField(blank=True, null=True)
    about = models.TextField(blank=True, null=True)
    industries = models.TextField(blank=True, null=True)
    stages = models.TextField(blank=True, null=True)
    locations = models.TextField(blank=True, null=True)
    min_amount = models.CharField(max_length=50, blank=True, null=True)
    max_amount = models.CharField(max_length=50, blank=True, null=True)
    ticket_size = models.CharField(max_length=50, blank=True, null=True)
    portfolio_size = models.IntegerField(default=0)
    portfolio = models.TextField(blank=True, null=True)
    exits = models.IntegerField(default=0)
    total_deals = models.IntegerField(default=0)
    website = models.URLField(blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    linkedin = models.URLField(blank=True, null=True)
    verified = models.BooleanField(default=False)
    photo = models.CharField(max_length=500, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)

    def __str__(self):
        return f"{self.name} ({self.firm or 'Independent'})"


class Message(models.Model):
    """Individual chat message within a MeetingRequest conversation thread."""
    SENDER_CHOICES = (
        ('FOUNDER',  'Founder'),
        ('INVESTOR', 'Investor'),
    )
    meeting     = models.ForeignKey(MeetingRequest, on_delete=models.CASCADE, related_name='messages')
    sender      = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    sender_role = models.CharField(max_length=10, choices=SENDER_CHOICES)
    content     = models.TextField()
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"[{self.sender_role}] {self.sender.username}: {self.content[:60]}"
