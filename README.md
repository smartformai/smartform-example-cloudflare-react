# Cloudflare Pages + React contact form — Formspree alternative with AI spam filtering

A contact form for a Cloudflare Pages-hosted React app, posting JSON to SmartForm AI.

## What you're POSTing

The endpoint accepts a standard HTML form POST or JSON via AJAX. Two
kinds of fields:

**Your form fields** — `name`, `email`, `message`, whatever you
want. Every non-reserved field lands in your dashboard as a column in
the submissions table.

**Reserved fields** — names starting with `_` are interpreted by
the API, not stored:

| Field | Purpose |
|---|---|
| ``_gotcha`` | **Honeypot.** Keep it empty. Hidden from humans via CSS; bots fill it automatically. Any non-empty value silently drops the submission. Add this to every form. |
| ``_hp_email`` / ``_website`` / ``_url`` / ``_phone`` | Honeypot aliases for `_gotcha` (WordPress / WPForms / Contact Form 7 migrations). Same drop semantics. |
| ``_next`` | Same-origin URL to redirect to after a successful submission. Browser POST results in a 302 here. AJAX calls (with `Accept: application/json`) get the same value back as `next_url` in the JSON response. Only http(s) and in-site paths allowed. |
| ``_subject`` | Override the AI-generated email subject line. Max 200 chars; control characters stripped. |
| `X-Gotcha` header | Same as `_gotcha` for JSON requests where you can't add a hidden form field. |

Field names are Formspree-compatible — migrating from
`formspree.io/f/{form_id}` requires no renaming.

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


## FAQ

### Why use this instead of Formspree?

At the basic level, SmartForm and Formspree are very similar: get a
form ID, POST a plain HTML form to a hosted endpoint with `_gotcha`
for spam filtering, and the API delivers the submission. The reserved
fields (`_gotcha`, `_next`, `_subject`, honeypot aliases) are
Formspree-compatible — a migration does not require renaming
anything.

The differences are operational, not API surface:

- **No email confirmation flow.** Formspree requires verifying your
  domain before submissions reach your inbox; SmartForm submissions
  land in your dashboard immediately.
- **AI spam filtering on the free tier.** Formspree's free tier uses
  only a honeypot field, which catches naive bots but lets semantic
  spam through. SmartForm applies AI-based classification by default,
  free of charge.
- **AI intent classification** (`sales` / `support` / `inquiry`
  / `spam`) on the Pro tier, for routing submissions without writing
  rules yourself.
- **No per-submission metering** on the basic plan.

### Is there a free tier?

Yes. AI spam filtering is enabled by default on every plan. AI intent
classification and high-value lead detection require a paid plan (Pro
or Business) — the dashboard enforces this and returns HTTP 402 if
you try to enable them on a free workspace.

### Do I need an API key?

No. The form posts directly to a public endpoint using only an 8-char
form ID, which is non-enumerable. The example also includes a hidden
`_gotcha` honeypot field so naive bots cannot submit.

### Do I need a Pages Function?
Not required. The plain HTML form posts directly to the endpoint. An optional Pages Function proxy is included if you want to keep the form ID out of the client bundle.

## Related examples
[Cloudflare Workers proxy](https://github.com/yanghuai123456/smartform-example-serverless-cloudflare) | [Netlify contact form](https://github.com/yanghuai123456/smartform-example-netlify) | [Vite + React contact form](https://github.com/yanghuai123456/smartform-example-vite-react)


## License

MIT.

