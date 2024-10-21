from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Conversation
from .serializers import ConversationSerializer
from .utils import process_user_input, transcribe_audio, analyze_emotion
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import status
from django.contrib.auth import authenticate
import logging

# Set up logging
logger = logging.getLogger(__name__)

class LoginView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        if user is not None:
            return super().post(request, *args, **kwargs)
        else:
            return Response({'error': 'Invalid username or password'}, status=status.HTTP_401_UNAUTHORIZED)

class ChatbotAPI(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        user = request.user
        message = request.data.get('message', '')
        audio_file = request.FILES.get('audio', None)

        if audio_file:
            try:
                # Handle audio processing
                message_text, emotion = transcribe_audio(audio_file)
            except Exception as e:
                logger.error(f"Audio transcription error: {str(e)}")
                return Response({'error': 'Audio processing failed.'}, status=500)

        else:
            message_text = message
            emotion = analyze_emotion(message_text)

        if not message_text:
            return Response({'error': 'No input provided.'}, status=400)

        # Process the user's input and get the response and emotion
        try:
            bot_response, emotion = process_user_input(message_text)
        except Exception as e:
            logger.error(f"Processing user input error: {str(e)}")
            return Response({'error': 'Failed to process input.'}, status=500)

        # Save the conversation
        conversation = Conversation.objects.create(
            user=user,
            message=message_text,
            response=bot_response,
            emotion=emotion
        )
        serializer = ConversationSerializer(conversation)
        return Response(serializer.data)
