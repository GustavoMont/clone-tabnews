import nodemailer from "nodemailer";
import { ServiceError } from "./errors.js";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SMTP_HOST,
  port: process.env.EMAIL_SMTP_PORT,
  auth: {
    user: process.env.EMAIL_SMTP_USER,
    pass: process.env.EMAIL_SMTP_PASSWORD,
  },
  secure: process.env.NODE_ENV === "production",
});

async function send(mailOptions) {
  try {
    await transporter.sendMail(mailOptions);
  } catch (cause) {
    throw new ServiceError({
      message: "Não foi possível enviar o email.",
      action: "Veirifique se o serviço de email está disponível.",
      cause,
      context: mailOptions,
    });
  }
}

const email = {
  send,
};

export default email;
