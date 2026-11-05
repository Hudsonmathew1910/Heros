# backend/urls.py

from django.contrib import admin
from django.urls import path, include, re_path
from backend import views
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from django.shortcuts import redirect
from django.templatetags.static import static as static_url

# SEO / Google Search Console (must stay above the catch-all 404 route)
seo_ctx = {'site_url': settings.SITE_URL.rstrip('/')}

urlpatterns = [
    path('google848a3ada06e16e93.html', TemplateView.as_view(template_name='seo/google848a3ada06e16e93.html', content_type='text/html')),
    path('robots.txt', TemplateView.as_view(template_name='seo/robots.txt', content_type='text/plain', extra_context=seo_ctx)),
    path('favicon.ico', lambda request: redirect(static_url('images/favicon/favicon.ico'), permanent=True)),
    path('sitemap.xml', TemplateView.as_view(template_name='seo/sitemap.xml', content_type='application/xml', extra_context=seo_ctx)),
    path('admin/', admin.site.urls),
    path('', views.home, name='home'),
    path('landing/', views.landing, name='landing'),
    path('', include('backend.urls')),
    path('infinsight/', include('infinsight.urls')),
    path('zuno/', include('zuno.urls')),
    
    # Catch-all pattern to force custom 404 even in DEBUG mode (excluding admin so APPEND_SLASH still works)
    re_path(r'^(?!admin(?:/|$)).*$', views.custom_404),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

handler404 = 'backend.views.custom_404'