const twilio = require("twilio");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function enviarSMS({ to, message }) {
  console.log("📤 Enviando SMS a:", to); // DEBUG

  return client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER, // 🔥 OBLIGATORIO
    to: to
  });
}

module.exports = { enviarSMS };
