from django.urls import path, include
from django.contrib import admin
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from chatapp.views import LoginView, ChatbotAPI

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('chatapp.urls')),
    path('api/login/', LoginView.as_view(), name='login'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/chat/', ChatbotAPI.as_view(), name='chatbot_api'),
]