import nodemailer from 'nodemailer'
import { config } from '../config/index.js'

let transporter

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.mail.host,
      port: config.mail.port,
      auth: { user: config.mail.user, pass: config.mail.pass },
    })
  }
  return transporter
}

export const sendVerificationEmail = async (to, code) => {
  if (!config.mail.user) {
    console.log(`[MAIL] Código de verificación para ${to}: ${code}`)
    return
  }
  await getTransporter().sendMail({
    from:    config.mail.from,
    to,
    subject: 'Verifica tu cuenta en BildyApp',
    html: `
      <h2>Bienvenido a BildyApp</h2>
      <p>Tu código de verificación es:</p>
      <h1 style="letter-spacing:8px;color:#2563eb">${code}</h1>
      <p>Este código expira en 24 horas.</p>
    `,
  })
}

export const sendInvitationEmail = async (to, { name, tempPassword, companyName }) => {
  if (!config.mail.user) {
    console.log(`[MAIL] Invitación para ${to} — contraseña temporal: ${tempPassword}`)
    return
  }
  await getTransporter().sendMail({
    from:    config.mail.from,
    to,
    subject: `Has sido invitado a ${companyName} en BildyApp`,
    html: `
      <h2>Hola ${name}</h2>
      <p>Has sido invitado a unirte a <strong>${companyName}</strong> en BildyApp.</p>
      <p>Tu contraseña temporal es: <strong>${tempPassword}</strong></p>
      <p>Por favor, cámbiala tras tu primer inicio de sesión.</p>
    `,
  })
}
