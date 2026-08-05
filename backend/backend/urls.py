from django.contrib import admin
from django.urls import path, include, re_path
from django.views.static import serve
from django.http import HttpResponse, JsonResponse
from pathlib import Path

# Path(__file__) = backend/backend/urls.py
# parent = backend/backend
# parent.parent = backend
# parent.parent.parent = SEM4 VentureIQ (workspace root)
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
DIST_DIR = PROJECT_ROOT / 'frontend' / 'dist'
ASSETS_DIR = DIST_DIR / 'assets'

def index_view(request):
    index_path = DIST_DIR / 'index.html'
    if index_path.exists():
        with open(index_path, 'r', encoding='utf-8') as f:
            return HttpResponse(f.read(), content_type='text/html')
    return JsonResponse({
        'status': 'running',
        'app': 'VentureIQ Backend',
        'api': '/api/',
        'admin': '/admin/',
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    re_path(r'^assets/(?P<path>.*)$', serve, {'document_root': ASSETS_DIR}),
    re_path(r'^.*$', index_view, name='frontend_index'),
]
