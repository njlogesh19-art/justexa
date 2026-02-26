import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID || "834570037310-v7mkgea50s4i5jlg8bhi2bt97utgkpmc.apps.googleusercontent.com"}>
            <App />
        </GoogleOAuthProvider>
    </React.StrictMode>
);
