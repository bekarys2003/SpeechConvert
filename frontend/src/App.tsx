import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import './interceptors/axios';

import { Nav } from './components/Nav';
import { Home } from './components/Home';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { Forgot } from './components/Forgot';
import { Reset } from './components/Reset';
import AudioStreamer from './components/AudioStreamer';

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
        <Route path="/sub" element={<AudioStreamer />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
