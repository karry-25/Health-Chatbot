import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaMicrophone, FaPaperPlane } from 'react-icons/fa';
import './styles/Chat.css';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [token, setToken] = useState('');
  const [isAudioChatActive, setIsAudioChatActive] = useState(false);
  const [recordingIndicator, setRecordingIndicator] = useState(false);
  const audioChunks = useRef([]);
  const mediaRecorderRef = useRef(null);
  const API_URL = 'http://localhost:8000/api/chat/';
  const REPORT_URL = 'http://localhost:8000/api/emotional_history/';

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      window.location.href = '/api/login';
      return;
    }
    setToken(storedToken);
  }, []);

  const toggleAudioChat = (e) => {
    if (e.target.checked) {
      startRecording();
      setIsAudioChatActive(true);
    } else {
      stopRecording();
      setIsAudioChatActive(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (e) => audioChunks.current.push(e.data);
      mediaRecorderRef.current.onstop = processAudioRecording;
      mediaRecorderRef.current.start();
      setRecordingIndicator(true);
    } catch (error) {
      console.error('Error with microphone:', error);
      alert('Microphone access denied. Please check your permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecordingIndicator(false);
    }
  };

  const processAudioRecording = async () => {
    const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
    audioChunks.current = []; // Clear audio chunks after processing
    await submitAudioMessage(audioBlob);
  };

  const submitAudioMessage = async (audioBlob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob);

    try {
      const response = await axios.post(API_URL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
          Accept: '*/*',  // Indicate we expect audio back
        },
        responseType: 'blob',  // Important for handling audio data
      });
      
      // Add message to UI
      setMessages((prevMessages) => [
        ...prevMessages,
        { message: 'Audio message sent', response: "Bot is processing audio response..." },
      ]);

      // Play the audio response from the backend
      playAudioResponse(response.data);

    } catch (error) {
      if (error.response?.status === 401) {
        alert('Unauthorized. Please log in.');
        window.location.href = '/api/login';
      } else {
        console.error('API Error:', error);
      }
    }
  };
  
  const playAudioResponse = (audioBlob) => {
    if (audioBlob) {
      if (!audioBlob || audioBlob.size === 0) {
        console.error("No audio data received from backend or the audioBlob is empty.");
        return;
      }
      // Create a URL for the blob data
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      // Error handling if audio fails to play
      audio.onerror = () => {
        console.error('Failed to play audio. Check the format and data.');
        alert('Failed to play the audio response.');
      };

      audio.play()
        .then(() => console.log('Audio playing successfully'))
        .catch(error => console.error('Audio play error:', error));

      // Cleanup the URL object after playback
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
      };
    } else {
      console.error('No audio data received from backend.');
    }
  };

  const submitTextMessage = async (message) => {
    if (!message.trim()) return;
    const formData = new FormData();
    formData.append('message', message);

    try {
      const response = await axios.post(API_URL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Add message to UI
      setMessages((prevMessages) => [
        ...prevMessages,
        { message, response: response.data.response },
      ]);
      
      setInput('');
      
      // Play audio if response contains audio data
      if (response.data.audioResponse) {
        playAudioResponse(response.data.audioResponse);
      }

    } catch (error) {
      if (error.response?.status === 401) {
        alert('Unauthorized. Please log in.');
        window.location.href = '/api/login';
      } else {
        console.error('API Error:', error);
      }
    }
  };

  // Function to download the emotional history report as a PDF
  const downloadEmotionalHistoryReport = async () => {
    try {
      const response = await axios.get(REPORT_URL, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',  // Important for handling PDF response
      });

      // Create a URL for the Blob data and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'emotional_history_report.pdf');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Failed to download report:", error);
    }
  };

  return (
    <div className="chat-container">
      <h1 className="chat-title">Chatbot</h1>
      <div className="chat-window">
        {messages.map((msg, index) => (
          <div key={index} className="message">
            <p className="user-message">
              <strong>You:</strong> {msg.message}
            </p>
            <p className="bot-message">
              <strong>Bot:</strong> {msg.response}
            </p>
          </div>
        ))}
      </div>
      
      <div className="chat-input">
        {isAudioChatActive ? (
          <div className="recording-indicator">
            <p>Recording...</p>
            <div className="indicator" />
          </div>
        ) : (
          <div className="input-group">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message here..."
              className="text-input"
            />
            <button onClick={() => submitTextMessage(input)} disabled={isAudioChatActive} className="send-button">
              <FaPaperPlane />
            </button>
          </div>
        )}
        <label className="switch">
          <input type="checkbox" onChange={toggleAudioChat} />
          <span className="slider" />
        </label>
        <span className="toggle-label">{isAudioChatActive ? 'Stop Audio Chat' : 'Start Audio Chat'}</span>
      </div>

      {/* Button to download emotional history report */}
      <div className="report-button">
        <button onClick={downloadEmotionalHistoryReport}>
          Download Emotional History Report
        </button>
      </div>
    </div>
  );
};

export default Chat;
