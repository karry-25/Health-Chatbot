import React, {useState} from "react";
import AuthService from "../services/AuthService";
import { useNavigate } from 'react-router-dom'; // Import the useNavigate hook


const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate(); // Initialize the useNavigate hook
    console.log("Login Component Rendered");

    const handleLogin = (e) => {
        e.preventDefault();
    
        AuthService.login(username, password)
            .then(() => {
                navigate('/api/chat'); // Use the useNavigate hook to navigate to the /chat page
            })
            .catch(error => {
                setMessage(error.response.data.message);
                console.error(error);
            });
    };


    return (
        <div>
            <form onSubmit={handleLogin}>
                <h3>Login</h3>
                <div>
                    <label>Username</label>
                    <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required/>
                </div>


                <div>
                    <label>Password</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required/>
                </div>
                <button type="submit">Login</button>


                {message && <p>{message}</p>}
            </form>
        </div>
    );
};


export default Login;