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

function generateCode() {
    var code = "";
    for (var i = 0; i < 4; i++) code += String(Math.floor(Math.random() * 9));
    return code;
}

function sendVerificationEmail(userEmail) {
    var verificationCode = generateCode();

    emailer.sendMail({
        from: process.env.SMTP_EMAIL,
        to: userEmail,
        subject: "Kotob Account Verification Code",
        text: `Enter this code to verify your account:\n\n${verificationCode}`
    })

    return verificationCode;
}
