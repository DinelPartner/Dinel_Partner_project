import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  let data: any;
  try {
    data = await request.json();
  } catch {
    return json({ status: 'error', message: 'Invalid payload' }, 400);
  }

  if (!data || !data.name || !data.email || !data.message || !data.token) {
    return json({ status: 'error', message: 'Missing required fields' }, 400);
  }

  const recaptchaSecret = import.meta.env.RECAPTCHA_SECRET_KEY;
  if (!recaptchaSecret) {
    return json({ status: 'error', message: 'Server misconfiguration' }, 500);
  }

  try {
    const verifyResponse = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret: recaptchaSecret, response: data.token }),
    });
    const verifyResult = await verifyResponse.json();
    if (!verifyResult.success) {
      return json({ status: 'error', message: 'reCAPTCHA verification failed' }, 400);
    }
  } catch {
    return json({ status: 'error', message: 'reCAPTCHA verification failed' }, 400);
  }

  const name = String(data.name);
  const email = String(data.email);
  const phone = data.phone ? String(data.phone) : '';
  const message = String(data.message);

  const resendApiKey = import.meta.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return json({ status: 'error', message: 'Failed to send email' }, 500);
  }

  const textBody = `Namn: ${name}\nEmail: ${email}\nTelefon: ${phone}\n\nMeddelande:\n${message}\n`;

  try {
    const sendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Din Elpartner <onboarding@resend.dev>',
        to: ['info@dinelpartner.se'],
        reply_to: email,
        subject: `Ny förfrågan från ${name} (via webbplatsen)`,
        text: textBody,
      }),
    });

    if (!sendResponse.ok) {
      return json({ status: 'error', message: 'Failed to send email' }, 500);
    }

    return json({ status: 'success', message: 'Email sent successfully' }, 200);
  } catch {
    return json({ status: 'error', message: 'Failed to send email' }, 500);
  }
};

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
