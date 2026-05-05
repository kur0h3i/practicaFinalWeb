import request from 'supertest'
import { app } from '../src/app.js'
import { connect, closeDatabase, clearDatabase } from './setup.js'

beforeAll(async () => { await connect() })
afterEach(async () => { await clearDatabase() })
afterAll(async () => { await closeDatabase() })

describe('Auth — POST /api/user/register', () => {
  it('registers a new user and returns accessToken', async () => {
    const res = await request(app)
      .post('/api/user/register')
      .send({ email: 'test@test.com', password: 'Password1!' })

    expect(res.status).toBe(201)
    expect(res.body.accessToken).toBeDefined()
    expect(res.body.refreshToken).toBeDefined()
  })

  it('rejects duplicate email after verification attempt', async () => {
    // Create the user first
    await request(app)
      .post('/api/user/register')
      .send({ email: 'test@test.com', password: 'Password1!' })

    // Try to create again — hits Mongo unique index → 409
    const res = await request(app)
      .post('/api/user/register')
      .send({ email: 'test@test.com', password: 'Password1!' })

    expect(res.status).toBe(409)
    expect(res.body.ok).toBe(false)
  })

  it('rejects invalid email', async () => {
    const res = await request(app)
      .post('/api/user/register')
      .send({ email: 'not-an-email', password: 'Password1!' })
    expect(res.status).toBe(400)
  })

  it('rejects short password', async () => {
    const res = await request(app)
      .post('/api/user/register')
      .send({ email: 'test@test.com', password: '123' })
    expect(res.status).toBe(400)
  })
})

describe('Auth — POST /api/user/login', () => {
  beforeEach(async () => {
    await request(app)
      .post('/api/user/register')
      .send({ email: 'test@test.com', password: 'Password1!' })
  })

  it('logs in with correct credentials', async () => {
    const res = await request(app)
      .post('/api/user/login')
      .send({ email: 'test@test.com', password: 'Password1!' })

    expect(res.status).toBe(200)
    expect(res.body.accessToken).toBeDefined()
  })

  it('rejects wrong password', async () => {
    const res = await request(app)
      .post('/api/user/login')
      .send({ email: 'test@test.com', password: 'WrongPass!' })

    expect(res.status).toBe(401)
  })
})

describe('Auth — GET /api/user (protected)', () => {
  let accessToken

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/user/register')
      .send({ email: 'test@test.com', password: 'Password1!' })
    accessToken = res.body.accessToken
  })

  it('returns current user with valid token', async () => {
    const res = await request(app)
      .get('/api/user')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe('test@test.com')
  })

  it('rejects request without token', async () => {
    const res = await request(app).get('/api/user')
    expect(res.status).toBe(401)
  })
})
