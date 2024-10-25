import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './styles/Login.css'; 

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        const loginData = {
            username: username,
            password: password
        };

        try {
            const response = await fetch('http://127.0.0.1:8000/api/login/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginData)
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('token', data.access);
                navigate('/api/chat');
            } else {
                const data = await response.json();
                setError(data.error || 'Login failed. Please try again.');
            }
        } catch (err) {
            setError('An error occurred. Please try again later.');
        }
    };

    return (
        <div className="login-container">
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
                <h2 className="login-title">Welcome Back!</h2>
                <p className="login-subtitle">Let’s get you logged in.</p>
                {error && <p className="error-message">{error}</p>}
                <form className="login-form" onSubmit={handleLogin}>
                    <input 
                        type="text" 
                        placeholder="Username" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)} 
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
                    <button type="submit" className="login-btn">Login</button>
                </form>
                <p className="signup-prompt">
                    Don’t have an account? <Link to="/api/signup" className="signup-link">Sign up here</Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
