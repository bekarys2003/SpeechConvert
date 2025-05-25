import React, { useState, SyntheticEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import axios from "axios";
import { useDispatch } from "react-redux";
import { GoogleLogin } from "@react-oauth/google";

import { setAuth } from "../redux/authSlice";
import styles from "./Login.module.css";
import "../static/Login.css";

type LoginResponse = {
  token: string;
};

export const Login = () => {
  const dispatch = useDispatch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [redirect, setRedirect] = useState(false);

  const submit = async (e: SyntheticEvent) => {
    e.preventDefault();

    try {
      const { data } = await axios.post<LoginResponse>(
        "login",
        { email, password },
        { withCredentials: true }
      );

      axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
      dispatch(setAuth(true));
      setRedirect(true);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const { data } = await axios.post<LoginResponse>(
        "google-auth",
        { token: credentialResponse.credential },
        { withCredentials: true }
      );

      axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
      dispatch(setAuth(true));
      setRedirect(true);
    } catch (error) {
      console.error("Google login failed:", error);
    }
  };

  const handleGoogleError = () => {
    console.log("Google login failed");
  };

  if (redirect) {
    return <Navigate to="/sub" />;
  }

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={submit}>
        <h1 className="login-title">Sign In</h1>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            className="form-input"
            placeholder="name@example.com"
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            className="form-input"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="forgot-link">
          <Link to="/forgot">Forgot password?</Link>
        </div>

        <button className="submit-button" type="submit">
          Submit
        </button>

        <div className="google-login">
          <GoogleLogin onSuccess={handleGoogleSuccess} onError={handleGoogleError} />
        </div>
      </form>
    </div>
  );
};
