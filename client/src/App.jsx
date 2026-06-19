import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import WaitingRoom from './pages/WaitingRoom';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/waiting-room" element={<WaitingRoom />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
