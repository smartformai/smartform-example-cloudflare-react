import React from 'react';
import ReactDOM from 'react-dom/client';
import { ContactForm } from './ContactForm';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <main style={{ font: '16px/1.4 system-ui', maxWidth: 480, margin: '40px auto' }}>
      <h1>Contact</h1>
      <ContactForm />
    </main>
  </React.StrictMode>,
);
