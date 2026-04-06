import { EventEmitter } from 'node:events'

class NotificationService extends EventEmitter {}
export const notifier = new NotificationService()

notifier.on('user:registered', ({ email, id }) =>
  console.log(`[EVENTO] user:registered — ${id} ${email}`))

notifier.on('user:verified', ({ email, id }) =>
  console.log(`[EVENTO] user:verified — ${id} ${email}`))

notifier.on('user:invited', ({ email, id, invitedBy }) =>
  console.log(`[EVENTO] user:invited — ${id} ${email} por ${invitedBy}`))

notifier.on('user:deleted', ({ id, soft }) =>
  console.log(`[EVENTO] user:deleted — ${id} soft=${soft}`))
