// functions/api/submit.ts — Cloudflare Pages Function. Forwards to SmartForm.
export const onRequestPost: PagesFunction = async ({ request, env }) => {
  const body = await request.json();
  const r = await fetch(`${env.SMARTFORM_ENDPOINT}/api/v1/f/${env.SMARTFORM_FORM_ID}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return new Response(await r.text(), {
    status: r.status,
    headers: { 'Content-Type': 'application/json' },
  });
};
