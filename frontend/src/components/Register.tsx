import React, { SyntheticEvent, useState } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";
import "../static/Login.css";

export const Register = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [redirect, setRedirect] = useState(false);

  const submit = async (e: SyntheticEvent) => {
    e.preventDefault();

    await axios.post('register', {
      first_name: firstName,
      last_name: lastName,
      email,
      password,
      password_confirm: passwordConfirm
    });

    setRedirect(true);
  }

  if (redirect) {
    return <Navigate to='/login' />;
  }

  return (
    <main className="login-container">
      <form className="login-form" onSubmit={submit}>
        <h1 className="login-title">Register</h1>

        <div className="form-group">
          <label className="form-label">First Name</label>
          <input className="form-input" placeholder="First Name" onChange={e => setFirstName(e.target.value)} />
        </div>

        <div className="form-group">
          <label className="form-label">Last Name</label>
          <input className="form-input" placeholder="Last Name" onChange={e => setLastName(e.target.value)} />
        </div>

        <div className="form-group">
          <label className="form-label">Email</label>
          <input type="email" className="form-input" placeholder="name@example.com" onChange={e => setEmail(e.target.value)} />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input type="password" className="form-input" placeholder="Password" onChange={e => setPassword(e.target.value)} />
        </div>

        <div className="form-group">
          <label className="form-label">Confirm Password</label>
          <input type="password" className="form-input" placeholder="Confirm Password" onChange={e => setPasswordConfirm(e.target.value)} />
        </div>

        <button className="submit-button" type="submit">Submit</button>
      </form>
    </main>
  );
};
