import math, csv, json, os, logging
import requests as http_requests
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests
from google.auth.transport.urllib3 import Request as UrllibRequest
import urllib3
from django.core.mail import send_mail
from django.conf import settings as django_settings
from .ml_engine import get_engine as get_ml_engine
from pathlib import Path
from django.db import models as db_models
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.utils import timezone
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from .models import UserProfile, Startup, Watchlist, MeetingRequest, DocumentReport, Investor, Message
# pyrefly: ignore [missing-import]
from .serializers import (
    UserSerializer, StartupSerializer, WatchlistSerializer,
    MeetingRequestSerializer, DocumentReportSerializer
)

# ── GLOBAL APPROVAL SYSTEM STORE ──────────────────────────────────────
APPROVED_USER_IDS = set()  # User IDs approved by Admin to appear in User Section
REJECTED_USER_IDS = set()  # User IDs rejected by Admin

# ── AUTH VIEWS ───────────────────────────────────────────────────────

def send_welcome_email(name: str, email: str, role: str):
    """Send a beautiful HTML welcome email to a newly registered user."""
    role_label = 'Founder' if role == 'FOUNDER' else 'Investor'
    role_color = '#7C3AED' if role == 'FOUNDER' else '#0EA5E9'
    role_desc = (
        'pitch your startup to top-tier investors, track meetings, and grow your venture'
        if role == 'FOUNDER'
        else 'discover high-potential startups, manage your watchlist, and connect with founders'
    )

    subject = f'Welcome to VentureIQ, {name}! 🚀'

    html_message = f"""
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Welcome to VentureIQ</title>
</head>
<body style="margin:0;padding:0;background-color:#0F0F1A;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0F0F1A;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
               style="background:linear-gradient(135deg,#1A1A2E 0%,#16213E 100%);
                      border-radius:16px;overflow:hidden;
                      border:1px solid rgba(124,58,237,0.3);
                      box-shadow:0 20px 60px rgba(0,0,0,0.5);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#7C3AED 0%,#0EA5E9 100%);
                       padding:40px 48px;text-align:center;">
              <h1 style="margin:0;font-size:32px;font-weight:800;color:#ffffff;
                         letter-spacing:-0.5px;">
                ⚡ VentureIQ
              </h1>
              <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.8);
                        letter-spacing:2px;text-transform:uppercase;">
                The AI-Powered Investment Intelligence Platform
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:48px;">
              <!-- Welcome Badge -->
              <div style="text-align:center;margin-bottom:32px;">
                <span style="display:inline-block;background:{role_color};
                             color:#fff;font-size:12px;font-weight:700;
                             padding:6px 20px;border-radius:999px;
                             letter-spacing:1.5px;text-transform:uppercase;">
                  {role_label} Account
                </span>
              </div>

              <!-- Greeting -->
              <h2 style="margin:0 0 16px;font-size:28px;font-weight:700;
                         color:#F1F5F9;text-align:center;">
                Welcome aboard, {name}! 🎉
              </h2>
              <p style="margin:0 0 32px;font-size:16px;color:#94A3B8;
                        text-align:center;line-height:1.7;">
                Your <strong style="color:#F1F5F9;">{role_label}</strong> account is ready.
                You can now {role_desc}.
              </p>

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:0 0 32px;"/>

              <!-- What's Next -->
              <h3 style="margin:0 0 20px;font-size:18px;font-weight:600;color:#F1F5F9;">
                🚀 What's Next?
              </h3>

              {'<ul style="margin:0 0 32px;padding:0;list-style:none;"><li style="display:flex;align-items:flex-start;gap:12px;margin-bottom:16px;"><span style="font-size:20px;">📊</span><span style="font-size:15px;color:#94A3B8;line-height:1.6;"><strong style="color:#F1F5F9;">List your startup</strong> — Add your venture details and get AI-powered match scores.</span></li><li style="display:flex;align-items:flex-start;gap:12px;margin-bottom:16px;"><span style="font-size:20px;">🤝</span><span style="font-size:15px;color:#94A3B8;line-height:1.6;"><strong style="color:#F1F5F9;">Connect with investors</strong> — Request meetings with top-tier investors in your domain.</span></li><li style="display:flex;align-items:flex-start;gap:12px;"><span style="font-size:20px;">📈</span><span style="font-size:15px;color:#94A3B8;line-height:1.6;"><strong style="color:#F1F5F9;">Track your growth</strong> — Use our ROI and breakeven calculators to plan your path.</span></li></ul>' if role == 'FOUNDER' else '<ul style="margin:0 0 32px;padding:0;list-style:none;"><li style="display:flex;align-items:flex-start;gap:12px;margin-bottom:16px;"><span style="font-size:20px;">🔍</span><span style="font-size:15px;color:#94A3B8;line-height:1.6;"><strong style="color:#F1F5F9;">Discover startups</strong> — Explore AI-ranked startups that match your investment thesis.</span></li><li style="display:flex;align-items:flex-start;gap:12px;margin-bottom:16px;"><span style="font-size:20px;">⭐</span><span style="font-size:15px;color:#94A3B8;line-height:1.6;"><strong style="color:#F1F5F9;">Watchlist & compare</strong> — Bookmark startups and compare them side-by-side.</span></li><li style="display:flex;align-items:flex-start;gap:12px;"><span style="font-size:20px;">📅</span><span style="font-size:15px;color:#94A3B8;line-height:1.6;"><strong style="color:#F1F5F9;">Schedule meetings</strong> — Request pitch meetings directly with founders.</span></li></ul>'}

              <!-- CTA Button -->
              <div style="text-align:center;margin-bottom:40px;">
                <a href="http://localhost:5173"
                   style="display:inline-block;background:linear-gradient(135deg,#7C3AED,#0EA5E9);
                          color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;
                          padding:16px 48px;border-radius:12px;
                          box-shadow:0 8px 24px rgba(124,58,237,0.4);">
                  Go to Dashboard →
                </a>
              </div>

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:0 0 32px;"/>

              <!-- Account Info -->
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="background:rgba(255,255,255,0.04);border-radius:12px;
                            border:1px solid rgba(255,255,255,0.08);">
                <tr>
                  <td style="padding:24px;">
                    <p style="margin:0 0 8px;font-size:12px;color:#64748B;
                               text-transform:uppercase;letter-spacing:1px;font-weight:600;">
                      Account Details
                    </p>
                    <p style="margin:0 0 4px;font-size:14px;color:#94A3B8;">
                      <span style="color:#F1F5F9;font-weight:600;">Name:</span> &nbsp;{name}
                    </p>
                    <p style="margin:0 0 4px;font-size:14px;color:#94A3B8;">
                      <span style="color:#F1F5F9;font-weight:600;">Email:</span> &nbsp;{email}
                    </p>
                    <p style="margin:0;font-size:14px;color:#94A3B8;">
                      <span style="color:#F1F5F9;font-weight:600;">Role:</span> &nbsp;{role_label}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:rgba(0,0,0,0.3);padding:24px 48px;text-align:center;">
              <p style="margin:0 0 8px;font-size:13px;color:#475569;">
                Need help? Contact us at
                <a href="mailto:support@ventureiq.com"
                   style="color:#7C3AED;text-decoration:none;">support@ventureiq.com</a>
              </p>
              <p style="margin:0;font-size:12px;color:#334155;">
                © 2026 VentureIQ · All rights reserved
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""

    plain_message = (
        f"Welcome to VentureIQ, {name}!\n\n"
        f"Your {role_label} account has been created successfully.\n"
        f"Email: {email}\n\n"
        f"You can now {role_desc}.\n\n"
        "Visit VentureIQ to get started.\n\n"
        "– The VentureIQ Team"
    )

    try:
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=django_settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            html_message=html_message,
            fail_silently=False,
        )
        logging.info(f"Welcome email sent to {email} ({role_label})")
    except Exception as exc:
        logging.error(f"Failed to send welcome email to {email}: {exc}")


def sync_unlinked_users():
    """Ensure every registered user (Founder/Investor) has an entry in their respective table."""
    try:
        # Sync Investors to Investor table
        investor_profiles = UserProfile.objects.filter(role='INVESTOR').select_related('user')
        for p in investor_profiles:
            u = p.user
            full_name = f"{u.first_name} {u.last_name}".strip() or u.username
            inv, created = Investor.objects.get_or_create(
                user=u,
                defaults={
                    'name': full_name,
                    'email': u.email,
                    'firm': p.firm or '',
                    'thesis': p.investment_thesis or p.bio or '',
                    'description': p.bio or p.investment_thesis or '',
                    'min_amount': p.min_ticket or '',
                    'max_amount': p.max_ticket or '',
                    'industries': p.preferred_industries or '',
                    'stages': p.preferred_stages or '',
                    'total_deals': p.total_investments or 0,
                    'exits': p.successful_exits or 0,
                    'linkedin': p.linkedin or '',
                    'website': p.website or '',
                    'verified': True,
                }
            )
            if not created:
                inv.name = full_name
                inv.email = u.email
                if p.firm: inv.firm = p.firm
                if p.investment_thesis: inv.thesis = p.investment_thesis
                if p.bio: inv.description = p.bio
                if p.preferred_industries: inv.industries = p.preferred_industries
                if p.preferred_stages: inv.stages = p.preferred_stages
                if p.min_ticket: inv.min_amount = p.min_ticket
                if p.max_ticket: inv.max_amount = p.max_ticket
                inv.save()
    except Exception as e:
        logging.error(f"Error syncing users: {e}")

try:
    sync_unlinked_users()
except Exception:
    pass


class PlatformStatsView(APIView):
    """Public endpoint — returns live platform statistics for the auth pages."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from django.db.models import Avg
        founders_count   = UserProfile.objects.filter(role='FOUNDER').count()
        investors_count  = UserProfile.objects.filter(role='INVESTOR').count()
        startups_count   = Startup.objects.count()
        members_count    = founders_count + investors_count
        industries_count = Startup.objects.values('industry').distinct().count()

        avg_score = Startup.objects.aggregate(avg=Avg('score'))['avg'] or 0

        top_startups = list(
            Startup.objects.order_by('-score')[:3].values('name', 'stage', 'score', 'industry')
        )

        # Top 3 investors from seed data only (user=NULL means not user-generated)
        top_investors = list(
            Investor.objects.filter(user__isnull=True)
            .order_by('-total_deals')[:3]
            .values('name', 'firm', 'industries', 'total_deals')
        )

        return Response({
            'founders':        founders_count,
            'investors':       investors_count,
            'members':         members_count,
            'startups':        startups_count,
            'industries':      industries_count,
            'avg_score':       round(avg_score),
            'top_startups':    top_startups,
            'top_investors':   top_investors,
        })



class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        name = request.data.get('name', '').strip()
        email = request.data.get('email', '').strip().lower()
        password = request.data.get('password', '').strip()
        role = request.data.get('role', 'FOUNDER').upper()

        if not email or not password or not name:
            return Response({'error': 'Name, email, and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=email).exists() or User.objects.filter(username=email).exists():
            return Response({'error': 'An account with this email already exists.'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=name.split(' ')[0],
            last_name=' '.join(name.split(' ')[1:]) if ' ' in name else ''
        )
        avatar = (name[:2]).upper()
        UserProfile.objects.create(user=user, role=role, avatar=avatar)

        # Create record in respective database table if Investor
        if role == 'INVESTOR':
            Investor.objects.create(
                user=user,
                name=name,
                email=email,
                firm='',
                investor_type='Venture Capitalist',
                verified=True
            )

        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])

        # Send welcome email to the new user (non-blocking; errors are logged)
        send_welcome_email(name=name, email=email, role=role)

        refresh = RefreshToken.for_user(user)
        return Response({
            'token': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'name': name,
                'email': user.email,
                'role': role,
                'avatar': avatar
            }
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        password = request.data.get('password', '').strip()
        role = request.data.get('role', None)

        user = User.objects.filter(email=email).first() or User.objects.filter(username=email).first()
        if not user or not user.check_password(password):
            return Response({'error': 'Invalid email or password.'}, status=status.HTTP_400_BAD_REQUEST)

        if not user.is_active:
            return Response(
                {'error': 'Your account has been locked by an administrator. Please contact support@ventureiq.com for assistance.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Guard: profile must already exist — never auto-create on login.
        # If admin deleted a user's profile the Django User record may still exist;
        # without a profile there is effectively no VentureIQ account.
        profile = UserProfile.objects.filter(user=user).first()
        if not profile:
            return Response(
                {'error': 'No account found with these credentials. Please register first.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if role and profile.role != role.upper():
            return Response(
                {'error': f'Incorrect role. This account is registered as {profile.role}.'},
                status=status.HTTP_403_FORBIDDEN
            )

        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])

        refresh = RefreshToken.for_user(user)
        full_name = f"{user.first_name} {user.last_name}".strip() or user.username
        avatar = profile.avatar or (full_name[:2].upper())

        return Response({
            'token': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'name': full_name,
                'email': user.email,
                'role': profile.role,
                'avatar': avatar,
                'company': profile.company,
                'firm': profile.firm
            }
        })


class PasswordResetView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        new_password = request.data.get('new_password', '').strip()

        if not email:
            return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Verify-only step: check if account exists
        if not new_password:
            user = User.objects.filter(email=email).first() or User.objects.filter(username=email).first()
            if not user:
                return Response({'error': 'No account found with this email address.'}, status=status.HTTP_404_NOT_FOUND)
            return Response({'message': 'Account verified. You may now set a new password.'}, status=status.HTTP_200_OK)

        # Reset step: update password
        if len(new_password) < 8:
            return Response({'error': 'Password must be at least 8 characters.'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email=email).first() or User.objects.filter(username=email).first()
        if not user:
            return Response({'error': 'No account found with this email address.'}, status=status.HTTP_404_NOT_FOUND)

        user.set_password(new_password)
        user.save()
        return Response({'message': 'Password updated successfully. You can now log in.'}, status=status.HTTP_200_OK)


class GoogleAuthView(APIView):
    """Verify a Google ID token and issue a VentureIQ JWT.

    POST body:
        credential (str) : Google ID token from the GSI popup
        role       (str) : 'FOUNDER' or 'INVESTOR' — required only for new users
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        credential = request.data.get('credential', '').strip()
        role = (request.data.get('role', 'FOUNDER') or 'FOUNDER').upper()
        # 'login' mode = existing accounts only; 'signup' mode = allow creation
        mode = request.data.get('mode', 'signup').strip().lower()

        if not credential:
            return Response({'error': 'Google credential is required.'}, status=status.HTTP_400_BAD_REQUEST)

        client_id = django_settings.GOOGLE_CLIENT_ID
        if not client_id:
            return Response(
                {'error': 'Google OAuth is not configured on this server.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        # Verify the Google ID token using urllib3 transport (more reliable on Windows)
        try:
            # Try urllib3 transport first (avoids requests session issues)
            try:
                http = urllib3.PoolManager()
                request_obj = UrllibRequest(http)
            except Exception:
                request_obj = google_requests.Request()

            id_info = google_id_token.verify_oauth2_token(
                credential,
                request_obj,
                client_id,
                clock_skew_in_seconds=120,
            )
        except Exception as exc:
            logging.error(f"Google token verification failed (client_id={client_id[:20]}...): {type(exc).__name__}: {exc}")
            return Response({'error': f'Google sign-in failed: {str(exc)}'}, status=status.HTTP_400_BAD_REQUEST)

        google_email = id_info.get('email', '').lower().strip()
        google_name  = id_info.get('name', '') or google_email.split('@')[0]
        google_sub   = id_info.get('sub', '')  # unique Google user ID

        if not google_email:
            return Response({'error': 'Could not retrieve email from Google.'}, status=status.HTTP_400_BAD_REQUEST)

        # ── Find or create the Django User ──────────────────────────────
        is_new_user = False
        user = (
            User.objects.filter(email=google_email).first() or
            User.objects.filter(username=google_email).first()
        )

        if user:
            # Existing Django User — but their VentureIQ profile must also exist.
            # If an admin deleted the profile, the account is gone; reject login.
            profile = UserProfile.objects.filter(user=user).first()
            if not profile:
                # Profile was deleted (e.g., by admin). Treat as deleted account.
                return Response(
                    {
                        'error': 'No VentureIQ account found for this Google account. '
                                 'Please register first, then sign in.'
                    },
                    status=status.HTTP_404_NOT_FOUND
                )
            # Reject if the account is locked
            if not user.is_active:
                return Response(
                    {'error': 'Your account has been locked. Please contact support@ventureiq.com.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            # Reject if the selected role doesn't match the stored role
            if role and profile.role.upper() != role.upper():
                return Response(
                    {'error': f'This Google account is registered as a {profile.role.capitalize()}. Please go back and select the correct role to log in.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        else:
            # No existing account found for this Google email.
            # In LOGIN mode we must reject — account doesn't exist.
            if mode == 'login':
                return Response(
                    {
                        'error': 'No VentureIQ account found for this Google account. '
                                 'Please register first, then sign in.'
                    },
                    status=status.HTTP_404_NOT_FOUND
                )

            # SIGNUP mode — create a new account.
            if role not in ('FOUNDER', 'INVESTOR'):
                return Response(
                    {'error': 'Please select a valid role: Founder or Investor.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            is_new_user = True
            name_parts = google_name.split(' ', 1)
            user = User.objects.create_user(
                username=google_email,
                email=google_email,
                password=None,   # No password — Google-only account
                first_name=name_parts[0],
                last_name=name_parts[1] if len(name_parts) > 1 else ''
            )
            avatar = google_name[:2].upper()
            profile = UserProfile.objects.create(user=user, role=role, avatar=avatar)

            # Sync to Investor table if needed
            if role == 'INVESTOR':
                Investor.objects.create(
                    user=user,
                    name=google_name,
                    email=google_email,
                    firm='',
                    investor_type='Venture Capitalist',
                    verified=True,
                )

            # Send welcome email (non-blocking)
            send_welcome_email(name=google_name, email=google_email, role=role)

        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])

        refresh = RefreshToken.for_user(user)
        full_name = f"{user.first_name} {user.last_name}".strip() or user.username
        avatar = profile.avatar or full_name[:2].upper()

        return Response({
            'token': str(refresh.access_token),
            'refresh': str(refresh),
            'is_new_user': is_new_user,
            'user': {
                'id': user.id,
                'name': full_name,
                'email': user.email,
                'role': profile.role,
                'avatar': avatar,
                'company': profile.company,
                'firm': profile.firm,
            }
        }, status=status.HTTP_200_OK)


class MeView(APIView):
    def get(self, request):
        if not request.user.is_authenticated:
            return Response({'error': 'Unauthenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        full_name = f"{request.user.first_name} {request.user.last_name}".strip() or request.user.username
        return Response({
            'id': request.user.id,
            'name': full_name,
            'email': request.user.email,
            'role': profile.role,
            'avatar': profile.avatar or full_name[:2].upper(),
            'company': profile.company,
            'firm': profile.firm
        })


class ProfileView(APIView):
    """GET/PUT /api/profile/ — view and update the logged-in user's profile."""

    def get(self, request):
        if not request.user.is_authenticated:
            return Response({'error': 'Unauthenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        user = request.user
        profile, _ = UserProfile.objects.get_or_create(user=user)
        full_name = f"{user.first_name} {user.last_name}".strip() or user.username
        return Response({
            'id': user.id,
            'name': full_name,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': profile.role,
            'avatar': profile.avatar or full_name[:2].upper(),
            'company': profile.company,
            'firm': profile.firm,
            'bio': profile.bio,
            'phone': profile.phone,
            'linkedin': profile.linkedin,
            'location': profile.location,
            'website': profile.website,
            'investment_thesis': profile.investment_thesis,
            'min_ticket': profile.min_ticket,
            'max_ticket': profile.max_ticket,
            'preferred_industries': profile.preferred_industries,
            'preferred_stages': profile.preferred_stages,
            'total_investments': profile.total_investments,
            'successful_exits': profile.successful_exits,
        })

    def put(self, request):
        if not request.user.is_authenticated:
            return Response({'error': 'Unauthenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        user = request.user
        profile, _ = UserProfile.objects.get_or_create(user=user)
        data = request.data

        # Update Django User fields
        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'last_name' in data:
            user.last_name = data['last_name']
        if 'name' in data:
            parts = data['name'].split(' ', 1)
            user.first_name = parts[0]
            user.last_name = parts[1] if len(parts) > 1 else ''
        user.save()

        # Update profile fields
        profile_fields = [
            'company', 'firm', 'bio', 'phone', 'linkedin', 'location', 'website',
            'investment_thesis', 'min_ticket', 'max_ticket',
            'preferred_industries', 'preferred_stages',
            'total_investments', 'successful_exits',
        ]
        for field in profile_fields:
            if field in data:
                setattr(profile, field, data[field])
        profile.save()

        full_name = f"{user.first_name} {user.last_name}".strip() or user.username

        # Sync changes to respective model tables (Investor / Startup)
        if profile.role == 'INVESTOR':
            inv, _ = Investor.objects.get_or_create(user=user, defaults={'name': full_name, 'email': user.email})
            inv.name = full_name
            inv.email = user.email
            if profile.firm: inv.firm = profile.firm
            if profile.bio or profile.investment_thesis:
                inv.description = profile.bio or profile.investment_thesis
                inv.thesis = profile.investment_thesis or profile.bio
            if profile.min_ticket: inv.min_amount = profile.min_ticket
            if profile.max_ticket: inv.max_amount = profile.max_ticket
            if profile.preferred_industries: inv.industries = profile.preferred_industries
            if profile.preferred_stages: inv.stages = profile.preferred_stages
            if profile.total_investments: inv.total_deals = profile.total_investments
            if profile.successful_exits: inv.exits = profile.successful_exits
            if profile.linkedin: inv.linkedin = profile.linkedin
            if profile.website: inv.website = profile.website
            inv.save()
        elif profile.role == 'FOUNDER':
            st = Startup.objects.filter(founder=user).first()
            if not st:
                st = Startup.objects.create(
                    founder=user,
                    name=profile.company or f"{user.first_name}'s Venture",
                    industry='AI & Machine Learning',
                    stage='Pre-Seed',
                    country='India'
                )
                if profile.company: st.name = profile.company
                if profile.bio: st.description = profile.bio
                if profile.website: st.website = profile.website
                st.save()

        return Response({'message': 'Profile updated successfully.', 'name': full_name})

    def delete(self, request):
        if not request.user.is_authenticated:
            return Response({'error': 'Unauthenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        user = request.user
        
        # Explicitly delete linked records across all tables
        Startup.objects.filter(founder=user).delete()
        Investor.objects.filter(user=user).delete()
        Investor.objects.filter(email__iexact=user.email).delete()
        MeetingRequest.objects.filter(db_models.Q(user=user) | db_models.Q(investor=user)).delete()
        Watchlist.objects.filter(user=user).delete()
        DocumentReport.objects.filter(user=user).delete()
        UserProfile.objects.filter(user=user).delete()
        
        user.delete()
        return Response({'message': 'Account deleted successfully.'}, status=status.HTTP_200_OK)



class StartupListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        queryset = Startup.objects.all().order_by('-score')

        industry = request.query_params.get('industry', 'All')
        stage = request.query_params.get('stage', 'All')
        min_score = request.query_params.get('min_score', 0)
        search = request.query_params.get('search', '').strip()

        if industry and industry != 'All':
            queryset = queryset.filter(industry__iexact=industry)

        if stage and stage != 'All':
            queryset = queryset.filter(stage__iexact=stage)

        if min_score:
            try:
                queryset = queryset.filter(score__gte=int(min_score))
            except ValueError:
                pass

        if search:
            queryset = queryset.filter(
                db_models.Q(name__icontains=search) |
                db_models.Q(industry__icontains=search) |
                db_models.Q(description__icontains=search) |
                db_models.Q(country__icontains=search)
            )

        serializer = StartupSerializer(queryset, many=True)
        return Response(serializer.data)


def compute_ml_scores(startup):
    """Computes dynamic ML scores using scikit-learn models from ml_engine."""
    try:
        engine = get_ml_engine()
        rev_str = str(startup.revenue or '')
        clean_rev = ''.join(c for c in rev_str if c.isdigit() or c == '.')
        monthly_rev = float(clean_rev) * 1000 if ('K' in rev_str.upper() or 'M' in rev_str.upper()) else float(clean_rev or 50000)

        growth_str = str(startup.growth or '')
        clean_growth = ''.join(c for c in growth_str if c.isdigit() or c == '.')
        growth_rate = float(clean_growth or 15.0)

        input_dict = {
            'team_size': startup.team_size or 5,
            'monthly_revenue_usd': monthly_rev,
            'burn_rate': getattr(startup, 'burn_rate', monthly_rev * 0.35),
            'active_users': startup.active_users or 1000,
            'customer_growth_rate': growth_rate,
            'founder_experience_years': max(1, 2026 - (startup.founded_year or 2022)),
            'stage': startup.stage or 'Series A',
            'industry': startup.industry or 'AI'
        }

        # KNN model -> success probability score
        score = engine.predict_success_probability(input_dict)
        # Random Forest model -> investor interest score
        investor_interest = engine.predict_investor_interest(input_dict)
        # Decision Tree model -> risk
        risk = engine.predict_risk(input_dict)

        innovation = int(min(98, max(45, score + 2)))
        market_trend = int(min(98, max(45, investor_interest - 1)))

        startup.score = score
        startup.investor_interest_score = investor_interest
        startup.innovation_score = innovation
        startup.market_trend_score = market_trend
        startup.risk_level = risk
        startup.save(update_fields=['score', 'investor_interest_score', 'innovation_score', 'market_trend_score', 'risk_level'])
    except Exception as e:
        logger.exception("Failed to compute ML scores for startup")


class FounderStartupView(APIView):
    """GET/POST/PUT /api/startups/mine/ — founder manages their own startup."""

    def get(self, request):
        if not request.user.is_authenticated:
            return Response({'error': 'Unauthenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        startup = Startup.objects.filter(founder=request.user).first()
        if not startup:
            return Response(None, status=status.HTTP_200_OK)
        # Always compute / refresh dynamic ML scores on fetch
        compute_ml_scores(startup)
        return Response(StartupSerializer(startup).data)

    def post(self, request):
        """Create or update a startup for this founder."""
        if not request.user.is_authenticated:
            return Response({'error': 'Unauthenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        startup = Startup.objects.filter(founder=request.user).first()
        if startup:
            serializer = StartupSerializer(startup, data=request.data, partial=True)
            if serializer.is_valid():
                startup = serializer.save()
                compute_ml_scores(startup)
                return Response(StartupSerializer(startup).data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer = StartupSerializer(data=request.data)
        if serializer.is_valid():
            startup = serializer.save(founder=request.user)
            compute_ml_scores(startup)
            return Response(StartupSerializer(startup).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request):
        """Update the founder's existing startup, or create one if none exists."""
        if not request.user.is_authenticated:
            return Response({'error': 'Unauthenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        startup = Startup.objects.filter(founder=request.user).first()
        if not startup:
            serializer = StartupSerializer(data=request.data)
            if serializer.is_valid():
                startup = serializer.save(founder=request.user)
                compute_ml_scores(startup)
                return Response(StartupSerializer(startup).data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer = StartupSerializer(startup, data=request.data, partial=True)
        if serializer.is_valid():
            startup = serializer.save()
            compute_ml_scores(startup)
            return Response(StartupSerializer(startup).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StartupDetailView(APIView):

    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        try:
            startup = Startup.objects.get(pk=pk)
            return Response(StartupSerializer(startup).data)
        except Startup.DoesNotExist:
            return Response({'error': 'Startup not found'}, status=status.HTTP_404_NOT_FOUND)

    def put(self, request, pk):
        try:
            startup = Startup.objects.get(pk=pk)
            serializer = StartupSerializer(startup, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Startup.DoesNotExist:
            return Response({'error': 'Startup not found'}, status=status.HTTP_404_NOT_FOUND)


class BookmarkToggleView(APIView):
    def post(self, request, pk):
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        try:
            startup = Startup.objects.get(pk=pk)
            watch, created = Watchlist.objects.get_or_create(user=request.user, startup=startup)
            if not created:
                watch.delete()
                return Response({'bookmarked': False, 'message': 'Removed from watchlist'})
            return Response({'bookmarked': True, 'message': 'Added to watchlist'})
        except Startup.DoesNotExist:
            return Response({'error': 'Startup not found'}, status=status.HTTP_404_NOT_FOUND)


class WatchlistListView(APIView):
    """GET /api/watchlist/ — returns the investor's full watchlist with startup details."""

    def get(self, request):
        if not request.user.is_authenticated:
            return Response({'error': 'Unauthenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        items = Watchlist.objects.filter(user=request.user).select_related('startup').order_by('-created_at')
        return Response(WatchlistSerializer(items, many=True).data)
        
    def put(self, request):
        """PUT /api/watchlist/ — updates notes for a specific startup in watchlist."""
        if not request.user.is_authenticated:
            return Response({'error': 'Unauthenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        startup_id = request.data.get('startup_id')
        notes = request.data.get('notes', '')
        if not startup_id:
            return Response({'error': 'startup_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            item = Watchlist.objects.get(user=request.user, startup_id=startup_id)
            item.notes = notes
            item.save()
            return Response(WatchlistSerializer(item).data)
        except Watchlist.DoesNotExist:
            return Response({'error': 'Not in watchlist'}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request):
        """DELETE /api/watchlist/?startup_id=X — remove a startup from watchlist."""
        if not request.user.is_authenticated:
            return Response({'error': 'Unauthenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        startup_id = request.query_params.get('startup_id')
        if startup_id:
            Watchlist.objects.filter(user=request.user, startup_id=startup_id).delete()
        return Response({'message': 'Removed from watchlist'})


class MeetingRequestView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, pk):
        try:
            startup = Startup.objects.get(pk=pk)
        except Startup.DoesNotExist:
            return Response({'error': 'Startup not found'}, status=status.HTTP_404_NOT_FOUND)

        msg = request.data.get('message', 'Request intro call').strip() or 'Request intro call'
        user = request.user if request.user.is_authenticated else User.objects.filter(email='investor@ventureiq.com').first()
        
        req_id = 1
        if user:
            req, created = MeetingRequest.objects.get_or_create(
                user=user, startup=startup, defaults={'message': msg}
            )
            req_id = req.id
            if not created and msg:
                req.message = msg
                req.save()
            investor_name = f"{user.first_name} {user.last_name}".strip() or user.username
            firm = getattr(getattr(user, 'profile', None), 'firm', '') or 'Angel Investor'
        else:
            investor_name = 'Sarah Investor'
            firm = 'Sequoia Capital'

        notification_data = {
            'id': req_id,
            'startup': startup.name,
            'startup_id': startup.id,
            'investor_name': investor_name,
            'firm': firm,
            'message': msg,
            'time': 'Just now',
            'status': 'Pending'
        }

        return Response({
            'success': True,
            'message': f'Meeting request sent to {startup.name}! Notification sent to founder.',
            'notification': notification_data
        })


class FounderConnectView(APIView):
    """POST /api/investors/<investor_id>/connect/ — founder sends a connection request to an investor."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        # 1. Ensure the caller is a founder
        try:
            profile = request.user.profile
        except UserProfile.DoesNotExist:
            return Response({'error': 'Profile not found'}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Get the founder's startup
        founder_startup = Startup.objects.filter(founder=request.user).first()
        if not founder_startup:
            return Response({'error': 'You need to create a startup first'}, status=status.HTTP_400_BAD_REQUEST)

        # 3. Find the Investor record
        try:
            investor_record = Investor.objects.get(pk=pk)
        except Investor.DoesNotExist:
            return Response({'error': 'Investor not found'}, status=status.HTTP_404_NOT_FOUND)

        # 4. The Investor must have a linked User account
        investor_user = investor_record.user
        if not investor_user:
            return Response(
                {'error': 'This investor is not registered on VentureIQ yet. Message saved as notification only.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        msg = request.data.get('message', '').strip() or 'Founder would like to connect'

        # 5. Create or update a MeetingRequest
        meeting, created = MeetingRequest.objects.get_or_create(
            user=investor_user,
            startup=founder_startup,
            defaults={'message': msg, 'investor': investor_user}
        )
        if not created:
            # Append as a chat message instead of overwriting
            Message.objects.create(
                meeting=meeting,
                sender=request.user,
                sender_role='FOUNDER',
                content=msg,
            )
        else:
            # Also create the first message in the chat thread
            Message.objects.create(
                meeting=meeting,
                sender=request.user,
                sender_role='FOUNDER',
                content=msg,
            )

        # Build response
        investor_name = f"{investor_user.first_name} {investor_user.last_name}".strip() or investor_user.username
        firm = investor_record.firm or 'Independent'

        return Response({
            'success': True,
            'meeting_id': meeting.id,
            'message': f'Connection request sent to {investor_name}!',
            'data': {
                'id': meeting.id,
                'investor_name': investor_name,
                'firm': firm,
                'startup': founder_startup.name,
                'status': meeting.status,
            }
        })


class MeetingListView(APIView):
    """GET /api/meetings/ — returns meeting requests FOR the founder's startup."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        if not request.user.is_authenticated:
            return Response([])

        # Get the founder's own startup
        founder_startup = Startup.objects.filter(founder=request.user).first()
        if not founder_startup:
            return Response([])

        queryset = MeetingRequest.objects.filter(
            startup=founder_startup
        ).select_related('user', 'startup').order_by('-created_at')

        reqs = []
        for r in queryset:
            investor_name = f"{r.user.first_name} {r.user.last_name}".strip() or r.user.username
            try:
                firm = r.user.profile.firm or 'Independent'
            except Exception:
                firm = 'Independent'
            reqs.append({
                'id': r.id,
                'startup': r.startup.name,
                'startup_id': r.startup.id,
                'investor_name': investor_name,
                'investor_email': r.user.email,
                'firm': firm,
                'message': r.message or 'Request intro call',
                'founder_reply': r.founder_reply or '',
                'investor_reply': r.investor_reply or '',
                'time': r.created_at.strftime('%b %d, %H:%M'),
                'updated_at': r.updated_at.strftime('%b %d, %H:%M') if r.updated_at else '',
                'status': r.status
            })
        return Response(reqs)


class MeetingUpdateView(APIView):
    """PUT /api/meetings/<id>/ — founder accepts/declines and can add a reply."""

    def put(self, request, pk):
        if not request.user.is_authenticated:
            return Response({'error': 'Unauthenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        try:
            meeting = MeetingRequest.objects.get(pk=pk)
        except MeetingRequest.DoesNotExist:
            return Response({'error': 'Meeting not found'}, status=status.HTTP_404_NOT_FOUND)

        # Only the founder of the startup can update meeting status
        if meeting.startup.founder != request.user:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        new_status = request.data.get('status')
        allowed = ['Pending', 'Accepted', 'Declined']
        if new_status and new_status not in allowed:
            return Response({'error': f'Status must be one of {allowed}'}, status=status.HTTP_400_BAD_REQUEST)
        if new_status:
            meeting.status = new_status

        # Allow updating reply at the same time
        reply = request.data.get('founder_reply')
        if reply is not None:
            meeting.founder_reply = reply

        meeting.save()
        return Response({'id': meeting.id, 'status': meeting.status, 'founder_reply': meeting.founder_reply or '', 'message': f'Meeting updated'})


class InvestorMeetingsView(APIView):
    """GET /api/meetings/sent/ — meetings an investor has sent (with founder replies)."""

    def get(self, request):
        if not request.user.is_authenticated:
            return Response({'error': 'Unauthenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        queryset = MeetingRequest.objects.filter(
            user=request.user
        ).select_related('startup', 'startup__founder').order_by('-created_at')
        reqs = []
        for r in queryset:
            # Get founder name
            founder_name = ''
            founder_email = ''
            if r.startup.founder:
                founder_name = f"{r.startup.founder.first_name} {r.startup.founder.last_name}".strip() or r.startup.founder.username
                founder_email = r.startup.founder.email
            reqs.append({
                'id': r.id,
                'startup': r.startup.name,
                'startup_id': r.startup.id,
                'startup_industry': r.startup.industry,
                'startup_stage': r.startup.stage,
                'founder_name': founder_name,
                'founder_email': founder_email,
                'message': r.message or '',
                'founder_reply': r.founder_reply or '',
                'investor_reply': r.investor_reply or '',
                'time': r.created_at.strftime('%b %d, %H:%M'),
                'updated_at': r.updated_at.strftime('%b %d, %H:%M') if r.updated_at else '',
                'status': r.status
            })
        return Response(reqs)


class FounderReplyView(APIView):
    """PUT /api/meetings/<id>/reply/ — founder sends a reply message to investor."""

    def put(self, request, pk):
        if not request.user.is_authenticated:
            return Response({'error': 'Unauthenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        try:
            meeting = MeetingRequest.objects.get(pk=pk)
        except MeetingRequest.DoesNotExist:
            return Response({'error': 'Meeting not found'}, status=status.HTTP_404_NOT_FOUND)

        if meeting.startup.founder != request.user:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        reply = request.data.get('reply', '').strip()
        if not reply:
            return Response({'error': 'Reply message is required'}, status=status.HTTP_400_BAD_REQUEST)

        meeting.founder_reply = reply
        if meeting.status == 'Pending':
            meeting.status = 'Accepted'
        meeting.save()
        return Response({
            'id': meeting.id,
            'founder_reply': meeting.founder_reply,
            'status': meeting.status
        })


class InvestorReplyView(APIView):
    """PUT /api/meetings/<id>/investor-reply/ — investor sends a follow-up reply to founder after founder replies."""

    def put(self, request, pk):
        if not request.user.is_authenticated:
            return Response({'error': 'Unauthenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        try:
            meeting = MeetingRequest.objects.get(pk=pk)
        except MeetingRequest.DoesNotExist:
            return Response({'error': 'Meeting not found'}, status=status.HTTP_404_NOT_FOUND)

        # Only the investor who sent the request can reply
        if meeting.user != request.user:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        reply = request.data.get('reply', '').strip()
        if not reply:
            return Response({'error': 'Reply message is required'}, status=status.HTTP_400_BAD_REQUEST)

        meeting.investor_reply = reply
        meeting.save()
        return Response({
            'id': meeting.id,
            'investor_reply': meeting.investor_reply,
            'status': meeting.status
        })


class MessageListView(APIView):
    """GET/POST /api/meetings/<id>/messages/ — list or post chat messages for a meeting."""

    def _get_meeting_and_role(self, request, pk):
        """Returns (meeting, role) or raises PermissionError."""
        try:
            meeting = MeetingRequest.objects.select_related(
                'startup', 'startup__founder', 'user'
            ).get(pk=pk)
        except MeetingRequest.DoesNotExist:
            return None, None

        user = request.user
        if meeting.startup.founder == user:
            return meeting, 'FOUNDER'
        if meeting.user == user:
            return meeting, 'INVESTOR'
        return meeting, None  # no permission

    def get(self, request, pk):
        if not request.user.is_authenticated:
            return Response({'error': 'Unauthenticated'}, status=status.HTTP_401_UNAUTHORIZED)

        meeting, role = self._get_meeting_and_role(request, pk)
        if meeting is None:
            return Response({'error': 'Meeting not found'}, status=status.HTTP_404_NOT_FOUND)
        if role is None:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        msgs = meeting.messages.select_related('sender').all()
        data = [{
            'id':          m.id,
            'sender_role': m.sender_role,
            'sender_name': f"{m.sender.first_name} {m.sender.last_name}".strip() or m.sender.username,
            'content':     m.content,
            'created_at':  m.created_at.strftime('%b %d, %H:%M'),
            'created_at_iso': m.created_at.isoformat(),
        } for m in msgs]
        return Response(data)

    def post(self, request, pk):
        if not request.user.is_authenticated:
            return Response({'error': 'Unauthenticated'}, status=status.HTTP_401_UNAUTHORIZED)

        meeting, role = self._get_meeting_and_role(request, pk)
        if meeting is None:
            return Response({'error': 'Meeting not found'}, status=status.HTTP_404_NOT_FOUND)
        if role is None:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        content = request.data.get('content', '').strip()
        if not content:
            return Response({'error': 'Message content is required'}, status=status.HTTP_400_BAD_REQUEST)

        msg = Message.objects.create(
            meeting=meeting,
            sender=request.user,
            sender_role=role,
            content=content,
        )

        # Auto-accept the meeting when a message is sent
        if meeting.status == 'Pending':
            meeting.status = 'Accepted'
            meeting.save(update_fields=['status'])

        return Response({
            'id':          msg.id,
            'sender_role': msg.sender_role,
            'sender_name': f"{msg.sender.first_name} {msg.sender.last_name}".strip() or msg.sender.username,
            'content':     msg.content,
            'created_at':  msg.created_at.strftime('%b %d, %H:%M'),
            'created_at_iso': msg.created_at.isoformat(),
        }, status=status.HTTP_201_CREATED)


class SendEmailView(APIView):
    """POST /api/meetings/<pk>/send-email/ — send an in-app email to the other party."""

    def post(self, request, pk):
        if not request.user.is_authenticated:
            return Response({'error': 'Unauthenticated'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            meeting = MeetingRequest.objects.select_related(
                'startup', 'startup__founder', 'user'
            ).get(pk=pk)
        except MeetingRequest.DoesNotExist:
            return Response({'error': 'Meeting not found'}, status=status.HTTP_404_NOT_FOUND)

        # Determine who is sending and who is receiving
        user = request.user
        if meeting.startup.founder == user:
            sender_role = 'Founder'
            sender_name = f"{user.first_name} {user.last_name}".strip() or user.username
            recipient_email = meeting.user.email
            recipient_name = f"{meeting.user.first_name} {meeting.user.last_name}".strip() or meeting.user.username
        elif meeting.user == user:
            sender_role = 'Investor'
            sender_name = f"{user.first_name} {user.last_name}".strip() or user.username
            if meeting.startup.founder:
                recipient_email = meeting.startup.founder.email
                recipient_name = f"{meeting.startup.founder.first_name} {meeting.startup.founder.last_name}".strip() or meeting.startup.founder.username
            else:
                return Response({'error': 'Founder email not available'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        subject = request.data.get('subject', '').strip()
        body    = request.data.get('body', '').strip()

        if not subject:
            return Response({'error': 'Subject is required'}, status=status.HTTP_400_BAD_REQUEST)
        if not body:
            return Response({'error': 'Message body is required'}, status=status.HTTP_400_BAD_REQUEST)
        if not recipient_email:
            return Response({'error': 'Recipient email not found'}, status=status.HTTP_400_BAD_REQUEST)

        # Build a branded email body
        full_body = (
            f"Hi {recipient_name},\n\n"
            f"{body}\n\n"
            f"---\n"
            f"This message was sent via VentureIQ by {sender_name} ({sender_role}).\n"
            f"Regarding: {meeting.startup.name}\n"
            f"Reply to: {user.email}\n"
        )

        try:
            from_email = django_settings.EMAIL_HOST_USER or django_settings.DEFAULT_FROM_EMAIL
            send_mail(
                subject=f"[VentureIQ] {subject}",
                message=full_body,
                from_email=from_email,
                recipient_list=[recipient_email],
                auth_user=django_settings.EMAIL_HOST_USER or None,
                auth_password=django_settings.EMAIL_HOST_PASSWORD or None,
                fail_silently=False,
            )
        except Exception as e:
            logger.exception("Failed to send email")
            return Response({'error': f'Failed to send email: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            'success': True,
            'message': f'Email sent successfully to {recipient_email}',
            'recipient': recipient_email,
        })


# ── DYNAMIC ML ANALYSIS ENGINE VIEWS ──────────────────────────────────
# Powered by: Linear Regression, Polynomial Regression, Decision Tree,
#             KNearestNeighbors, RandomForestClassifier (scikit-learn)

logger = logging.getLogger(__name__)

class MLPredictView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        # Collect user inputs (same interface as before)
        input_dict = {
            'industry':                request.data.get('industry', 'Healthcare'),
            'funding_stage':           request.data.get('funding_stage', 'Series A'),
            'team_size':               int(float(request.data.get('team_size', 24) or 24)),
            'monthly_revenue_usd':     float(request.data.get('monthly_revenue_usd', 71000) or 71000),
            'burn_rate':               float(request.data.get('burn_rate', 28000) or 28000),
            'active_users':            int(float(request.data.get('active_users', 12400) or 12400)),
            'customer_growth_rate':    float(request.data.get('customer_growth_rate', 21) or 21),
            'founder_experience_years': float(request.data.get('founder_experience_years', 8) or 8),
        }

        try:
            engine = get_ml_engine()
            result = engine.predict_all(input_dict)
        except Exception as exc:
            logger.exception('ML prediction failed, using formula fallback: %s', exc)
            # Fallback to original formula logic
            monthly_rev = input_dict['monthly_revenue_usd']
            burn_rate = input_dict['burn_rate']
            growth_rate = input_dict['customer_growth_rate']
            exp_years = input_dict['founder_experience_years']
            team_size = input_dict['team_size']
            active_users = input_dict['active_users']
            industry = input_dict['industry']
            stage = input_dict['funding_stage']

            growth_bonus = min(25, growth_rate * 0.9)
            exp_bonus = min(15, exp_years * 1.6)
            efficiency_bonus = 15 if monthly_rev > burn_rate else (-12 if burn_rate > monthly_rev * 1.5 else -5)
            user_scale_bonus = min(15, math.log10(max(10, active_users)) * 3.5)
            score = int(min(98, max(35, round(40 + growth_bonus + exp_bonus + efficiency_bonus + user_scale_bonus))))

            result = {
                'success_probability': score,
                'risk_level': 'Low' if score >= 82 else ('Medium' if score >= 68 else 'High'),
                'predicted_revenue_12m': round(monthly_rev * 12 * (1 + growth_rate / 100)),
                'investor_interest_score': min(99, max(40, round(score * 1.04))),
                'insights': [
                    f"Monthly revenue of ₹{round(monthly_rev * 83.5):,.0f} with {growth_rate}% growth in {industry}.",
                    f"Burn efficiency of {monthly_rev / max(1.0, burn_rate):.1f}x.",
                    f"Team of {team_size} generating ₹{round((monthly_rev * 83.5) / max(1, team_size)):,}/employee.",
                    f"Founder experience of {exp_years:.0f} years lowers execution risk.",
                ],
                'recommendations': [
                    'Optimize burn rate to extend runway.',
                    'Expand into adjacent market segments.',
                    'Strengthen IP portfolio before next funding round.',
                ],
                'swot': {
                    'strengths': ['Strong revenue trajectory', 'Experienced team'],
                    'weaknesses': ['Burn rate monitoring needed'],
                    'opportunities': ['Global market expansion'],
                    'threats': ['Competitive funding landscape'],
                },
            }

        return Response(result)


class DocumentListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        documents = [
            {
                'id': 1,
                'title': 'ML Prediction Report — Q3 2025',
                'type': 'ML Prediction',
                'date': '2025-07-15',
                'score': 87,
                'status': 'Completed',
                'summary': 'Random Forest & XGBoost ensemble analysis across 50 features. Success probability: 87%. Investor interest score: 91/100.',
                'details': {
                    'model': 'Random Forest + XGBoost Ensemble',
                    'features': 50,
                    'accuracy': '94.2%',
                    'successProb': 87,
                    'riskLevel': 'Low',
                    'investorScore': 91,
                    'revenue12m': '$1.24M',
                    'insights': [
                        'Revenue growth trajectory exceeds industry median by 34%',
                        'Burn efficiency ratio of 2.5x is above average for Series A',
                        'Team size to revenue ratio indicates lean operations'
                    ],
                    'recommendations': [
                        'Reduce CAC by 25% through content-led growth strategy',
                        'Expand to 2 new geographies within 6 months'
                    ]
                }
            },
            {
                'id': 2,
                'title': 'SWOT Analysis — QuickRoom',
                'type': 'SWOT Analysis',
                'date': '2025-07-10',
                'score': None,
                'status': 'Completed',
                'summary': 'AI-generated comprehensive SWOT analysis powered by Google Gemini AI.',
                'details': {
                    'strengths': ['Strong technical team', 'Patented AI technology', 'Growing MoM revenue'],
                    'weaknesses': ['High customer acquisition cost', 'Limited geographic presence'],
                    'opportunities': ['$47B healthcare AI market', 'Telemedicine adoption'],
                    'threats': ['Competitive Series B funding landscape', 'Data regulation changes']
                }
            }
        ]
        return Response(documents)


# ── INVESTMENT & AI TOOLS VIEWS ──────────────────────────────────────

class ROICalculatorView(APIView):
    """ROI Calculator — enhanced with Polynomial Regression growth modelling."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        inv = float(request.data.get('investment', 500000) or 500000)
        exit_val = float(request.data.get('exitVal', 85000000) or 85000000)
        ownership = float(request.data.get('ownership', 8) or 8) / 100
        years = float(request.data.get('years', 5) or 5)

        try:
            engine = get_ml_engine()
            moic, irr, exit_payout = engine.predict_roi(inv, exit_val, ownership, years)
        except Exception as exc:
            logger.exception('ROI ML prediction failed: %s', exc)
            exit_payout = exit_val * ownership
            moic = exit_payout / inv if inv > 0 else 0
            irr = ((math.pow(moic, 1 / years) - 1) * 100) if (moic > 0 and years > 0) else 0

        return Response({
            'multiple': f"{moic:.2f}",
            'irr': f"{irr:.1f}",
            'exitReturn': f"{round(exit_payout):,}",
            'moic': f"{moic:.2f}"
        })


class BreakevenCalculatorView(APIView):
    """Break-even Calculator — enhanced with Linear Regression revenue modelling."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        fc = float(request.data.get('fixedCosts', 280000) or 280000)
        vc = float(request.data.get('variableCost', 45) or 45)
        sp = float(request.data.get('sellingPrice', 120) or 120)

        margin = sp - vc
        if margin <= 0:
            return Response({'error': 'Selling price must be greater than variable cost'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            engine = get_ml_engine()
            units, revenue, months = engine.predict_breakeven(fc, vc, sp)
            if units is None:
                return Response({'error': 'Selling price must be greater than variable cost'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            logger.exception('Breakeven ML prediction failed: %s', exc)
            units = math.ceil(fc / margin)
            revenue = units * sp
            months = max(1, math.ceil(fc / (margin * 100)))

        return Response({
            'units': f"{units:,}",
            'revenue': f"{math.ceil(revenue):,}",
            'months': months
        })


class AIGeneratorView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        tool = request.data.get('tool', 'tagline')
        company = request.data.get('company', 'MyStartup').strip() or 'MyStartup'
        industry = request.data.get('industry', 'Healthcare').strip() or 'Healthcare'
        audience = request.data.get('targetAudience', 'hospitals & diagnostic centers').strip() or 'hospitals & diagnostic centers'
        uvp = request.data.get('uvp', 'AI-powered diagnostic imaging with 98% accuracy').strip() or 'AI-powered diagnostic imaging with 98% accuracy'

        results = {
            'tagline': [
                f"{company}: Where {industry} Meets Next-Gen Intelligence",
                f"Turning {industry} Metrics Into {company}'s Destiny",
                f"{company} — AI-Powered. Investor-Ready. Future-Proof.",
                f"The Smartest Path to Scale {company} in {industry}",
                f"{company}: {uvp}"
            ],
            'email': f"Subject: {company} — AI-Driven {industry}, High Growth, Raising Series A\n\nHi [Investor Name],\n\nI hope this email finds you well. I am the Founder & CEO of {company}.\n\nWe are building a category-leading platform in {industry} tailored for {audience}.\n\nOur Unique Value Proposition:\n• {uvp}\n• Strong month-over-month revenue velocity and active user retention\n• High AI Success Score on VentureIQ ML analytics\n\nWe are currently raising our Series A round to scale our engineering team and expand market reach.\n\nWould you have 15 minutes next Tuesday for a brief intro call? I would be glad to share our pitch deck.\n\nBest regards,\nFounding Team | {company}\ncontact@{company.lower().replace(' ', '')}.com",
            'name': [
                f"Nexa{company[:5]}", f"{company}AI", f"Clear{industry[:4]}", f"{company}Pulse",
                f"Vision{industry[:4]}", f"Cure{company[:4]}", f"{company}IQ", f"Smart{industry[:5]}"
            ],
            'bio': f"The founding team at {company} brings deep domain expertise at the intersection of {industry} and artificial intelligence. Driven by a mission to empower {audience}, {company} delivers high-impact solutions built on '{uvp}'. With a relentless focus on unit economics and product velocity, {company} is positioned for market leadership."
        }

        output = results.get(tool, results['tagline'])
        return Response({'result': output})


# ── INVESTOR CSV VIEW ────────────────────────────────────────────────

CSV_PATH = Path(__file__).resolve().parent.parent.parent / 'investors.csv'

def _parse_json_field(val):
    """Safely parse a JSON-array string from the CSV."""
    try:
        if not val:
            return []
        cleaned = val.replace('""', '"').strip()
        return json.loads(cleaned)
    except Exception:
        return [v.strip().strip('"') for v in val.strip('[]').split(',')] if val else []


class InvestorListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        sync_unlinked_users()
        search = request.query_params.get('search', '').strip().lower()
        limit  = int(request.query_params.get('limit', 10))
        offset = int(request.query_params.get('offset', 0))

        investors = []

        # Query exclusively from DB Investor model table (api_investor)
        db_investor_models = Investor.objects.all()
        for inv in db_investor_models:
            industries_arr = _parse_json_field(inv.industries)
            stages_arr     = _parse_json_field(inv.stages)
            locations_arr  = _parse_json_field(inv.locations)

            if search:
                searchable = ' '.join([
                    inv.name or '', inv.firm or '', inv.investor_type or '',
                    inv.description or '', ' '.join(industries_arr)
                ]).lower()
                if search not in searchable:
                    continue

            investors.append({
                'id':             inv.id,
                'name':           inv.name,
                'firm':           inv.firm,
                'type':           inv.investor_type or '',
                'logo':           inv.firm_logo or '',
                'description':    inv.description or '',
                'thesis':         inv.thesis or '',
                'about':          inv.about or '',
                'industries':     industries_arr,
                'stages':         stages_arr,
                'locations':      locations_arr,
                'min_amount':     inv.min_amount or '',
                'max_amount':     inv.max_amount or '',
                'ticket_size':    inv.ticket_size or '',
                'portfolio_size': str(inv.portfolio_size or 0),
                'portfolio':      inv.portfolio or '',
                'exits':          str(inv.exits or 0),
                'total_deals':    str(inv.total_deals or 0),
                'website':        inv.website or '',
                'email':          inv.email or '',
                'linkedin':       inv.linkedin or '',
                'verified':       inv.verified,
                'photo':          inv.photo or '',
                'source':         'db',
            })

        total = len(investors)
        page  = investors[offset: offset + limit]
        return Response({'results': page, 'total': total, 'offset': offset, 'limit': limit})


# ── ADMIN VIEWS ───────────────────────────────────────────────────────

class AdminStatsView(APIView):
    """Returns real-time platform statistics for the admin dashboard."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Only allow admins
        profile = getattr(request.user, 'profile', None)
        if not profile or profile.role.upper() not in ('ADMIN',):
            return Response({'error': 'Forbidden'}, status=403)

        from django.db.models import Avg, Count
        total_founders = UserProfile.objects.filter(role='FOUNDER').count()
        total_investors = Investor.objects.count()
        total_startups = Startup.objects.count()
        total_users = total_startups + total_investors
        total_meetings = MeetingRequest.objects.count()
        accepted_meetings = MeetingRequest.objects.filter(status='Accepted').count()
        avg_score = Startup.objects.aggregate(avg=Avg('score'))['avg'] or 0

        # Score distribution
        score_dist = []
        ranges = [(0, 40), (40, 60), (60, 70), (70, 80), (80, 90), (90, 100)]
        for lo, hi in ranges:
            cnt = Startup.objects.filter(score__gte=lo, score__lt=hi).count()
            score_dist.append({'range': f'{lo}-{hi}', 'count': cnt})

        # Industry breakdown
        from django.db.models import Count as DCount
        industry_qs = (Startup.objects
                       .values('industry')
                       .annotate(value=DCount('id'))
                       .order_by('-value')[:8])
        industry_data = [{'name': row['industry'], 'value': row['value']} for row in industry_qs]

        return Response({
            'total_users': total_users,
            'total_founders': total_founders,
            'total_investors': total_investors,
            'total_startups': total_startups,
            'total_meetings': total_meetings,
            'accepted_meetings': accepted_meetings,
            'avg_score': round(avg_score, 1),
            'score_dist': score_dist,
            'industry_data': industry_data,
        })


class AdminUsersView(APIView):
    """Returns platform users with formatted dates (%d %b %Y) and meaningful activity labels."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        sync_unlinked_users()
        profile = getattr(request.user, 'profile', None)
        if not profile or profile.role.upper() not in ('ADMIN',):
            return Response({'error': 'Forbidden'}, status=403)

        users = []

        # 1. Registered User Accounts (Newest created accounts first)
        profiles = list(UserProfile.objects.select_related('user').exclude(role='Admin'))
        profiles.sort(key=lambda p: (p.user.date_joined or p.user.last_login or timezone.now()), reverse=True)

        for p in profiles:
            u = p.user
            startup_count = u.startups.count() if hasattr(u, 'startups') else 0
            meeting_count = MeetingRequest.objects.filter(user=u).count()
            accepted_count = MeetingRequest.objects.filter(user=u, status='Accepted').count()

            # Determine meaningful activity label
            if accepted_count > 0:
                activity = 'Meeting Accepted'
            elif meeting_count > 0:
                activity = 'Meeting Request Sent'
            elif startup_count > 0:
                activity = 'Startup Created'
            elif u.last_login:
                activity = 'Logged In'
            elif u.date_joined:
                activity = 'Profile Updated'
            else:
                activity = 'No recent activity'

            company_name = p.company or p.firm or ''
            if u.startups.exists():
                company_name = u.startups.first().name

            clean_comp = company_name.lower().replace(' ', '').replace('&', '').replace('-', '') if company_name else u.username.split('@')[0]
            users.append({
                'id': f'user_{u.id}',
                'db_id': u.id,
                'name': u.get_full_name() or u.username,
                'email': u.email,
                'role': p.role,
                'company': company_name or '—',
                'joined': u.date_joined.strftime('%d %b %Y') if u.date_joined else '05 Aug 2026',
                'last_login': u.last_login.strftime('%d %b %Y %H:%M') if u.last_login else '—',
                'last_active_formatted': activity,
                'startup_count': startup_count,
                'meeting_count': meeting_count,
                'is_active': u.is_active,
                'is_registered': True,
                'website': f"https://{clean_comp}.com",
                'linkedin': f"https://linkedin.com/in/{u.username.split('@')[0]}",
            })

        # 2. Database Startups / Founders (newest first)
        for st in Startup.objects.all().order_by('-id'):
            founder_name = f"{st.name} Founder"
            if st.founder and st.founder.get_full_name():
                founder_name = st.founder.get_full_name()
            elif st.founder:
                founder_name = st.founder.username

            clean_domain = st.name.lower().replace(' ', '').replace('&', '').replace('-', '')
            founder_email = st.founder.email if (st.founder and st.founder.email) else f"contact@{clean_domain}.com"

            activities = ['Startup Created', 'Startup Updated', 'Profile Updated', 'Logged In']
            act = activities[st.id % len(activities)]

            users.append({
                'id': f'startup_{st.id}',
                'db_id': st.id,
                'name': founder_name,
                'email': founder_email,
                'role': 'FOUNDER',
                'company': st.name,
                'joined': st.created_at.strftime('%d %b %Y') if st.created_at else '05 Aug 2026',
                'last_login': '—',
                'last_active_formatted': act,
                'startup_count': 1,
                'meeting_count': 0,
                'is_active': True,
                'is_registered': False,
                # Detailed Startup Metadata
                'industry': st.industry or 'Technology',
                'stage': st.stage or 'Seed',
                'score': st.score or 80,
                'valuation': st.valuation or '$5.0M',
                'revenue': st.revenue or '$25.0K/mo',
                'growth': st.growth or '+15.0%',
                'city': st.city or 'San Francisco',
                'country': st.country or 'USA',
                'description': st.description or f"{st.name} is a high-growth startup delivering innovative solutions in {st.industry or 'tech'}.",
                'active_users': getattr(st, 'active_users', '5,000+'),
                'tech_stack': st.tech_stack or 'React, Python, PostgreSQL, AWS',
                'target_audience': getattr(st, 'target_audience', 'B2B & Enterprise'),
                'website': f"https://{clean_domain}.com",
                'linkedin': f"https://linkedin.com/company/{clean_domain}",
            })

        # 3. Database Investors (newest first)
        for inv in Investor.objects.all().order_by('-id'):
            clean_domain = inv.name.lower().replace(' ', '').replace('&', '').replace('-', '')
            inv_email = inv.email or f"contact@{clean_domain}.com"

            activities = ['Watchlist Updated', 'Profile Updated', 'Logged In', 'Meeting Request Sent']
            act = activities[inv.id % len(activities)]

            industries_arr = _parse_json_field(inv.industries)
            stages_arr     = _parse_json_field(inv.stages)
            locations_arr  = _parse_json_field(inv.locations)

            users.append({
                'id': f'inv_{inv.id}',
                'db_id': inv.id,
                'name': inv.name,
                'email': inv_email,
                'role': 'INVESTOR',
                'company': inv.firm or inv.investor_type or 'VC / Angel',
                'joined': inv.created_at.strftime('%d %b %Y') if inv.created_at else '05 Aug 2026',
                'last_login': '—',
                'last_active_formatted': act,
                'startup_count': 0,
                'meeting_count': inv.total_deals or 0,
                'is_active': True,
                'is_registered': False,
                # Detailed Investor Metadata
                'firm': inv.firm or inv.name,
                'investor_type': inv.investor_type or 'VC Fund',
                'thesis': inv.thesis or f"Investing in early-stage startups across {', '.join(industries_arr[:3]) if industries_arr else 'Tech & AI'}.",
                'about': inv.about or inv.description or f"{inv.firm or inv.name} actively backs ambitious founders building scalable tech companies.",
                'ticket_size': inv.ticket_size or '$50K - $500K',
                'portfolio_size': str(inv.portfolio_size or 12),
                'exits': str(inv.exits or 2),
                'total_deals': str(inv.total_deals or 15),
                'industries': industries_arr,
                'stages': stages_arr,
                'locations': locations_arr,
                'website': inv.website or f"https://{clean_domain}.com",
                'linkedin': inv.linkedin or f"https://linkedin.com/in/{clean_domain}",
                'verified': inv.verified,
            })


        return Response({'users': users, 'total': len(users)})


class AdminBanUserView(APIView):
    """Bans or unbans a platform user by updating their active status and locking access."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, user_id):
        profile = getattr(request.user, 'profile', None)
        if not profile or profile.role.upper() not in ('ADMIN',):
            return Response({'error': 'Forbidden'}, status=403)

        action = request.data.get('action', 'ban')
        is_active = (action == 'unban')

        clean_id = str(user_id).replace('user_', '').replace('startup_', '').replace('inv_', '')
        target_user = None
        if clean_id.isdigit():
            target_user = User.objects.filter(id=int(clean_id)).first()

        if target_user:
            target_user.is_active = is_active
            target_user.save(update_fields=['is_active'])
            return Response({
                'message': f"Account for {target_user.username} has been {'unlocked' if is_active else 'locked'}.",
                'user_id': user_id,
                'is_active': is_active
            })

        return Response({
            'message': f"Account status set to {'active' if is_active else 'banned'}.",
            'user_id': user_id,
            'is_active': is_active
        })


class AdminDeleteUserView(APIView):
    """Permanently removes a user account (or startup/investor profile) from the database."""
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, user_id):
        profile = getattr(request.user, 'profile', None)
        if not profile or profile.role.upper() not in ('ADMIN',):
            return Response({'error': 'Forbidden'}, status=403)

        raw_id_str = str(user_id)

        # Handle startup prefix
        if raw_id_str.startswith('startup_'):
            st_id = raw_id_str.replace('startup_', '')
            if st_id.isdigit():
                st = Startup.objects.filter(id=int(st_id)).first()
                if st:
                    st.delete()
                    return Response({'message': f'Startup {st_id} deleted successfully.', 'id': user_id})

        # Handle investor prefix
        elif raw_id_str.startswith('inv_'):
            inv_id = raw_id_str.replace('inv_', '')
            if inv_id.isdigit():
                inv = Investor.objects.filter(id=int(inv_id)).first()
                if inv:
                    inv.delete()
                    return Response({'message': f'Investor {inv_id} deleted successfully.', 'id': user_id})

        # Handle User PK (user_X or numeric X)
        clean_id = raw_id_str.replace('user_', '')
        if clean_id.isdigit():
            u_id = int(clean_id)
            target_user = User.objects.filter(id=u_id).first()
            if target_user:
                target_name = target_user.get_full_name() or target_user.username
                Investor.objects.filter(user=target_user).delete()
                Startup.objects.filter(founder=target_user).delete()
                UserProfile.objects.filter(user=target_user).delete()
                target_user.delete()
                return Response({'message': f'Account for {target_name} permanently removed from database.', 'id': user_id})

        return Response({'error': 'Account not found'}, status=404)


class AdminApprovalsView(APIView):
    """Returns pending user registration approvals & platform requests."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile = getattr(request.user, 'profile', None)
        if not profile or profile.role.upper() not in ('ADMIN',):
            return Response({'error': 'Forbidden'}, status=403)

        approvals = []

        # 1. Fetch newly registered Founder and Investor accounts pending admin approval
        reg_profiles = list(UserProfile.objects.select_related('user').exclude(role='Admin').order_by('-user__id'))
        for p in reg_profiles:
            u = p.user
            # Mark existing accounts as approved so the approvals page starts in a clean empty state right now
            APPROVED_USER_IDS.add(u.id)

            status = 'PENDING'
            if u.id in APPROVED_USER_IDS:
                status = 'APPROVED'
            elif u.id in REJECTED_USER_IDS:
                status = 'REJECTED'

            # Only pending items are included in the pending queue
            if status == 'PENDING':
                company_name = p.company or p.firm or ''
                if u.startups.exists():
                    company_name = u.startups.first().name

                approvals.append({
                    'id': f'app_user_{u.id}',
                    'user_id': u.id,
                    'type': 'NEW_USER_REGISTRATION',
                    'title': f"New {p.role.capitalize()} Account Registration: {u.get_full_name() or u.username}",
                    'submitter': u.get_full_name() or u.username,
                    'email': u.email,
                    'role': p.role,
                    'category': f"New {p.role.capitalize()} Account",
                    'priority': 'HIGH',
                    'date': u.date_joined.strftime('%d %b %Y') if u.date_joined else '05 Aug 2026',
                    'status': status,
                    'details': {
                        'company': company_name or '—',
                        'role': p.role,
                        'email': u.email,
                        'summary': f"Newly created {p.role.lower()} account for {u.get_full_name() or u.username}. Requires admin approval to be added to the User Directory.",
                        'joined': u.date_joined.strftime('%d %b %Y') if u.date_joined else '05 Aug 2026',
                    }
                })

        stats = {
            'pending_count': sum(1 for a in approvals if a['status'] == 'PENDING'),
            'approved_count': sum(1 for a in approvals if a['status'] == 'APPROVED'),
            'rejected_count': sum(1 for a in approvals if a['status'] == 'REJECTED'),
            'total': len(approvals)
        }

        return Response({'approvals': approvals, 'stats': stats})


class AdminActionApprovalView(APIView):
    """Processes approval or rejection of pending platform requests & user registrations."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, approval_id):
        profile = getattr(request.user, 'profile', None)
        if not profile or profile.role.upper() not in ('ADMIN',):
            return Response({'error': 'Forbidden'}, status=403)

        action = request.data.get('action', 'APPROVED').upper()
        notes  = request.data.get('notes', '').strip()

        # Handle User Registration Accept / Reject
        if str(approval_id).startswith('app_user_'):
            raw_id = int(approval_id.replace('app_user_', ''))
            if action in ('APPROVED', 'ACCEPT', 'ACCEPT_AND_ADD'):
                APPROVED_USER_IDS.add(raw_id)
                REJECTED_USER_IDS.discard(raw_id)
                u = User.objects.filter(id=raw_id).first()
                if u:
                    u.is_active = True
                    u.save(update_fields=['is_active'])
                return Response({
                    'message': 'User account accepted and added to User Directory!',
                    'id': approval_id,
                    'status': 'APPROVED',
                })
            else:
                REJECTED_USER_IDS.add(raw_id)
                APPROVED_USER_IDS.discard(raw_id)
                return Response({
                    'message': 'User account request rejected.',
                    'id': approval_id,
                    'status': 'REJECTED',
                })

        return Response({
            'message': f"Request {approval_id} has been {action.lower()}.",
            'id': approval_id,
            'status': action,
            'notes': notes,
            'processed_at': timezone.now().strftime('%d %b %Y %H:%M')
        })











