import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  let data: any;
  try {
    data = await request.json();
  } catch {
    return json({ status: 'error', message: 'Invalid payload' }, 400);
  }

  if (!data) {
    return json({ status: 'error', message: 'Invalid payload' }, 400);
  }

  const isHomeowner = String(data.isHomeowner ?? '').trim();
  const location = String(data.location ?? '').trim();
  const name = String(data.name ?? '').trim();
  const phone = String(data.phone ?? '').trim();
  const email = String(data.email ?? '').trim();
  const message = String(data.message ?? '').trim();

  if (!isHomeowner || !location || !name || (!phone && !email)) {
    return json({ status: 'error', message: 'Saknade obligatoriska fält' }, 400);
  }

  const resendApiKey = import.meta.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return json({ status: 'error', message: 'Kunde inte skicka mailet' }, 500);
  }

  const dateStamp = new Date().toISOString().replace('T', ' ').slice(0, 19);

  let textBody = 'Ny offertförfrågan mottagen:\n\n';
  textBody += `Datum: ${dateStamp}\n`;
  textBody += '----------------------------------\n';
  textBody += `Är bostadsägare: ${isHomeowner}\n`;
  textBody += `Ort/Stadsdel: ${location}\n\n`;
  textBody += `Namn: ${name}\n`;
  textBody += `Telefon: ${phone}\n`;
  textBody += `E-post: ${email}\n\n`;
  textBody += `Meddelande:\n${message}\n`;
  textBody += '----------------------------------\n';
  textBody += 'Källa: /begar-offert-el-installation\n';

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
        ...(email ? { reply_to: email } : {}),
        subject: `Ny förfrågan från ${name} (/offert)`,
        text: textBody,
      }),
    });

    if (!sendResponse.ok) {
      return json({ status: 'error', message: 'Kunde inte skicka mailet' }, 500);
    }

    return json({ status: 'success', message: 'Offertförfrågan skickad' }, 200);
  } catch {
    return json({ status: 'error', message: 'Kunde inte skicka mailet' }, 500);
  }
};

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
