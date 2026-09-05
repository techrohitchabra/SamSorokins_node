// import "server-only";
import nodemailer from "nodemailer";
import ejs from "ejs";
import path from "path";

// Reuse the transporter across invocations to avoid recreating TCP/TLS connections
const transporter = nodemailer.createTransport({
  host: process.env.OUTLOOK_HOST?.trim() || "smtp.office365.com",
  port: Number(process.env.OUTLOOK_PORT?.trim()) || 587,
  secure: false, // Must be false for port 587; triggers STARTTLS
  requireTLS: true, // Mandates STARTTLS for Office 365 security
  auth: {
    user: process.env.OUTLOOK_EMAIL_USER?.trim(), //process.env.GMAIL_EMAIL_USER?.trim(),
    pass: process.env.OUTLOOK_EMAIL_PASS?.trim(), //process.env.GMAIL_APP_PASSWORD?.trim(),
  },
  tls: {
    minVersion: "TLSv1.2",
    rejectUnauthorized: true,
  },
});

const sendMail = async (
  subject,
  payload,
  recipient,
  templateName,
  cc,
  attachments,
  replyTo = "",
  bcc = []
) => {
  try {
    const htmlContent = await ejs.renderFile(
      path.join(process.cwd(), "templates", `${templateName}.ejs`),
      payload
    );

    // Generate plain-text fallback to prevent spam score penalties
    const plainText = htmlContent
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const senderEmail = process.env.OUTLOOK_EMAIL_USER?.trim();

    const mailOptions = {
      // The email address inside <...> MUST match the authenticated sender
      from: `"Premium Properties" <${senderEmail}>`,
      to: recipient,
      subject: subject,
      text: plainText,
      html: htmlContent,
      attachments,
      ...(replyTo ? { replyTo } : {}),
      // Only attach cc and bcc if they contain values (avoids empty array SMTP syntax issues)
      ...(cc && (Array.isArray(cc) ? cc.length > 0 : cc) ? { cc } : {}),
      ...(bcc && (Array.isArray(bcc) ? bcc.length > 0 : bcc) ? { bcc } : {}),
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", result);
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    throw error;
  }
};

export default sendMail;
