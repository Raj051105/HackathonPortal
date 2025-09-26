from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),  # JWT login
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),  # JWT token refresh
    path('api/accounts/', include('accounts.urls')),   # User authentication and management
    path('api/teams/', include('teams.urls')),         # Teams and ideas
    path('api/judging/', include('judging.urls')),     # Rubric and scoring
    path('admin/', admin.site.urls),
]
