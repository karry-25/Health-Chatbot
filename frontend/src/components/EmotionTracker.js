import React, { useState } from 'react';
import './styles/EmotionTracker.css'; // Add this file later for custom styles

const EmotionTracker = () => {
    const [emotion, setEmotion] = useState('');
    const [reflection, setReflection] = useState('');
    const [emotionHistory, setEmotionHistory] = useState([]);

    const emotions = ['Happy', 'Sad', 'Angry', 'Anxious', 'Relaxed', 'Excited'];

    const handleEmotionSelect = (selectedEmotion) => {
        setEmotion(selectedEmotion);
        setReflection('');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (emotion && reflection) {
            const newEntry = { emotion, reflection, date: new Date().toLocaleDateString() };
            setEmotionHistory([...emotionHistory, newEntry]);
            setEmotion('');
            setReflection('');
        }
    };

    return (
        <div className="emotion-tracker">
            <h2>Track Your Emotions</h2>
            <div className="emotion-options">
                {emotions.map((emo, index) => (
                    <button 
                        key={index} 
                        className={`emotion-button ${emotion === emo ? 'selected' : ''}`} 
                        onClick={() => handleEmotionSelect(emo)}
                    >
                        {emo}
                    </button>
                ))}
            </div>

            {emotion && (
                <form className="reflection-form" onSubmit={handleSubmit}>
                    <label>
                        Why do you feel {emotion}?
                        <textarea 
                            value={reflection}
                            onChange={(e) => setReflection(e.target.value)}
                            placeholder="Write about your feelings..."
                        />
                    </label>
                    <button type="submit" className="submit-reflection">Save Emotion</button>
                </form>
            )}

            <div className="emotion-history">
                <h3>Your Emotion History</h3>
                {emotionHistory.length > 0 ? (
                    <ul>
                        {emotionHistory.map((entry, index) => (
                            <li key={index}>
                                <strong>{entry.date}</strong>: Felt {entry.emotion} - "{entry.reflection}"
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No emotions logged yet.</p>
                )}
            </div>
        </div>
    );
};

export default EmotionTracker;
