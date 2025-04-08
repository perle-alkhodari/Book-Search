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
