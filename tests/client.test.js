import request from 'supertest'
import { app } from '../src/app.js'
import { User } from '../src/models/User.js'
import { Company } from '../src/models/Company.js'
import { connect, closeDatabase, clearDatabase } from './setup.js'

beforeAll(async () => { await connect() })
afterEach(async () => { await clearDatabase() })
afterAll(async () => { await closeDatabase() })

let emailCounter = 0
const uniqueEmail = () => `client-admin-${++emailCounter}@test.com`

const registerAndSetupUser = async () => {
  const email = uniqueEmail()
  const regRes = await request(app)
    .post('/api/user/register')
    .send({ email, password: 'Password1!' })

  const accessToken = regRes.body.accessToken
  const user = await User.findOne({ email })
  const userId = user._id

  const company = await Company.create({ owner: userId, name: 'TestCo', cif: 'B00000001' })
  await User.findByIdAndUpdate(userId, { company: company._id })

  return { accessToken, userId, companyId: company._id }
}

describe('Clients — POST /api/client', () => {
  it('creates a client', async () => {
    const { accessToken } = await registerAndSetupUser()

    const res = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Client A', cif: 'B11111111' })

    expect(res.status).toBe(201)
    expect(res.body.ok).toBe(true)
    expect(res.body.client.name).toBe('Client A')
  })

  it('rejects duplicate CIF', async () => {
    const { accessToken } = await registerAndSetupUser()

    await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Client A', cif: 'B11111111' })

    const res = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Client B', cif: 'B11111111' })

    expect(res.status).toBe(409)
  })

  it('rejects missing name', async () => {
    const { accessToken } = await registerAndSetupUser()

    const res = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ cif: 'B11111111' })

    expect(res.status).toBe(400)
  })

  it('rejects unauthenticated request', async () => {
    const res = await request(app)
      .post('/api/client')
      .send({ name: 'Client A', cif: 'B11111111' })
    expect(res.status).toBe(401)
  })
})

describe('Clients — GET /api/client', () => {
  it('lists clients with pagination', async () => {
    const { accessToken } = await registerAndSetupUser()

    await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Client A', cif: 'B11111111' })

    const res = await request(app)
      .get('/api/client?page=1&limit=5')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(res.status).toBe(200)
    expect(res.body.clients).toHaveLength(1)
    expect(res.body.totalItems).toBe(1)
    expect(res.body.totalPages).toBe(1)
    expect(res.body.currentPage).toBe(1)
  })

  it('filters by name', async () => {
    const { accessToken } = await registerAndSetupUser()

    await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'García S.L.', cif: 'B11111111' })

    await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'López & Co.', cif: 'B22222222' })

    const res = await request(app)
      .get('/api/client?name=García')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(res.body.clients).toHaveLength(1)
    expect(res.body.clients[0].name).toBe('García S.L.')
  })
})

describe('Clients — PUT /api/client/:id', () => {
  it('updates a client', async () => {
    const { accessToken } = await registerAndSetupUser()

    const created = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Client A', cif: 'B11111111' })

    const res = await request(app)
      .put(`/api/client/${created.body.client._id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Client A Updated', phone: '600000000' })

    expect(res.status).toBe(200)
    expect(res.body.client.name).toBe('Client A Updated')
  })
})

describe('Clients — soft delete and restore', () => {
  it('archives and restores a client', async () => {
    const { accessToken } = await registerAndSetupUser()

    const created = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Client A', cif: 'B11111111' })

    const id = created.body.client._id

    const del = await request(app)
      .delete(`/api/client/${id}?soft=true`)
      .set('Authorization', `Bearer ${accessToken}`)
    expect(del.status).toBe(200)

    const list = await request(app)
      .get('/api/client')
      .set('Authorization', `Bearer ${accessToken}`)
    expect(list.body.clients).toHaveLength(0)

    const archived = await request(app)
      .get('/api/client/archived')
      .set('Authorization', `Bearer ${accessToken}`)
    expect(archived.body.clients).toHaveLength(1)

    const restore = await request(app)
      .patch(`/api/client/${id}/restore`)
      .set('Authorization', `Bearer ${accessToken}`)
    expect(restore.status).toBe(200)

    const listAfter = await request(app)
      .get('/api/client')
      .set('Authorization', `Bearer ${accessToken}`)
    expect(listAfter.body.clients).toHaveLength(1)
  })

  it('hard deletes a client', async () => {
    const { accessToken } = await registerAndSetupUser()

    const created = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Client A', cif: 'B11111111' })

    const id = created.body.client._id

    const del = await request(app)
      .delete(`/api/client/${id}?soft=false`)
      .set('Authorization', `Bearer ${accessToken}`)
    expect(del.status).toBe(200)

    const get = await request(app)
      .get(`/api/client/${id}`)
      .set('Authorization', `Bearer ${accessToken}`)
    expect(get.status).toBe(404)
  })
})
