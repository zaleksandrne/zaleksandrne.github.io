import React from 'react';
import ReactDOM from 'react-dom/client';
import { Routes, Route } from 'react-router-dom';
import App from './App';
import './index.css';

import { HashRouter } from 'react-router-dom';
import { WebRTCApp } from './components/WebRTCApp';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <HashRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/room/default-room" element={<WebRTCApp />} />
    </Routes>
  </HashRouter>,
);
