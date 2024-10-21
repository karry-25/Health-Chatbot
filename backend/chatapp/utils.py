from nltk.sentiment.vader import SentimentIntensityAnalyzer
import numpy as np
import librosa
import tempfile, os
import speech_recognition as sr
from groq import Groq
import logging

# Set up logging
logger = logging.getLogger(__name__)

API_KEY = "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"

def process_user_input(user_input):
    # Send the user input to Groq AI and receive the response
    prompt = f"""You are an Emotional health analyzer, your task is to analyze the user input and provide the Emotional Health analysis.
    User Input: {user_input}
    """
    client = Groq(api_key=API_KEY)
    
    try:
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama3-8b-8192",
        )
        bot_message = chat_completion.choices[0].message.content
    except Exception as e:
        print(f"Error during Groq AI request: {e}")
        bot_message = "I'm sorry, I couldn't process your request."

    # Analyze the emotion from the user's input
    emotion = analyze_emotion(user_input)
    return bot_message, emotion

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
