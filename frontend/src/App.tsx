import React, { useEffect } from 'react';
import './App.css';
import { Login } from "./components/Login";
import { Register } from './components/Register';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Nav } from './components/Nav';
import { Home } from './components/Home';
import './interceptors/axios';
import { Forgot } from './components/Forgot';
import { Reset } from './components/Reset';
import AudioStreamer from "./components/AudioStreamer";
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { setAuth } from './redux/authSlice';
import PrivateRoute from "./components/PrivateRoute";

function App() {


  return (
    <BrowserRouter>
      <Nav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot" element={<Forgot />} />
        <Route path="/reset/:token" element={<Reset />} />
        <Route
          path="/sub"
          element={
            <PrivateRoute>
              <AudioStreamer />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
