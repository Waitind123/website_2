import { Resend } from "resend";

const resend =
  process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.length > 10
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

function getFromAddress() {
  return process.env.RESEND_FROM_EMAIL || "Lumina <no-reply@example.com>";
}

export async function sendBillingMail(input: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!resend) {
    return { sent: false, reason: "RESEND_API_KEY not configured" as const };
  }

  try {
    await resend.emails.send({
      from: getFromAddress(),
      to: input.to,
      subject: input.subject,
      html: input.html,
    });
    return { sent: true as const };
  } catch {
    return { sent: false, reason: "send_failed" as const };
  }
}
