const nodemailer = require('nodemailer');

// ─── Transporter ─────────────────────────────────────────────────────────────
// Uses Gmail SMTP. Set EMAIL_USER and EMAIL_PASS (Gmail App Password) in your env config.
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
};

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;

// ─── Email: Admin notified when new advocate registers ───────────────────────
const sendAdminNewAdvocateAlert = async (advocate) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log('[Mailer] EMAIL_USER/EMAIL_PASS not set — skipping admin alert email.');
        return;
    }
    try {
        const transporter = createTransporter();
        await transporter.sendMail({
            from: `"Justexa Platform" <${process.env.EMAIL_USER}>`,
            to: ADMIN_EMAIL,
            subject: '🔔 New Advocate Registration — Pending Approval',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden;">
                    <div style="background: #000; color: #fff; padding: 24px 32px;">
                        <h1 style="margin: 0; font-size: 22px;">⚖️ Justexa Admin Portal</h1>
                        <p style="margin: 8px 0 0; opacity: 0.7; font-size: 14px;">New Advocate Registration Request</p>
                    </div>
                    <div style="padding: 32px;">
                        <p style="font-size: 15px; color: #333;">A new advocate has registered and is awaiting your approval:</p>
                        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                            <tr style="border-bottom: 1px solid #eee;"><td style="padding: 10px; font-weight: bold; color: #555; width: 40%;">Name</td><td style="padding: 10px; color: #111;">${advocate.name}</td></tr>
                            <tr style="border-bottom: 1px solid #eee;"><td style="padding: 10px; font-weight: bold; color: #555;">Email</td><td style="padding: 10px; color: #111;">${advocate.email}</td></tr>
                            <tr style="border-bottom: 1px solid #eee;"><td style="padding: 10px; font-weight: bold; color: #555;">Bar Council ID</td><td style="padding: 10px; color: #111;">${advocate.bar_council_id}</td></tr>
                            <tr style="border-bottom: 1px solid #eee;"><td style="padding: 10px; font-weight: bold; color: #555;">Specialization</td><td style="padding: 10px; color: #111;">${advocate.specialization}</td></tr>
                            <tr style="border-bottom: 1px solid #eee;"><td style="padding: 10px; font-weight: bold; color: #555;">City</td><td style="padding: 10px; color: #111;">${advocate.city || '—'}</td></tr>
                            <tr><td style="padding: 10px; font-weight: bold; color: #555;">Experience</td><td style="padding: 10px; color: #111;">${advocate.experience || 0} years</td></tr>
                        </table>
                        <a href="http://localhost:3000/admin" style="display: inline-block; background: #000; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 14px;">
                            🔐 Open Admin Panel
                        </a>
                        <p style="margin-top: 24px; font-size: 12px; color: #999;">This is an automated message from Justexa Platform.</p>
                    </div>
                </div>
            `,
        });
        console.log(`[Mailer] Admin alert sent for advocate: ${advocate.email}`);
    } catch (err) {
        console.error('[Mailer] Failed to send admin alert:', err.message);
    }
};

// ─── Email: Advocate notified when approved ───────────────────────────────────
const sendAdvocateApprovalEmail = async (advocate) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log('[Mailer] EMAIL_USER/EMAIL_PASS not set — skipping approval email.');
        return;
    }
    try {
        const transporter = createTransporter();
        await transporter.sendMail({
            from: `"Justexa Platform" <${process.env.EMAIL_USER}>`,
            to: advocate.email,
            subject: '✅ Your Advocate Registration Has Been Approved — Justexa',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden;">
                    <div style="background: #000; color: #fff; padding: 24px 32px;">
                        <h1 style="margin: 0; font-size: 22px;">⚖️ Justexa</h1>
                        <p style="margin: 8px 0 0; opacity: 0.7; font-size: 14px;">Registration Approved</p>
                    </div>
                    <div style="padding: 32px;">
                        <h2 style="color: #111; margin-top: 0;">Congratulations, ${advocate.name}! 🎉</h2>
                        <p style="font-size: 15px; color: #555; line-height: 1.6;">
                            Your advocate registration on <strong>Justexa</strong> has been <strong style="color: #000;">approved by the admin</strong>.
                            You can now log in to your account and start using the platform.
                        </p>
                        <div style="background: #f5f5f5; border-radius: 6px; padding: 16px; margin: 20px 0;">
                            <p style="margin: 0; font-size: 14px; color: #555;"><strong>Registered Email:</strong> ${advocate.email}</p>
                        </div>
                        <a href="http://localhost:3000/advocate/login" style="display: inline-block; background: #000; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 14px;">
                            🔑 Login to Justexa
                        </a>
                        <p style="margin-top: 24px; font-size: 12px; color: #999;">This is an automated message from Justexa Platform.</p>
                    </div>
                </div>
            `,
        });
        console.log(`[Mailer] Approval email sent to: ${advocate.email}`);
    } catch (err) {
        console.error('[Mailer] Failed to send approval email:', err.message);
    }
};

// ─── Email: Advocate notified when rejected ───────────────────────────────────
const sendAdvocateRejectionEmail = async (advocate) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log('[Mailer] EMAIL_USER/EMAIL_PASS not set — skipping rejection email.');
        return;
    }
    try {
        const transporter = createTransporter();
        await transporter.sendMail({
            from: `"Justexa Platform" <${process.env.EMAIL_USER}>`,
            to: advocate.email,
            subject: '❌ Update on Your Justexa Advocate Registration',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden;">
                    <div style="background: #000; color: #fff; padding: 24px 32px;">
                        <h1 style="margin: 0; font-size: 22px;">⚖️ Justexa</h1>
                        <p style="margin: 8px 0 0; opacity: 0.7; font-size: 14px;">Registration Status Update</p>
                    </div>
                    <div style="padding: 32px;">
                        <h2 style="color: #111; margin-top: 0;">Dear ${advocate.name},</h2>
                        <p style="font-size: 15px; color: #555; line-height: 1.6;">
                            After careful review, your advocate registration on <strong>Justexa</strong> could not be approved at this time.
                        </p>
                        <p style="font-size: 15px; color: #555; line-height: 1.6;">
                            If you believe this decision was made in error, or if you have additional information to provide, please contact our support team.
                        </p>
                        <p style="margin-top: 24px; font-size: 12px; color: #999;">This is an automated message from Justexa Platform.</p>
                    </div>
                </div>
            `,
        });
        console.log(`[Mailer] Rejection email sent to: ${advocate.email}`);
    } catch (err) {
        console.error('[Mailer] Failed to send rejection email:', err.message);
    }
};

module.exports = { sendAdminNewAdvocateAlert, sendAdvocateApprovalEmail, sendAdvocateRejectionEmail };
