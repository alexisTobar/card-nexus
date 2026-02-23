import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile'; // Importamos el nuevo componente
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* La página principal (Home) */}
        <Route path="/" element={<App />} />
        
        {/* Tu panel privado para gestionar cartas */}
        <Route path="/dashboard/:uid" element={<Dashboard />} />

        {/* La página pública que verá la gente */}
        <Route path="/perfil/:uid" element={<Profile />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);