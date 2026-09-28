# Cloudflare Pages + React contact form — Formspree alternative with AI spam filtering

A contact form for a Cloudflare Pages-hosted React app, posting JSON to SmartForm AI.

## Setup

1. Get a form ID at https://usesmartform.com/dashboard.
2. Clone, install, configure, run:
   ```bash
   git clone https://github.com/yanghuai123456/smartform-example-cloudflare-react.git
   cd smartform-example-cloudflare-react
   npm install
   cp .env.example .env
   # edit .env → VITE_SMARTFORM_FORM_ID=f_your_real_id
   npm run dev
   ```
3. Open http://localhost:5173, submit, check your dashboard.

## The form

`src/ContactForm.tsx` is identical to the Vite + React version — it's the same Vite app
configured with React. The only thing Cloudflare-specific here is the build target: Pages
runs the built `./dist` as static assets + Pages Functions.

```tsx
import { useState } from 'react';
const FORM_ID  = import.meta.env.VITE_SMARTFORM_FORM_ID;
const ENDPOINT = 'https://api.usesmartform.com/api/v1/f';

export function ContactForm() {
  const [status, setStatus] = useState('');
  if (!FORM_ID) return <p>Set VITE_SMARTFORM_FORM_ID in .env first.</p>;

  async function onSubmit(e) {
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
    } catch (err) { setStatus(`Error: ${err.message}`); }
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
```

## Optional: Pages Function proxy

`functions/api/submit.ts` is a minimal Cloudflare Pages Function that forwards browser
submissions. Use it to keep the form ID out of the public bundle.

```ts
export const onRequestPost: PagesFunction = async ({ request, env }) => {
  const body = await request.json();
  const r = await fetch(`${env.SMARTFORM_ENDPOINT}/api/v1/f/${env.SMARTFORM_FORM_ID}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  return new Response(await r.text(), { status: r.status, headers: { 'Content-Type': 'application/json' } });
};
```

Then the browser would call `POST /api/submit` instead of the SmartForm endpoint directly.

## How the API works

- `POST {endpoint}/api/v1/f/{form_id}` — JSON or form-data, no API key.
- Response: `{ success, message, submission_id, is_spam, intent, next_url }`.

For the full contract, see https://usesmartform.com/docs.

## Deploy

```bash
npm run build                               # static output in ./dist
npx wrangler pages deploy ./dist --project-name=smartform-react
```

Set `VITE_SMARTFORM_FORM_ID` (and optional `SMARTFORM_ENDPOINT` / `SMARTFORM_FORM_ID`
for the Pages Function) in the Cloudflare dashboard's environment variables.

## License

MIT.
