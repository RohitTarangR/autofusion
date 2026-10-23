const nodemailer = require('nodemailer');

let transporter = null;

async function setupTransporter() {
    if (transporter) return transporter;

    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: process.env.SMTP_PORT || 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    } else {
        // Generate test SMTP service account from ethereal.email for zero-config testing
        let testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
        console.log(`[Email Setup] Created Ethereal test account: ${testAccount.user}`);
    }
    return transporter;
}

async function sendOTPByEmail(to, otp, contextMessage) {
    try {
        const mailer = await setupTransporter();
        const info = await mailer.sendMail({
            from: '"AutoFusion" <no-reply@autofusion.com>',
            to: to,
            subject: "Your AutoFusion Verification OTP",
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f8fafc; border-radius: 10px; max-width: 500px; margin: auto;">
                    <h2 style="color: #2563eb;">AutoFusion</h2>
                    <p style="font-size: 16px; color: #333;">${contextMessage}</p>
                    <div style="background-color: #fff; padding: 15px; border: 2px dashed #2563eb; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #1d4ed8; margin-top: 20px;">
                        ${otp}
                    </div>
                    <p style="font-size: 12px; color: #64748b; margin-top: 20px;">Please provide this code to your mechanic or driver for secure handover.</p>
                </div>
            `,
        });

        console.log(`[EMAIL SENT] To: ${to} | MessageId: ${info.messageId}`);
        // Ethereal provides a URL to view the sent email in the browser
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
            console.log(`[EMAIL PREVIEW] Click here to view the sent email: ${previewUrl}`);
        }
        return true;
    } catch (err) {
        console.error('[EMAIL ERROR] Failed to send email:', err.message);
        return false;
    }
}

async function sendWelcomeEmail(to, name) {
    try {
        const mailer = await setupTransporter();
        const info = await mailer.sendMail({
            from: '"AutoFusion" <no-reply@autofusion.com>',
            to: to,
            subject: "Welcome to AutoFusion!",
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f8fafc; border-radius: 10px; max-width: 500px; margin: auto;">
                    <h2 style="color: #2563eb;">Welcome to AutoFusion, ${name || 'Customer'}!</h2>
                    <p style="font-size: 16px; color: #333;">You have successfully registered to AutoFusion.</p>
                    <p style="font-size: 16px; color: #333;">Thank you for joining our platform. We look forward to serving your vehicle needs.</p>
                </div>
            `,
        });

        console.log(`[EMAIL SENT] To: ${to} | MessageId: ${info.messageId}`);
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
            console.log(`[EMAIL PREVIEW] Click here to view the sent email: ${previewUrl}`);
        }
        return true;
    } catch (err) {
        console.error('[EMAIL ERROR] Failed to send welcome email:', err.message);
        return false;
    }
}

async function sendAdminCredentialsEmail(to, name, shopName, username, password) {
    try {
        const mailer = await setupTransporter();
        const info = await mailer.sendMail({
            from: '"AutoFusion" <no-reply@autofusion.com>',
            to: to,
            subject: "Your AutoFusion Admin Portal Credentials",
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f8fafc; border-radius: 10px; max-width: 600px; margin: auto;">
                    <h2 style="color: #2563eb;">Welcome to the AutoFusion Service Network!</h2>
                    <p style="font-size: 16px; color: #333;">Hello ${name || 'Admin'},</p>
                    <p style="font-size: 16px; color: #333;">A Superadmin has created an official Service Provider account for your shop: <strong>${shopName}</strong>.</p>
                    
                    <div style="background-color: #fff; padding: 20px; border: 1px solid #cbd5e1; border-radius: 8px; margin-top: 20px; margin-bottom: 20px;">
                        <h3 style="margin-top: 0; color: #1e293b;">Your Login Credentials</h3>
                        <p style="margin-bottom: 5px; color: #333;"><strong>Admin Portal URL:</strong> <a href="http://localhost:5173/admin/login">http://localhost:5173/admin/login</a></p>
                        <p style="margin-bottom: 5px; color: #333;"><strong>Username:</strong> ${username}</p>
                        <p style="margin-bottom: 5px; color: #333;"><strong>Password:</strong> ${password}</p>
                    </div>
                    
                    <p style="font-size: 14px; color: #ef4444; font-weight: bold;">For security purposes, we strongly recommend changing your password after your first login.</p>
                    <p style="font-size: 14px; color: #64748b; margin-top: 20px;">Thank you for partnering with AutoFusion.</p>
                </div>
            `,
        });

        console.log(`[EMAIL SENT] Admin Credentials To: ${to} | MessageId: ${info.messageId}`);
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
            console.log(`[EMAIL PREVIEW] Click here to view the sent email: ${previewUrl}`);
        }
        return true;
    } catch (err) {
        console.error('[EMAIL ERROR] Failed to send admin credentials email:', err.message);
        return false;
    }
}

async function sendServiceBookingEmail(to, bookingId, shopName, preferredDate, preferredTime) {
    try {
        const mailer = await setupTransporter();
        const info = await mailer.sendMail({
            from: '"AutoFusion" <no-reply@autofusion.com>',
            to: to,
            subject: `AutoFusion - Service Booking Confirmed (ID: ${bookingId})`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
                    <h2 style="color: #2563eb; margin-top: 0;">Service Booking Confirmed!</h2>
                    <p style="font-size: 16px; color: #475569;">Thank you for choosing AutoFusion.</p>
                    <p style="font-size: 16px; color: #475569;">Your service booking has been successfully placed. Here are the details:</p>
                    <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin-bottom: 5px; color: #333;"><strong>Booking ID:</strong> #${bookingId}</p>
                        <p style="margin-bottom: 5px; color: #333;"><strong>Workshop:</strong> ${shopName || 'Assigned AutoFusion Hub'}</p>
                        <p style="margin-bottom: 5px; color: #333;"><strong>Date:</strong> ${preferredDate}</p>
                        <p style="margin-bottom: 5px; color: #333;"><strong>Time:</strong> ${preferredTime}</p>
                    </div>
                    <p style="font-size: 14px; color: #64748b; margin-top: 20px;">We look forward to serving you.</p>
                </div>
            `,
        });

        console.log(`[EMAIL SENT] Booking Confirmation To: ${to} | MessageId: ${info.messageId}`);
        return true;
    } catch (err) {
        console.error('[EMAIL ERROR] Failed to send booking confirmation email:', err.message);
        return false;
    }
}

async function sendTowingRequestEmail(to, requestId, pickupAddress) {
    try {
        const mailer = await setupTransporter();
        const info = await mailer.sendMail({
            from: '"AutoFusion" <no-reply@autofusion.com>',
            to: to,
            subject: `AutoFusion - Towing Request Confirmed (ID: ${requestId})`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
                    <h2 style="color: #dc2626; margin-top: 0;">Towing Request Confirmed!</h2>
                    <p style="font-size: 16px; color: #475569;">Your emergency towing request has been successfully dispatched.</p>
                    <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; border: 1px solid #fecaca; margin: 20px 0;">
                        <p style="margin-bottom: 5px; color: #991b1b;"><strong>Request ID:</strong> #${requestId}</p>
                        <p style="margin-bottom: 5px; color: #991b1b;"><strong>Pickup Location:</strong> ${pickupAddress}</p>
                        <p style="margin-bottom: 5px; color: #991b1b;"><strong>Status:</strong> Dispatched</p>
                    </div>
                    <p style="font-size: 14px; color: #64748b; margin-top: 20px;">A tow truck will be arriving shortly. Stay safe.</p>
                </div>
            `,
        });

        console.log(`[EMAIL SENT] Towing Confirmation To: ${to} | MessageId: ${info.messageId}`);
        return true;
    } catch (err) {
        console.error('[EMAIL ERROR] Failed to send towing confirmation email:', err.message);
        return false;
    }
}

async function sendPaymentLinkEmail(to, bookingId, totalCost, customerName) {
    try {
        const mailer = await setupTransporter();
        const paymentLink = `http://localhost:5173/bookings/${bookingId}`;
        const info = await mailer.sendMail({
            from: '"AutoFusion" <no-reply@autofusion.com>',
            to: to,
            subject: `AutoFusion - Your Vehicle is Ready! (Invoice #${bookingId})`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
                    <h2 style="color: #2563eb; margin-top: 0;">Your Vehicle is Ready for Pickup!</h2>
                    <p style="font-size: 16px; color: #475569;">Hello ${customerName || 'Customer'},</p>
                    <p style="font-size: 16px; color: #475569;">The service on your vehicle is complete and it's ready to be picked up from the workshop.</p>
                    <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
                        <p style="margin-bottom: 5px; color: #333;"><strong>Booking ID:</strong> #${bookingId}</p>
                        <p style="margin-bottom: 5px; color: #333;"><strong>Total Amount Due:</strong> ₹${totalCost}</p>
                    </div>
                    <p style="font-size: 16px; color: #475569;">To speed up the handover process, you can securely pay your invoice online right now:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${paymentLink}" style="background-color: #4f46e5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">Pay Online via Stripe</a>
                    </div>
                    <p style="font-size: 14px; color: #64748b; margin-top: 20px;">Thank you for trusting AutoFusion!</p>
                </div>
            `,
        });

        console.log(`[EMAIL SENT] Payment Link To: ${to} | MessageId: ${info.messageId}`);
        return true;
    } catch (err) {
        console.error('[EMAIL ERROR] Failed to send payment link email:', err.message);
        return false;
    }
}

async function sendPasswordResetEmail(to, resetUrl, name) {
    try {
        const mailer = await setupTransporter();
        const info = await mailer.sendMail({
            from: '"AutoFusion" <no-reply@autofusion.com>',
            to: to,
            subject: "Reset Your AutoFusion Password",
            html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
                    <div style="text-align: center; margin-bottom: 24px;">
                        <h1 style="color: #2563eb; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">AutoFusion</h1>
                        <p style="color: #64748b; font-size: 13px; margin-top: 4px; text-transform: uppercase; font-weight: 600; letter-spacing: 1px;">Automotive Services & Emergency Rescue</p>
                    </div>

                    <div style="background-color: #ffffff; padding: 28px; border-radius: 10px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                        <h2 style="color: #0f172a; margin-top: 0; font-size: 20px; font-weight: 700;">Password Reset Request</h2>
                        <p style="font-size: 15px; color: #334155; line-height: 1.6;">Hello ${name || 'Valued Customer'},</p>
                        <p style="font-size: 15px; color: #334155; line-height: 1.6;">
                            We received a request to reset the password for your AutoFusion account. Click the button below to choose a new password:
                        </p>

                        <div style="text-align: center; margin: 32px 0;">
                            <a href="${resetUrl}" style="background-color: #2563eb; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3);">
                                Reset My Password
                            </a>
                        </div>

                        <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 8px;">
                            If the button doesn't work, copy and paste this link into your browser:
                        </p>
                        <p style="font-size: 12px; color: #2563eb; word-break: break-all; background-color: #f1f5f9; padding: 10px; border-radius: 6px; margin-top: 0;">
                            ${resetUrl}
                        </p>

                        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f1f5f9;">
                            <p style="font-size: 12px; color: #dc2626; margin: 0; font-weight: 600;">
                                ⚠️ This password reset link is valid for 30 minutes only.
                            </p>
                            <p style="font-size: 12px; color: #64748b; margin-top: 6px; margin-bottom: 0;">
                                If you did not request a password reset, you can safely ignore this email. Your current password will remain unchanged.
                            </p>
                        </div>
                    </div>

                    <div style="text-align: center; margin-top: 24px;">
                        <p style="font-size: 12px; color: #94a3b8; margin: 0;">
                            &copy; ${new Date().getFullYear()} AutoFusion Platforms. All rights reserved.
                        </p>
                    </div>
                </div>
            `,
        });

        console.log(`[EMAIL SENT] Password Reset Link To: ${to} | MessageId: ${info.messageId}`);
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
            console.log(`[EMAIL PREVIEW] Password reset email preview: ${previewUrl}`);
        }
        return true;
    } catch (err) {
        console.error('[EMAIL ERROR] Failed to send password reset email:', err.message);
        return false;
    }
}

module.exports = {
    sendOTPByEmail,
    sendWelcomeEmail,
    sendAdminCredentialsEmail,
    sendServiceBookingEmail,
    sendTowingRequestEmail,
    sendPaymentLinkEmail,
    sendPasswordResetEmail
};
