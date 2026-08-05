from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, Startup, Watchlist, MeetingRequest, DocumentReport


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = [
            'role', 'company', 'firm', 'avatar',
            'bio', 'phone', 'linkedin', 'location', 'website',
            'investment_thesis', 'min_ticket', 'max_ticket',
            'preferred_industries', 'preferred_stages',
            'total_investments', 'successful_exits',
        ]


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    role = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile', 'role']


class StartupSerializer(serializers.ModelSerializer):
    tags_array = serializers.SerializerMethodField()
    founder_name = serializers.SerializerMethodField()
    founder_email = serializers.SerializerMethodField()

    class Meta:
        model = Startup
        fields = '__all__'
        extra_kwargs = {
            # Allow all char/text fields to be blank so founders can save partial profiles
            'name':            {'required': False, 'allow_blank': True},
            'industry':        {'required': False, 'allow_blank': True},
            'stage':           {'required': False, 'allow_blank': True},
            'country':         {'required': False, 'allow_blank': True},
            'city':            {'required': False, 'allow_blank': True, 'allow_null': True},
            'revenue':         {'required': False, 'allow_blank': True},
            'growth':          {'required': False, 'allow_blank': True},
            'risk_level':      {'required': False, 'allow_blank': True},
            'valuation':       {'required': False, 'allow_blank': True},
            'description':     {'required': False, 'allow_blank': True, 'allow_null': True},
            'tags':            {'required': False, 'allow_blank': True},
            'tech_stack':      {'required': False, 'allow_blank': True},
            'target_audience': {'required': False, 'allow_blank': True},
            'website':         {'required': False, 'allow_blank': True, 'allow_null': True},
            'founder':         {'required': False, 'allow_null': True},
        }

    def get_tags_array(self, obj):
        if not obj.tags:
            return []
        return [t.strip() for t in obj.tags.split(',') if t.strip()]

    def get_founder_name(self, obj):
        if obj.founder:
            return f"{obj.founder.first_name} {obj.founder.last_name}".strip() or obj.founder.username
        return None

    def get_founder_email(self, obj):
        return obj.founder.email if obj.founder else None


class WatchlistSerializer(serializers.ModelSerializer):
    startup = StartupSerializer(read_only=True)

    class Meta:
        model = Watchlist
        fields = ['id', 'startup', 'notes', 'created_at']


class MeetingRequestSerializer(serializers.ModelSerializer):
    startup_name = serializers.CharField(source='startup.name', read_only=True)
    startup_id = serializers.IntegerField(source='startup.id', read_only=True)
    investor_name = serializers.SerializerMethodField()
    firm = serializers.SerializerMethodField()

    class Meta:
        model = MeetingRequest
        fields = ['id', 'startup', 'startup_id', 'startup_name', 'investor_name', 'firm',
                  'message', 'status', 'created_at']

    def get_investor_name(self, obj):
        u = obj.user
        return f"{u.first_name} {u.last_name}".strip() or u.username

    def get_firm(self, obj):
        try:
            return obj.user.profile.firm or 'Independent'
        except Exception:
            return 'Independent'


class DocumentReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentReport
        fields = ['id', 'title', 'doc_type', 'score', 'status', 'summary', 'details_json', 'created_at']
