import { config } from '../config/index.js'

export const notifySlack = async (err, req) => {
  if (!config.slack.webhookUrl) return

  const payload = {
    text: ':rotating_light: *Error 5XX en BildyApp*',
    attachments: [{
      color: 'danger',
      fields: [
        { title: 'Timestamp', value: new Date().toISOString(), short: true },
        { title: 'Método',    value: req?.method || 'N/A',      short: true },
        { title: 'Ruta',      value: req?.originalUrl || 'N/A', short: true },
        { title: 'Mensaje',   value: err.message || 'Sin mensaje', short: false },
        { title: 'Stack',     value: `\`\`\`${(err.stack || '').slice(0, 800)}\`\`\``, short: false },
      ],
    }],
  }

  try {
    await fetch(config.slack.webhookUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    })
  } catch (slackErr) {
    console.error('[SLACK] Error enviando notificación:', slackErr.message)
  }
}
