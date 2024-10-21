import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { ReactMic } from 'react-mic';
import AuthService from '../services/AuthService';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [token, setToken] = useState('');

  useEffect(() => {
    const currentUser = AuthService.getCurrentUser();
    if (currentUser && currentUser.access) {
      setToken(currentUser.access);
    } else {
      window.location.href = '/login';
    }
  }, []);

  const API_URL = 'http://localhost:8000/api/chat/';

  // Send text message
  const handleTextSubmit = () => {
    if (!input.trim()) return; // Prevent sending empty messages
    const formData = new FormData();
    formData.append('message', input);

    axios.post(API_URL, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`,
      }
    })
      .then(response => {
        setMessages(prevMessages => [...prevMessages, response.data]);
        setInput('');
      })
      .catch(error => {
        console.error("Error in API call:", error);
      });
  };

  // Start recording
  const startRecording = () => {
    setIsRecording(true);
  };

  // Stop recording and send audio
  const stopRecording = () => {
    setIsRecording(false);
  };

  // Handle real-time audio data if needed
  const onData = (recordedBlob) => {
    // Optionally handle the blob data during recording
  };

  // Handle stopping the recording
  const onStop = useCallback((recordedBlob) => {
    if (!recordedBlob || !recordedBlob.blob) {
      console.error("No audio data found.");
      return;
    }

    const formData = new FormData();
    formData.append('audio', recordedBlob.blob);

    axios.post(API_URL, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`,
      }
    })
      .then(response => {
        setMessages(prevMessages => [...prevMessages, response.data]);
      })
      .catch(error => {
        console.error("Error uploading audio:", error);
      });
  }, [token]);

  return (
    <div>
      <h1>Chatbot</h1>
      <div className="chat-window">
        {messages.map((msg, index) => (
          <div key={index}>
            <p><strong>You:</strong> {msg.message}</p>
            <p><strong>Bot:</strong> {msg.response}</p>
          </div>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="Type your message..."
      />
      <button onClick={handleTextSubmit}>Send</button>

      <div>
        <ReactMic
          record={isRecording}
          className="sound-wave"
          onStop={onStop}
          onData={onData}
          strokeColor="#000000"
          backgroundColor="#FF4081"
        />
        <button onMouseDown={startRecording} onMouseUp={stopRecording}>
          Hold to Record
        </button>
      </div>
    </div>
  );
};

export default Chat;
