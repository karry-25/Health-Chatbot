import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';  // Import useNavigate
import './styles/Signup.css';

const SignupPage = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);

    // Initialize the useNavigate hook
    const navigate = useNavigate();

    // Form submit handler
    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent default form submission behavior

        try {
            // Making POST request to Django API
            const response = await fetch('http://127.0.0.1:8000/api/signup/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    email: email,
                    password: password
                }),
            });

            if (response.ok) {
                // Redirect to login page upon successful signup
                console.log('Signup successful! Redirecting to login...');
                navigate('/api/login');  // Use absolute path to redirect to the login page
            } else {
                // Handle errors (e.g., display error message)
                const data = await response.json();
                setError(data.error || 'Signup failed. Please try again.');
            }
        } catch (err) {
            console.error('Error:', err);
            setError('Something went wrong. Please try again.');
        }
    };

    return (
        <div className="signup-container">
            <div className="header">
                <div className="logo">
                    <img 
                        src={`${process.env.PUBLIC_URL}/logo.png`} 
                        alt="Emotisense Logo" 
                        className="logo-img"
                    />
                    <span className="logo-text">Emotisense 41</span>
                </div>
            </div>

            <div className="container">
                <h2 className="signup-title">Create Your Account</h2>
                <p className="signup-subtitle">Join us and explore your emotions!</p>
                <form className="signup-form" onSubmit={handleSubmit}>
                    <input 
                        type="text" 
                        placeholder="Username" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required 
                        className="input-field" 
                    />
                    <input 
                        type="email" 
                        placeholder="Email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required 
                        className="input-field" 
                    />
                    <input 
                        type="password" 
                        placeholder="Password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required 
                        className="input-field" 
                    />
                    <button type="submit" className="signup-btn">Sign Up</button>
                </form>
                {error && <p className="error-message">{error}</p>}
                <p className="login-prompt">
                    Already have an account? <Link to="/login" className="login-link">Login</Link> {/* Absolute path */}
                </p>
            </div>
        </div>
    );
};

export default SignupPage;
