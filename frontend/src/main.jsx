import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { StartupProvider } from './context/StartupContext';
import { NotificationProvider } from './context/NotificationContext';
import App from './App.jsx';
import './styles/index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <StartupProvider>
          <NotificationProvider>
            <App />
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: 'var(--clr-bg-card)',
                  color: 'var(--clr-text-primary)',
                  border: '1px solid var(--clr-border)',
                  borderRadius: '10px',
                  fontSize: '0.875rem',
                },
              }}
            />
          </NotificationProvider>
          </StartupProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
