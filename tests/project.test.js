import request from 'supertest'
import { app } from '../src/app.js'
import { User } from '../src/models/User.js'
import { Company } from '../src/models/Company.js'
import { Client } from '../src/models/Client.js'
import { connect, closeDatabase, clearDatabase } from './setup.js'

beforeAll(async () => { await connect() })
afterEach(async () => { await clearDatabase() })
afterAll(async () => { await closeDatabase() })

let emailCounter = 0
const uniqueEmail = () => `project-admin-${++emailCounter}@test.com`

const setupUserWithClient = async () => {
  const email = uniqueEmail()
  const regRes = await request(app)
    .post('/api/user/register')
    .send({ email, password: 'Password1!' })

  const accessToken = regRes.body.accessToken
  const user = await User.findOne({ email })
  const userId = user._id

  const company = await Company.create({ owner: userId, name: 'TestCo', cif: 'B00000001' })
  await User.findByIdAndUpdate(userId, { company: company._id })

  const client = await Client.create({
    user: userId, company: company._id,
    name: 'Test Client', cif: 'B11111111',
  })

  return { accessToken, userId, companyId: company._id, clientId: client._id.toString() }
}

describe('Projects — POST /api/project', () => {
  it('creates a project', async () => {
    const { accessToken, clientId } = await setupUserWithClient()

    const res = await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Project A', projectCode: 'PRJ-001', client: clientId })

    expect(res.status).toBe(201)
    expect(res.body.project.name).toBe('Project A')
  })

  it('rejects duplicate projectCode', async () => {
    const { accessToken, clientId } = await setupUserWithClient()

    await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Project A', projectCode: 'PRJ-001', client: clientId })

    const res = await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Project B', projectCode: 'PRJ-001', client: clientId })

    expect(res.status).toBe(409)
  })

  it('rejects unknown client', async () => {
    const { accessToken } = await setupUserWithClient()

    const res = await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Project X', projectCode: 'PRJ-002', client: '000000000000000000000000' })

    expect(res.status).toBe(404)
  })

  it('rejects missing required fields', async () => {
    const { accessToken } = await setupUserWithClient()

    const res = await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Project X' })

    expect(res.status).toBe(400)
  })
})

describe('Projects — GET /api/project', () => {
  it('lists projects with pagination', async () => {
    const { accessToken, clientId } = await setupUserWithClient()

    await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Project A', projectCode: 'PRJ-001', client: clientId })

    const res = await request(app)
      .get('/api/project?page=1&limit=10')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(res.status).toBe(200)
    expect(res.body.projects).toHaveLength(1)
    expect(res.body.totalItems).toBe(1)
  })

  it('filters by client', async () => {
    const { accessToken, clientId } = await setupUserWithClient()

    await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Project A', projectCode: 'PRJ-001', client: clientId })

    const res = await request(app)
      .get(`/api/project?client=${clientId}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(res.body.projects).toHaveLength(1)
  })
})

describe('Projects — GET /api/project/:id', () => {
  it('returns a single project with populated client', async () => {
    const { accessToken, clientId } = await setupUserWithClient()

    const created = await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Project A', projectCode: 'PRJ-001', client: clientId })

    const id = created.body.project._id

    const res = await request(app)
      .get(`/api/project/${id}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(res.status).toBe(200)
    expect(res.body.project.client.name).toBe('Test Client')
  })
})

describe('Projects — soft delete and restore', () => {
  it('archives and restores a project', async () => {
    const { accessToken, clientId } = await setupUserWithClient()

    const created = await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Project A', projectCode: 'PRJ-001', client: clientId })

    const id = created.body.project._id

    await request(app)
      .delete(`/api/project/${id}?soft=true`)
      .set('Authorization', `Bearer ${accessToken}`)

    const list = await request(app)
      .get('/api/project')
      .set('Authorization', `Bearer ${accessToken}`)
    expect(list.body.projects).toHaveLength(0)

    const archived = await request(app)
      .get('/api/project/archived')
      .set('Authorization', `Bearer ${accessToken}`)
    expect(archived.body.projects).toHaveLength(1)

    await request(app)
      .patch(`/api/project/${id}/restore`)
      .set('Authorization', `Bearer ${accessToken}`)

    const listAfter = await request(app)
      .get('/api/project')
      .set('Authorization', `Bearer ${accessToken}`)
    expect(listAfter.body.projects).toHaveLength(1)
  })
})
