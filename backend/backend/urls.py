from django.urls import path, include
from django.contrib import admin
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from chatapp.views import LoginView, ChatbotAPI, UserRegistrationView, EmotionalHistoryView
from . import consumers  # Import your consumer class

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('chatapp.urls')),
    path('api/login/', LoginView.as_view(), name='login'),
    path('api/signup/', UserRegistrationView.as_view(), name='signup'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/chat/', ChatbotAPI.as_view(), name='chatbot_api'),
    path('api/emotional_history/', EmotionalHistoryView.as_view(), name='emotional_history'),
]

websocket_urlpatterns = [
    path('ws/chat/', consumers.ChatConsumer.as_asgi()),  # Update the path as needed
]