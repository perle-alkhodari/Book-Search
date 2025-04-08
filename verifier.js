import nodeMailer from "nodemailer";
import env from "dotenv";

env.config();

var emailer = nodeMailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: false,
        service: 'Gmail',
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.APP_PASS,
        }
    });

function sendVerificationEmail(userEmail, verificationCode) {
    emailer.sendMail({
        from: process.env.SMTP_EMAIL,
        to: userEmail,
        subject: "Kotob Account Verification Code",
        text: `Enter this code to verify your account:\n\n${verificationCode}`
    })
}
