import { useState } from 'react';

const FORM_ID  = import.meta.env.VITE_SMARTFORM_FORM_ID as string;
const ENDPOINT = 'https://api.usesmartform.com/api/v1/f';

export function ContactForm() {
  const [status, setStatus] = useState('');
  if (!FORM_ID) return <p>Set <code>VITE_SMARTFORM_FORM_ID</code> in <code>.env</code> first.</p>;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('Sending…');
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const r = await fetch(`${ENDPOINT}/${FORM_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data),
      });
      const body = await r.json();
      setStatus(`Sent! submission_id=${body.submission_id} intent=${body.intent}`);
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
      <input name="name"  placeholder="Name"  required />
      <input name="email" type="email" placeholder="Email" required />
      <textarea name="message" placeholder="Message" required style={{ minHeight: 100 }} />
      <input type="text" name="_gotcha" tabIndex={-1} autoComplete="off"
             style={{ position: 'absolute', left: -9999 }} aria-hidden />
      <button type="submit" style={{ background: '#7c3aed', color: '#fff', border: 0, padding: '8px 10px' }}>Send</button>
      <p>{status}</p>
    </form>
  );
}
