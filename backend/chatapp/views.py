import logging
from rest_framework.views import APIView
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import authenticate
from .models import Conversation
from .serializers import ConversationSerializer
from .utils import process_user_input, transcribe_audio, analyze_emotion
from .serializers import UserRegistrationSerializer
from rest_framework.permissions import AllowAny
from django.http import FileResponse, JsonResponse
import io, os, tempfile, time
import pyttsx3
from pydub import AudioSegment
import speech_recognition as sr
import openai
from groq import Groq
from fpdf import FPDF

# Configure logging
logger = logging.getLogger(__name__)

class UserRegistrationView(generics.CreateAPIView):
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                'user': {
                    'username': user.username,
                    'email': user.email
                }
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        if user:
            return super().post(request, *args, **kwargs)
        return Response({'error': 'Invalid username or password'}, status=status.HTTP_401_UNAUTHORIZED)


class ChatbotAPI(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        logger.info("Received chatbot request")
        user = request.user
        message = request.data.get('message', '')
        audio_file = request.FILES.get('audio')

        # Transcribe audio if available
        message_text, emotion = self.handle_audio_and_text(message, audio_file)

        if not message_text:
            return Response({'error': 'No input provided.'}, status=status.HTTP_400_BAD_REQUEST)

        # Process user input through OpenAI
        bot_response = process_user_input(message_text)

        # Convert bot response to speech if audio was provided
        audio_response = None
        if audio_file:
            audio_response = self.convert_text_to_speech(bot_response)

        # Save conversation and respond
        return self.save_and_respond(user, message_text, bot_response, emotion, audio_response)

    def handle_audio_and_text(self, message, audio_file):
        """Handles both text and audio processing."""
        if audio_file:
            try:
                message_text = self.transcribe_audio(audio_file)
                emotion = analyze_emotion(message_text)
                logger.info(f"Transcribed audio: {message_text}")
                return message_text, emotion
            except Exception as e:
                logger.error(f"Audio processing error: {e}")
                raise Response({'error': 'Audio processing failed.'}, status=500)
        else:
            emotion = analyze_emotion(message)
            return message, emotion

    def transcribe_audio(self, audio_file):
        """Convert audio file to text using SpeechRecognition."""
        logger.info("Starting audio transcription")

        temp_audio_path = None  # Initialize outside try block
        temp_wav_file = None
        
        try:
            # Write audio to temp file
            with tempfile.NamedTemporaryFile(suffix='.webm', delete=False) as temp_audio_file:
                for chunk in audio_file.chunks():
                    temp_audio_file.write(chunk)
                temp_audio_path = temp_audio_file.name  # Store temp file path

            # Load and convert to WAV using pydub
            audio = AudioSegment.from_file(temp_audio_path, format="webm")

            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_wav_file:
                audio.export(temp_wav_file.name, format='wav')
                temp_wav_file_path = temp_wav_file.name

            # Use SpeechRecognition to transcribe audio
            recognizer = sr.Recognizer()
            with sr.AudioFile(temp_wav_file_path) as source:
                audio_data = recognizer.record(source)

            # Perform transcription using Sphinx
            transcript = recognizer.recognize_sphinx(audio_data)
            logger.info(f"Audio transcription result: {transcript}")
            return transcript

        except sr.UnknownValueError:
            logger.warning("Speech Recognition could not understand audio")
            return ""
        except Exception as e:
            logger.error(f"Transcription error: {e}")
            return ""
        finally:
            # Ensure temp files are deleted after use
            if temp_audio_path and os.path.exists(temp_audio_path):
                try:
                    time.sleep(0.5)  # Allow some time for process to release the file lock
                    os.remove(temp_audio_path)
                    logger.info(f"Deleted temporary audio file: {temp_audio_path}")
                except Exception as e:
                    logger.error(f"Error deleting temp audio file {temp_audio_path}: {e}")

            if temp_wav_file and os.path.exists(temp_wav_file_path):
                try:
                    time.sleep(0.5)  # Allow time for file to be released
                    os.remove(temp_wav_file_path)
                    logger.info(f"Deleted temporary wav file: {temp_wav_file_path}")
                except Exception as e:
                    logger.error(f"Error deleting temp wav file {temp_wav_file_path}: {e}")

    def process_openai_input(self, message_text):
        """Processes user input through OpenAI's API."""
        logger.info("Processing user input through OpenAI")
        try:
            openai.api_key = os.environ.get('OPENAI_API_KEY')
            response = openai.Completion.create(
                model="text-davinci-003",
                prompt=self.build_openai_prompt(message_text),
                max_tokens=150
            )
            return response.choices[0].text.strip()
        except Exception as e:
            logger.error(f"Error processing OpenAI request: {e}")
            return "Sorry, something went wrong. Please try again."

    def build_openai_prompt(self, message_text):
        """Builds a dynamic prompt for OpenAI based on user input."""
        return f"""
        You are an empathetic chatbot designed to analyze users' emotions and help them feel better. 
        Primary goals:
        - Engage users by encouraging them to share their feelings.
        - Analyze emotions and provide mood-boosting responses.
        User Input: {message_text}
        """

    def convert_text_to_speech(self, text):
        """Convert text to speech using pyttsx3 (offline)."""
        logger.info("Converting text to speech")
        
        temp_audio_path = None  # Ensure scope outside try block

        try:
            engine = pyttsx3.init()
            engine.setProperty('rate', 150)
            engine.setProperty('volume', 1.0)

            with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as temp_audio_file:
                temp_audio_path = temp_audio_file.name
                engine.save_to_file(text, temp_audio_path)
                engine.runAndWait()

            time.sleep(0.5)  # Ensure the file is fully written before accessing

            with open(temp_audio_path, 'rb') as f:
                audio_content = io.BytesIO(f.read())

            return audio_content

        except Exception as e:
            logger.error(f"Text-to-speech conversion error: {e}")
            return None

        finally:
            # Ensure temp file is deleted after use
            if temp_audio_path and os.path.exists(temp_audio_path):
                try:
                    time.sleep(0.95)  # Ensure process releases the file lock
                    os.remove(temp_audio_path)
                    logger.info(f"Deleted temporary audio file: {temp_audio_path}")
                except Exception as e:
                    logger.error(f"Error deleting temp audio file {temp_audio_path}: {e}")

    def save_and_respond(self, user, message_text, bot_response, emotion, audio_response=None):
        """Save conversation and return the response."""
        try:
            conversation = Conversation.objects.create(
                user=user,
                message=message_text,
                response=bot_response,
                emotion=emotion
            )
            logger.info("Conversation saved successfully")
        except Exception as e:
            logger.error(f"Error saving conversation: {e}")
            return JsonResponse({'error': 'Failed to save conversation.'}, status=500)

        # Return audio file if `audio_response` exists
        if audio_response:
            audio_response.seek(0)
            print(audio_response)
            return FileResponse(audio_response, as_attachment=True, filename="response.mp3", content_type="audio/mpeg")

        # For non-audio requests, return JSON response
        serializer = ConversationSerializer(conversation)
        return JsonResponse(serializer.data, safe=False)


class EmotionalHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Step 1: Retrieve user's conversation history
        conversations = Conversation.objects.filter(user=user).values_list('message', flat=True)
        conversation_text = "\n".join(conversations)

        # Step 2: Analyze using OpenAI
        analysis = self.analyze_conversations_with_openai(conversation_text)

        # Step 3: Generate PDF report from analysis
        pdf_report = self.generate_pdf_report(user, analysis)

        # Return PDF as a downloadable response
        pdf_report.seek(0)
        return FileResponse(pdf_report, as_attachment=True, filename="emotional_history_report.pdf", content_type="application/pdf")

    def analyze_conversations_with_openai(self, conversation_text):
        # Define the parameters to analyze
        parameters = [
            "Job Satisfaction", "Stress and Burnout levels", "Engagement and Motivation",
            "Interpersonal Relationships", "Organizational Culture and Climate",
            "Adaptation to Change", "Mental Health and Wellbeing", "Work-Life balance",
            "Recognition and Appreciation", "Career Development and Growth",
            "Safety and Security Needs", "Feedback and Communication"
        ]

        # Create a prompt for OpenAI with conversation history and analysis parameters
        prompt = f"""
        Analyze the following conversation history for the user based on these parameters:
        {", ".join(parameters)}.
        
        Conversation History:
        {conversation_text}

        For each parameter, provide a brief analysis based on the content.The analysis must be concise and to the point. Organize the analysis as follows:
        - Parameter Name: Analysis
        """
        API_KEY = os.environ.get('GROQ_API_KEY')
        client = Groq(api_key=API_KEY)
    
        try:
            chat_completion = client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="llama3-8b-8192",
            )
            bot_message = chat_completion.choices[0].message.content
            print(bot_message)
            return bot_message
            
        except Exception as e:
            print(f"Error during Groq AI request: {e}")
            bot_message = "I'm sorry, I couldn't process your request."

    def generate_pdf_report(self, user, analysis_text):
        # Step 1: Create a PDF in memory
        pdf_buffer = io.BytesIO()
        pdf = FPDF()
        pdf.add_page()
    
        # Step 2: Add title and user info
        pdf.set_font("Arial", "B", 16)
        pdf.cell(0, 10, f"Emotional History Report for {user.username}", ln=True, align="C")
        pdf.ln(10)
        
        # Step 3: Add Table of Contents
        pdf.set_font("Arial", "B", 14)
        pdf.cell(0, 10, "Table of Contents", ln=True, align="L")
        pdf.set_font("Arial", "", 12)
        pdf.cell(0, 10, "1. Summary", ln=True, align="L")
        pdf.cell(0, 10, "2. Detailed Analysis", ln=True, align="L")
        pdf.ln(10)
        
        # Step 4: Add Summary Section
        pdf.set_font("Arial", "B", 14)
        pdf.cell(0, 10, "Summary", ln=True, align="L")
        pdf.set_font("Arial", "", 12)
        pdf.multi_cell(0, 10, "This section provides a brief summary of the key findings from the analysis.")
        pdf.ln(10)
        
        # Step 5: Add Detailed Analysis Section
        pdf.set_font("Arial", "B", 14)
        pdf.cell(0, 10, "Detailed Analysis", ln=True, align="L")
        pdf.ln(10)
        
        # Step 6: Add analysis data
        pdf.set_font("Arial", "", 12)
        lines = analysis_text.split("\n")
        parameter = ""
        analysis = ""
        for line in lines:
            if line.startswith("**"):
                if parameter and analysis:
                    pdf.set_font("Arial", "B", 12)
                    pdf.multi_cell(0, 10, parameter)
                    pdf.set_font("Arial", "", 12)
                    pdf.multi_cell(0, 10, analysis.strip())
                    pdf.ln(5)
                parameter = line.strip("**").strip(":").strip()
                analysis = ""
            else:
                if line.startswith("Analysis: "):
                    analysis += line.replace("Analysis: ", "").strip() + " "
                else:
                    analysis += line.strip() + " "
        if parameter and analysis:
            pdf.set_font("Arial", "B", 12)
            pdf.multi_cell(0, 10, parameter)
            pdf.set_font("Arial", "", 12)
            pdf.multi_cell(0, 10, analysis.strip())
            pdf.ln(5)
    
        # Save PDF data in memory
        pdf.output(pdf_buffer)
        pdf_buffer.seek(0)
        return pdf_buffer

