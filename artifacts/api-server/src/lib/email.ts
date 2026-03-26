import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

async function getTransport() {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  const testAccount = await nodemailer.createTestAccount();
  const transport = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
  return transport;
}

export async function sendEmail(opts: EmailOptions) {
  const transport = await getTransport();
  const fromName = process.env.SMTP_FROM_NAME || "NexusLink";
  const fromEmail = process.env.SMTP_FROM_EMAIL || "noreply@nexuslink.app";

  const info = await transport.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`\n📧 EMAIL PREVIEW (dev mode): ${previewUrl}\n`);
  }
  return info;
}

export function buildPasswordResetEmail(opts: { userName: string; resetUrl: string }): string {
  const { userName, resetUrl } = opts;
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset Your Password — NexusLink</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background-color: #0A0A0F;
      font-family: 'Inter', Arial, sans-serif;
      color: #E2E8F0;
      -webkit-font-smoothing: antialiased;
    }
  </style>
</head>
<body style="background-color:#0A0A0F; margin:0; padding:0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0A0A0F; padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;" cellpadding="0" cellspacing="0">

          <!-- Header / Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background: linear-gradient(135deg, #6C63FF, #A78BFA); border-radius:14px; width:48px; height:48px; text-align:center; vertical-align:middle; font-size:22px; line-height:48px;">
                    ✦
                  </td>
                  <td style="padding-left:12px; font-size:22px; font-weight:700; color:#FFFFFF; letter-spacing:-0.5px; vertical-align:middle;">
                    NexusLink
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:linear-gradient(145deg,#13131F,#1A1A2E); border:1px solid rgba(108,99,255,0.25); border-radius:24px; overflow:hidden;">

              <!-- Top accent bar -->
              <tr>
                <td style="height:4px; background:linear-gradient(90deg,#6C63FF,#A78BFA,#EC4899); line-height:0; font-size:0;">&nbsp;</td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:48px 40px 40px;">

                  <!-- Lock icon circle -->
                  <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                    <tr>
                      <td style="background:rgba(108,99,255,0.12); border:1px solid rgba(108,99,255,0.3); border-radius:50%; width:64px; height:64px; text-align:center; vertical-align:middle; font-size:28px; line-height:64px;">
                        🔐
                      </td>
                    </tr>
                  </table>

                  <h1 style="font-size:26px; font-weight:700; color:#FFFFFF; margin-bottom:10px; line-height:1.3; letter-spacing:-0.5px;">
                    Reset your password
                  </h1>
                  <p style="font-size:16px; color:#94A3B8; margin-bottom:28px; line-height:1.6;">
                    Hey ${userName.split(" ")[0]}, we received a request to reset the password for your NexusLink account. Click the button below to choose a new password.
                  </p>

                  <!-- CTA Button -->
                  <table cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                    <tr>
                      <td style="border-radius:12px; background:linear-gradient(135deg,#6C63FF,#A78BFA); box-shadow:0 8px 24px rgba(108,99,255,0.35);">
                        <a href="${resetUrl}"
                           style="display:inline-block; padding:15px 36px; font-size:16px; font-weight:600; color:#FFFFFF; text-decoration:none; border-radius:12px; letter-spacing:0.2px;">
                          Reset Password →
                        </a>
                      </td>
                    </tr>
                  </table>

                  <!-- Divider -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                    <tr>
                      <td style="height:1px; background:rgba(255,255,255,0.07); font-size:0; line-height:0;">&nbsp;</td>
                    </tr>
                  </table>

                  <!-- Security note -->
                  <table cellpadding="0" cellspacing="0" style="background:rgba(108,99,255,0.08); border:1px solid rgba(108,99,255,0.2); border-radius:12px; padding:16px 18px; margin-bottom:24px; width:100%;">
                    <tr>
                      <td style="font-size:13px; color:#94A3B8; line-height:1.6;">
                        <strong style="color:#A78BFA;">⏱ This link expires in 1 hour.</strong><br />
                        If you didn't request a password reset, you can safely ignore this email — your account is secure and no changes will be made.
                      </td>
                    </tr>
                  </table>

                  <!-- Fallback link -->
                  <p style="font-size:13px; color:#64748B; line-height:1.6; word-break:break-all;">
                    If the button doesn't work, copy and paste this link into your browser:<br />
                    <a href="${resetUrl}" style="color:#6C63FF; text-decoration:underline;">${resetUrl}</a>
                  </p>

                </td>
              </tr>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 0 8px; text-align:center;">
              <p style="font-size:13px; color:#475569; line-height:1.6;">
                © ${new Date().getFullYear()} NexusLink · Your Second Brain for Every Relationship<br />
                <a href="#" style="color:#6C63FF; text-decoration:none;">Unsubscribe</a> · 
                <a href="#" style="color:#6C63FF; text-decoration:none;">Privacy Policy</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function buildWelcomeEmail(opts: { userName: string; loginUrl: string }): string {
  const { userName, loginUrl } = opts;
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to NexusLink</title>
</head>
<body style="background-color:#0A0A0F; margin:0; padding:0; font-family:Arial,sans-serif; color:#E2E8F0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0A0A0F; padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;" cellpadding="0" cellspacing="0">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#6C63FF,#A78BFA); border-radius:14px; width:48px; height:48px; text-align:center; line-height:48px; font-size:22px; vertical-align:middle;">
                    ✦
                  </td>
                  <td style="padding-left:12px; font-size:22px; font-weight:700; color:#FFFFFF; letter-spacing:-0.5px; vertical-align:middle;">
                    NexusLink
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:linear-gradient(145deg,#13131F,#1A1A2E); border:1px solid rgba(108,99,255,0.25); border-radius:24px; overflow:hidden;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="height:4px; background:linear-gradient(90deg,#6C63FF,#A78BFA,#EC4899); font-size:0; line-height:0;">&nbsp;</td>
                </tr>
                <tr>
                  <td style="padding:48px 40px 40px;">

                    <div style="font-size:40px; margin-bottom:20px;">🎉</div>
                    <h1 style="font-size:26px; font-weight:700; color:#FFFFFF; margin-bottom:10px; letter-spacing:-0.5px; line-height:1.3;">
                      Welcome to NexusLink, ${userName.split(" ")[0]}!
                    </h1>
                    <p style="font-size:16px; color:#94A3B8; margin-bottom:28px; line-height:1.7;">
                      Your second brain for every relationship is ready. Start building your contact network, logging interactions, and letting AI do the heavy lifting.
                    </p>

                    <!-- Features -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                      <tr>
                        <td style="padding:12px 16px; background:rgba(108,99,255,0.07); border:1px solid rgba(108,99,255,0.15); border-radius:10px; margin-bottom:8px; font-size:14px; color:#CBD5E1;">
                          ✦ &nbsp;<strong style="color:#A78BFA;">Smart Contacts</strong> — Store everything about everyone you know
                        </td>
                      </tr>
                      <tr><td style="height:8px;"></td></tr>
                      <tr>
                        <td style="padding:12px 16px; background:rgba(108,99,255,0.07); border:1px solid rgba(108,99,255,0.15); border-radius:10px; font-size:14px; color:#CBD5E1;">
                          ✦ &nbsp;<strong style="color:#A78BFA;">AI Memory Assistant</strong> — Get briefings, draft emails, chat about your network
                        </td>
                      </tr>
                      <tr><td style="height:8px;"></td></tr>
                      <tr>
                        <td style="padding:12px 16px; background:rgba(108,99,255,0.07); border:1px solid rgba(108,99,255,0.15); border-radius:10px; font-size:14px; color:#CBD5E1;">
                          ✦ &nbsp;<strong style="color:#A78BFA;">Timeline & Tasks</strong> — Never lose track of follow-ups
                        </td>
                      </tr>
                    </table>

                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="border-radius:12px; background:linear-gradient(135deg,#6C63FF,#A78BFA); box-shadow:0 8px 24px rgba(108,99,255,0.35);">
                          <a href="${loginUrl}" style="display:inline-block; padding:15px 36px; font-size:16px; font-weight:600; color:#FFFFFF; text-decoration:none; border-radius:12px;">
                            Go to Dashboard →
                          </a>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 0 8px; text-align:center;">
              <p style="font-size:13px; color:#475569; line-height:1.6;">
                © ${new Date().getFullYear()} NexusLink · Your Second Brain for Every Relationship<br />
                <a href="#" style="color:#6C63FF; text-decoration:none;">Unsubscribe</a> ·
                <a href="#" style="color:#6C63FF; text-decoration:none;">Privacy Policy</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
