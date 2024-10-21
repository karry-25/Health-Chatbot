from django.urls import path
from .views import ChatbotAPI

urlpatterns = [
    path('/api/chat/', ChatbotAPI.as_view(), name='chatbot_api'),
]