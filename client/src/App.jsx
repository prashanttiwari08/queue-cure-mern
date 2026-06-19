import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import WaitingRoom from './pages/WaitingRoom';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#1e293b',
            borderRadius: '14px',
            padding: '14px 18px',
            fontSize: '14px',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontWeight: '500',
            border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
          },
          success: {
            iconTheme: { primary: '#14B8A6', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
          },
        }}
      />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/waiting-room" element={<WaitingRoom />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
