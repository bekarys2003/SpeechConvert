import React, { SyntheticEvent, useState } from "react"
import axios from 'axios';
import { Link, Navigate } from "react-router-dom";
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import styles from './Login.module.css';
import '../static/Login.css';
import { useDispatch } from "react-redux";
import { setAuth } from "../redux/authSlice";

type LoginResponse = {
    token: string;
};

export const Login = () => {
    const dispatch = useDispatch();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [redirect, setRedirect] = useState(false);

    const submit = async (e: SyntheticEvent) => {
      e.preventDefault();

      const { data } = await axios.post<LoginResponse>('login', {
        email,
        password,
      }, { withCredentials: true });

      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;

      dispatch(setAuth(true));
      setRedirect(true);
    };


    if (redirect){
        return <Navigate to='/sub'/>
    }

    const onSuccess = async (credentialResponse: any) => {
        console.log("Google Login Success:", credentialResponse);

        try {
            const { data } = await axios.post<LoginResponse>('google-auth', {
                token: credentialResponse.credential
            }, { withCredentials: true });

            console.log('Received access token from Django:', data.token);

            axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;

            setRedirect(true);
        } catch (error) {
            console.error('Google login failed:', error);
        }
    }

    const onError = () => {
        console.log('Login Failed');
    }

    return (
        <div className="login-container">
            <form className="login-form" onSubmit={submit}>
                <h1 className="login-title">Sign In</h1>
                <div className="form-group">
                    <label>Email</label>
                    <input type="email" className="form-input" placeholder="name@example.com" onChange={e => setEmail(e.target.value)} />
                </div>
                <div className="form-group">
                    <label>Password</label>
                    <input type="password" className="form-input" placeholder="Password" onChange={e => setPassword(e.target.value)} />
                </div>

                <div className='forgot-link'>
                    <Link to='/forgot'>Forgot password?</Link>
                </div>

                <button className="submit-button" type="submit">Submit</button>
                <div className="google-login">
                    <GoogleLogin onSuccess={onSuccess} onError={onError} />
                </div>
            </form>
        </div>
    )
}
