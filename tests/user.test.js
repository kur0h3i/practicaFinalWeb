import request from 'supertest'
import jwt from 'jsonwebtoken'
import { app } from '../src/app.js'
import { User } from '../src/models/User.js'
import { connect, closeDatabase, clearDatabase } from './setup.js'

beforeAll(async () => { await connect() })
afterEach(async () => { await clearDatabase() })
afterAll(async () => { await closeDatabase() })

// Genera un email único por test para evitar colisiones al reutilizar emails
// después de soft-delete (el índice único de MongoDB bloquea re-creación
// si el documento con deleted:true no se eliminó correctamente)
let emailCounter = 0
const uniqueEmail = (prefix = 'user') =>
  `${prefix}-${++emailCounter}@test.com`

const registerUser = async (email) => {
  email = email ?? uniqueEmail()
  const res = await request(app)
    .post('/api/user/register')
    .send({ email, password: 'Password1!' })
  return {
    email,
    accessToken:  res.body.accessToken,
    refreshToken: res.body.refreshToken,
    devCode:      res.body._devCode,
  }
}

const userIdFromToken = (token) => jwt.decode(token).id

// ── Email verification ────────────────────────────────────────────────────────
describe('User — email verification', () => {
  it('verifica el email con el código correcto', async () => {
    const { accessToken, devCode } = await registerUser()

    const res = await request(app)
      .put('/api/user/validation')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ code: devCode })

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  })

  it('rechaza un código incorrecto', async () => {
    const { accessToken } = await registerUser()

    const res = await request(app)
      .put('/api/user/validation')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ code: '000000' })

    expect(res.status).toBe(400)
  })

  it('rechaza formato de código inválido', async () => {
    const { accessToken } = await registerUser()

    const res = await request(app)
      .put('/api/user/validation')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ code: 'abc' })

    expect(res.status).toBe(400)
  })
})

// ── Personal data ─────────────────────────────────────────────────────────────
describe('User — datos personales', () => {
  it('actualiza nombre, apellido y NIF', async () => {
    const { accessToken } = await registerUser()

    const res = await request(app)
      .put('/api/user/register')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Pedro', lastName: 'García', nif: '12345678A' })

    expect(res.status).toBe(200)
    expect(res.body.user.name).toBe('Pedro')
  })

  it('rechaza si falta nombre', async () => {
    const { accessToken } = await registerUser()

    const res = await request(app)
      .put('/api/user/register')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ lastName: 'García', nif: '12345678A' })

    expect(res.status).toBe(400)
  })
})

// ── Company ───────────────────────────────────────────────────────────────────
describe('User — compañía', () => {
  it('crea una compañía (no freelance)', async () => {
    const { accessToken } = await registerUser()

    const res = await request(app)
      .patch('/api/user/company')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        isFreelance: false, cif: 'B99999901', name: 'Mi Empresa S.L.',
        address: { street: 'Calle 1', number: '1', postal: '28001', city: 'Madrid', province: 'Madrid' },
      })

    expect(res.status).toBe(200)
    expect(res.body.user.company).toBeDefined()
    expect(res.body.user.role).toBe('admin')
  })

  it('crea una compañía freelance', async () => {
    const { accessToken } = await registerUser()

    await request(app)
      .put('/api/user/register')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Pedro', lastName: 'García', nif: '12345678B' })

    const res = await request(app)
      .patch('/api/user/company')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ isFreelance: true })

    expect(res.status).toBe(200)
    expect(res.body.user.company).toBeDefined()
  })

  it('se une a una compañía existente como guest', async () => {
    const { accessToken: adminToken } = await registerUser()
    await request(app)
      .patch('/api/user/company')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        isFreelance: false, cif: 'B88888801', name: 'Empresa Compartida',
        address: { street: 'C1', number: '1', postal: '28001', city: 'Madrid', province: 'Madrid' },
      })

    const { accessToken: guestToken } = await registerUser()
    const res = await request(app)
      .patch('/api/user/company')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({
        isFreelance: false, cif: 'B88888801', name: 'Empresa Compartida',
        address: { street: 'C1', number: '1', postal: '28001', city: 'Madrid', province: 'Madrid' },
      })

    expect(res.status).toBe(200)
    expect(res.body.user.role).toBe('guest')
  })
})

// ── Password ──────────────────────────────────────────────────────────────────
describe('User — contraseña', () => {
  it('cambia la contraseña con la actual correcta', async () => {
    const { accessToken } = await registerUser()

    const res = await request(app)
      .put('/api/user/password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ currentPassword: 'Password1!', newPassword: 'NewPassword2!' })

    expect(res.status).toBe(200)
  })

  it('rechaza la contraseña actual incorrecta', async () => {
    const { accessToken } = await registerUser()

    const res = await request(app)
      .put('/api/user/password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ currentPassword: 'WrongPass!', newPassword: 'NewPassword2!' })

    expect(res.status).toBe(400)
  })

  it('rechaza si la nueva es igual a la actual', async () => {
    const { accessToken } = await registerUser()

    const res = await request(app)
      .put('/api/user/password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ currentPassword: 'Password1!', newPassword: 'Password1!' })

    expect(res.status).toBe(400)
  })
})

// ── Refresh token ─────────────────────────────────────────────────────────────
describe('User — refresh token', () => {
  it('emite nuevos tokens con refresh token válido', async () => {
    const { refreshToken } = await registerUser()

    const res = await request(app)
      .post('/api/user/refresh')
      .send({ refreshToken })

    expect(res.status).toBe(200)
    expect(res.body.accessToken).toBeDefined()
  })

  it('rechaza un refresh token inválido', async () => {
    const res = await request(app)
      .post('/api/user/refresh')
      .send({ refreshToken: 'token_invalido' })

    expect(res.status).toBe(401)
  })
})

// ── Delete account ────────────────────────────────────────────────────────────
describe('User — borrar cuenta', () => {
  it('hace soft delete del usuario', async () => {
    const { accessToken } = await registerUser(uniqueEmail('softdel'))

    const res = await request(app)
      .delete('/api/user?soft=true')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  })

  it('hace hard delete del usuario', async () => {
    const { accessToken } = await registerUser(uniqueEmail('harddel'))

    const res = await request(app)
      .delete('/api/user')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  })
})

// ── Invite ────────────────────────────────────────────────────────────────────
describe('User — invitar usuario', () => {
  it('admin invita a un nuevo usuario', async () => {
    const { accessToken } = await registerUser()

    await request(app)
      .put('/api/user/register')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Admin', lastName: 'User', nif: '11111111C' })

    await request(app)
      .patch('/api/user/company')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        isFreelance: false, cif: 'B77777701', name: 'TestCo',
        address: { street: 'C1', number: '1', postal: '28001', city: 'Madrid', province: 'Madrid' },
      })

    const inviteEmail = uniqueEmail('invited')
    const res = await request(app)
      .post('/api/user/invite')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ email: inviteEmail, name: 'Nuevo', lastName: 'Usuario' })

    expect(res.status).toBe(201)
    expect(res.body.user.email).toBe(inviteEmail)
    expect(res.body.user.role).toBe('guest')
  })

  it('rechaza invitación de usuario con rol guest', async () => {
    const { accessToken } = await registerUser()
    const userId = userIdFromToken(accessToken)
    await User.findByIdAndUpdate(userId, { role: 'guest' })

    const res = await request(app)
      .post('/api/user/invite')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ email: uniqueEmail('another'), name: 'Another', lastName: 'User' })

    expect(res.status).toBe(403)
  })
})

// ── Logout ────────────────────────────────────────────────────────────────────
describe('User — logout', () => {
  it('cierra sesión correctamente', async () => {
    const { accessToken } = await registerUser(uniqueEmail('logout'))

    const res = await request(app)
      .post('/api/user/logout')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  })
})

// ── Health ────────────────────────────────────────────────────────────────────
describe('Health — GET /health', () => {
  it('devuelve el estado del servidor', async () => {
    const res = await request(app).get('/health')

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
    expect(res.body.db).toBe('connected')
    expect(typeof res.body.uptime).toBe('number')
  })
})
