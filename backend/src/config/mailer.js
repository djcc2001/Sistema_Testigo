const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.office365.com",
  port: 587,
  secure: false, // TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function enviarCorreo({ to, subject, text }) {
  await transporter.sendMail({
    from: `"Sistema de Denuncias" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text
  });
}

module.exports = { enviarCorreo };
