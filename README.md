# Health-Chatbot
This code builds a chatbot API in Django that includes both text and audio responses. Additionally, it provides a feature to generate and download an emotional history report based on conversations with the chatbot. This report is analyzed using Groq (OpenAI can also be used similarly) and generated as a downloadable PDF. Here’s a detailed explanation of each part of the code, its purpose, and functionality.

Code Structure Overview
The code is organized into several views and helper functions that achieve the following:

User Registration and Login: Basic authentication using Django REST Framework’s TokenObtainPairView for login.
Chatbot Interaction: Accepts user messages (text or audio) and generates responses using an OpenAI API.
Audio Processing: Processes audio files for transcription and generates text-to-speech audio responses.
Emotional History Report: Aggregates user conversations, sends them for analysis on specific parameters, and generates a PDF report.
1. User Registration and Login
The UserRegistrationView and LoginView classes handle user registration and login. These views:

UserRegistrationView: Allows new users to register by saving their data in the UserRegistrationSerializer.
LoginView: Uses Django’s built-in authentication to verify credentials and return a JWT if the user is authenticated.
2. Chatbot Interaction with Text and Audio
The ChatbotAPI class is the main API for user interaction. Here’s a breakdown of its methods:

post Method
This method handles the main chatbot interaction:

Request Parsing: Checks if the user’s input is a text message or an audio file.
Text Processing with OpenAI: Uses OpenAI’s API to generate a response based on user input.
Audio Processing: If the user sends audio, it is transcribed, and the response can be converted back to audio if needed.
Response Handling: The conversation is saved, and the appropriate response (text or audio) is sent back to the user.
handle_audio_and_text Method
Handles both text and audio input:

Audio Input: Transcribes audio to text and analyzes emotion.
Text Input: Analyzes emotion directly from text.
transcribe_audio Method
Converts audio files to text using SpeechRecognition and pydub:

Converts .webm audio to .wav format for compatibility with SpeechRecognition.
Uses the Sphinx engine for transcription, providing basic speech-to-text capability.
process_openai_input and build_openai_prompt Methods
These methods use OpenAI's API to generate chatbot responses based on the user input:

Prompt Design: Builds prompts tailored to understand and analyze emotions.
Error Handling: Returns a generic message if there is an API error.
convert_text_to_speech Method
Generates an audio response using pyttsx3 (offline TTS engine):

Converts text responses to audio (saved as .mp3).
Returns the audio file as a BytesIO object for later download or playback.
3. Saving and Responding to Conversations
save_and_respond Method
This method saves each user interaction with the chatbot to the database:

Saves the Conversation model instance with the message, response, and emotion.
Checks if an audio response is available. If so, returns it as a FileResponse; otherwise, it returns JSON.
4. Emotional History Report Generation
The EmotionalHistoryView class allows users to download an emotional history report as a PDF. This report:

Analyzes user conversations on fixed parameters.
Uses Groq or OpenAI to create an analysis based on these parameters.
analyze_conversations_with_openai Method
Generates analysis based on predefined emotional parameters:

Parameters Analyzed:
Job Satisfaction, Stress and Burnout, Engagement and Motivation, Interpersonal Relationships, etc.
Prompt Design: Sends the conversation history to Groq or OpenAI for a comprehensive analysis. Each parameter is briefly analyzed based on historical conversations.
generate_pdf_report Method
Creates a structured PDF report with analysis from the analyze_conversations_with_openai method:

PDF Layout:

Title: User’s emotional history report title.
Table of Contents: Lists sections like Summary and Detailed Analysis.
Summary: Concisely summarizes the key findings.
Detailed Analysis: Breaks down each parameter and its analysis in a structured way.
PDF Content Generation:

Uses FPDF to format each section and add content.
Splits each analysis line by line, grouping by parameter name and analysis text, then formats accordingly.
Returning the PDF as a Downloadable Response:

Saves the generated PDF in memory as a BytesIO object.
Returns it as a FileResponse, allowing users to download the report.
Key Code Snippets and Explanations
1. Handling Audio Conversion and Deletion of Temp Files
Each audio file conversion process uses tempfile to create a temporary file, ensuring files are deleted after use to prevent clutter:

python
Copy code
if temp_audio_path and os.path.exists(temp_audio_path):
    try:
        time.sleep(0.5)  # Allow some time for process to release the file lock
        os.remove(temp_audio_path)
        logger.info(f"Deleted temporary audio file: {temp_audio_path}")
    except Exception as e:
        logger.error(f"Error deleting temp audio file {temp_audio_path}: {e}")
2. Generating the Prompt for Emotional Analysis
The prompt is dynamically constructed based on predefined emotional analysis parameters. It’s crafted to direct the API toward producing brief but insightful responses:

python
Copy code
prompt = f"""
Analyze the following conversation history for the user based on these parameters:
{", ".join(parameters)}.

Conversation History:
{conversation_text}

For each parameter, provide a brief analysis based on the content. The analysis must be concise and to the point. Organize the analysis as follows:
- Parameter Name: Analysis
"""
3. Creating a Downloadable PDF Report
The generate_pdf_report method uses FPDF to structure the report:

Add Sections: Adds each section of the analysis in a structured format, with Title, Table of Contents, Summary, and Detailed Analysis.
Dynamic PDF Content: Formats the analysis results with each parameter’s analysis in a multi-cell format, making the PDF readable and professional.
python
Copy code
pdf.set_font("Arial", "B", 12)
pdf.multi_cell(0, 10, parameter)
pdf.set_font("Arial", "", 12)
pdf.multi_cell(0, 10, analysis.strip())
pdf.ln(5)
Improvements and Customization Options
Adding More Detailed Analysis
Customize the OpenAI prompt to include even more specific guidance, e.g., asking for numerical scores on each parameter if needed.
Further User Personalization
Modify the generate_pdf_report method to include personalized summaries or highlight specific trends across parameters.
Error Handling
Add more robust error handling around file handling and OpenAI calls to ensure the system handles unexpected errors gracefully.
This setup provides a flexible and comprehensive chatbot with support for audio processing, emotion analysis, and emotional history reporting. It enables the creation of a valuable, personalized experience where users can access insights about their interactions and emotions over time in a structured, downloadable format.
