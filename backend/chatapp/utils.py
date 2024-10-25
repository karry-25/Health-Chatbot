from nltk.sentiment.vader import SentimentIntensityAnalyzer
import numpy as np
import librosa
import tempfile, os
import speech_recognition as sr
from groq import Groq
import logging

# Set up logging
logger = logging.getLogger(__name__)

API_KEY = API_KEY = os.environ.get('GROQ_API_KEY')

def process_user_input(user_input):
    # Send the user input to Groq AI and receive the response
    prompt = f"""You are an empathetic chatbot designed to analyze users' emotions and help them feel better. Your primary goals are to:

    Engage users: Start conversations in a friendly and inviting manner, encouraging them to share their feelings.Keep your responses short and to-the-point. Don't ask too many questions at the same time.
    Analyze emotions: Use user responses to gauge their emotional state, employing techniques like reflective listening and emotional validation.
    Provide support: Offer comforting responses, mood-boosting activities, and practical tips to help improve their emotional well-being.
    Encourage expression: Ask open-ended questions to facilitate deeper conversations about their thoughts and feelings.
    Maintain a positive tone: Keep the dialogue uplifting and reassuring, reminding users that it’s okay to feel a range of emotions. 
    Always prioritize user comfort and confidentiality.
    Only return the text response. Don't include information about emotion.
    
    User Input: {user_input}
    """
    client = Groq(api_key=API_KEY)
    
    try:
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama3-8b-8192",
        )
        bot_message = chat_completion.choices[0].message.content
        print(bot_message)
    except Exception as e:
        print(f"Error during Groq AI request: {e}")
        bot_message = "I'm sorry, I couldn't process your request."

    return bot_message

def analyze_emotion(text):
    sia = SentimentIntensityAnalyzer()
    scores = sia.polarity_scores(text)
    compound = scores['compound']
    if compound >= 0.05:
        emotion = "positive"
    elif compound <= -0.05:
        emotion = "negative"
    else:
        emotion = "neutral"
    return emotion

def transcribe_audio(audio_file):
    # Transcribe the audio file using the Google Cloud Speech-to-Text API
    try:
        # Create a temporary file to save the uploaded audio
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_audio_file:
            for chunk in audio_file.chunks():
                temp_audio_file.write(chunk)
            temp_audio_file.flush()
            audio_file_name = temp_audio_file.name

        # Use speech recognition to transcribe audio
        recognizer = sr.Recognizer()
        with sr.AudioFile(audio_file_name) as source:
            audio = recognizer.record(source)
            text = recognizer.recognize_google(audio)

        # Analyze emotion from the audio text
        emotion = analyze_audio_emotion(text)

    except Exception as e:
        logger.error(f"Transcription error: {str(e)}")
        text, emotion = '', 'unknown'

    finally:
        # Clean up the temporary audio file
        if os.path.exists(audio_file_name):
            os.remove(audio_file_name)

    return text, emotion

def analyze_audio_emotion(audio_file_path):
    y, sr = librosa.load(audio_file_path)
    mfccs = np.mean(librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13).T, axis=0)

    # Simulated emotion analysis for demonstration
    emotion = np.random.choice(['happy', 'sad', 'angry', 'neutral'])
    
    return emotion
