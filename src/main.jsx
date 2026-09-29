import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { SoundProvider } from './context/SoundContext.jsx';
import { SettingsProvider } from './context/SettingsContext.jsx';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SettingsProvider>
      <SoundProvider>
        <App />
      </SoundProvider>
    </SettingsProvider>
  </React.StrictMode>
);
