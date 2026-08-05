from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, LoginView, MeView, PasswordResetView,
    ProfileView,
    StartupListView, StartupDetailView, FounderStartupView,
    BookmarkToggleView, WatchlistListView,
    MeetingRequestView, MeetingListView, MeetingUpdateView, InvestorMeetingsView, FounderReplyView, InvestorReplyView, MessageListView, SendEmailView,
    MLPredictView, DocumentListView,
    ROICalculatorView, BreakevenCalculatorView, AIGeneratorView,
    InvestorListView,
    AdminStatsView, AdminUsersView, AdminBanUserView,
    AdminApprovalsView, AdminActionApprovalView,
)

urlpatterns = [
    # Auth
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/me/', MeView.as_view(), name='me'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/reset-password/', PasswordResetView.as_view(), name='reset_password'),

    # Profile
    path('profile/', ProfileView.as_view(), name='profile'),

    # Startups
    path('startups/', StartupListView.as_view(), name='startup_list'),
    path('startups/mine/', FounderStartupView.as_view(), name='founder_startup'),
    path('startups/meetings/', MeetingListView.as_view(), name='meeting_list'),
    path('startups/<int:pk>/', StartupDetailView.as_view(), name='startup_detail'),
    path('startups/<int:pk>/bookmark/', BookmarkToggleView.as_view(), name='bookmark_toggle'),
    path('startups/<int:pk>/meeting/', MeetingRequestView.as_view(), name='meeting_request'),

    # Watchlist
    path('watchlist/', WatchlistListView.as_view(), name='watchlist'),

    # Meetings
    path('meetings/<int:pk>/', MeetingUpdateView.as_view(), name='meeting_update'),
    path('meetings/<int:pk>/reply/', FounderReplyView.as_view(), name='meeting_reply'),
    path('meetings/<int:pk>/investor-reply/', InvestorReplyView.as_view(), name='meeting_investor_reply'),
    path('meetings/<int:pk>/messages/', MessageListView.as_view(), name='meeting_messages'),
    path('meetings/<int:pk>/send-email/', SendEmailView.as_view(), name='meeting_send_email'),
    path('meetings/sent/', InvestorMeetingsView.as_view(), name='meetings_sent'),

    # ML & Analysis
    path('analysis/predict/', MLPredictView.as_view(), name='ml_predict'),
    path('analysis/documents/', DocumentListView.as_view(), name='documents_list'),

    # Tools
    path('tools/roi/', ROICalculatorView.as_view(), name='roi_calculator'),
    path('tools/breakeven/', BreakevenCalculatorView.as_view(), name='breakeven_calculator'),
    path('tools/generate/', AIGeneratorView.as_view(), name='ai_generator'),

    # Investors (from CSV)
    path('investors/', InvestorListView.as_view(), name='investor_list'),

    # Admin
    path('admin/stats/', AdminStatsView.as_view(), name='admin_stats'),
    path('admin/users/', AdminUsersView.as_view(), name='admin_users'),
    path('admin/users/<str:user_id>/ban/', AdminBanUserView.as_view(), name='admin_ban_user'),
    path('admin/approvals/', AdminApprovalsView.as_view(), name='admin_approvals'),
    path('admin/approvals/<str:approval_id>/action/', AdminActionApprovalView.as_view(), name='admin_action_approval'),
]


