import request from 'supertest'
import { app } from '../src/app.js'
import { User } from '../src/models/User.js'
import { Company } from '../src/models/Company.js'
import { Client } from '../src/models/Client.js'
import { Project } from '../src/models/Project.js'
import { connect, closeDatabase, clearDatabase } from './setup.js'

beforeAll(async () => { await connect() })
afterEach(async () => { await clearDatabase() })
afterAll(async () => { await closeDatabase() })

let emailCounter = 0
const uniqueEmail = () => `dn-admin-${++emailCounter}@test.com`

const fullSetup = async () => {
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

  const project = await Project.create({
    user: userId, company: company._id,
    client: client._id,
    name: 'Test Project', projectCode: 'PRJ-001',
  })

  return {
    accessToken,
    userId,
    companyId: company._id.toString(),
    clientId:  client._id.toString(),
    projectId: project._id.toString(),
  }
}

const baseNote = (projectId, clientId) => ({
  format:   'hours',
  project:  projectId,
  client:   clientId,
  workDate: '2025-06-15',
  hours:    8,
})

describe('DeliveryNotes — POST /api/deliverynote', () => {
  it('creates a hours delivery note', async () => {
    const { accessToken, projectId, clientId } = await fullSetup()

    const res = await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(baseNote(projectId, clientId))

    expect(res.status).toBe(201)
    expect(res.body.note.format).toBe('hours')
    expect(res.body.note.signed).toBe(false)
    expect(res.body.note.hours).toBe(8)
  })

  it('creates a material delivery note', async () => {
    const { accessToken, projectId, clientId } = await fullSetup()

    const res = await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        format:   'material',
        project:  projectId,
        client:   clientId,
        workDate: '2025-06-15',
        material: 'Cemento',
        quantity: 100,
        unit:     'kg',
      })

    expect(res.status).toBe(201)
    expect(res.body.note.material).toBe('Cemento')
    expect(res.body.note.quantity).toBe(100)
  })

  it('creates note with workers array', async () => {
    const { accessToken, projectId, clientId } = await fullSetup()

    const res = await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        format:   'hours',
        project:  projectId,
        client:   clientId,
        workDate: '2025-06-15',
        workers:  [{ name: 'Juan', hours: 4 }, { name: 'Pedro', hours: 4 }],
      })

    expect(res.status).toBe(201)
    expect(res.body.note.workers).toHaveLength(2)
  })

  it('rejects unknown project', async () => {
    const { accessToken, clientId } = await fullSetup()

    const res = await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(baseNote('000000000000000000000000', clientId))

    expect(res.status).toBe(404)
  })

  it('requires authorization', async () => {
    const res = await request(app)
      .post('/api/deliverynote')
      .send({ format: 'hours' })
    expect(res.status).toBe(401)
  })
})

describe('DeliveryNotes — GET /api/deliverynote', () => {
  it('lists with pagination', async () => {
    const { accessToken, projectId, clientId } = await fullSetup()

    await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(baseNote(projectId, clientId))

    const res = await request(app)
      .get('/api/deliverynote?page=1&limit=10')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(res.status).toBe(200)
    expect(res.body.notes).toHaveLength(1)
    expect(res.body.totalItems).toBe(1)
    expect(res.body.totalPages).toBe(1)
  })

  it('filters by project', async () => {
    const { accessToken, projectId, clientId } = await fullSetup()

    await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(baseNote(projectId, clientId))

    const res = await request(app)
      .get(`/api/deliverynote?project=${projectId}&format=hours`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(res.body.notes).toHaveLength(1)
  })

  it('filters by signed=false', async () => {
    const { accessToken, projectId, clientId } = await fullSetup()

    await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(baseNote(projectId, clientId))

    const res = await request(app)
      .get('/api/deliverynote?signed=false')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(res.body.notes).toHaveLength(1)
    expect(res.body.notes[0].signed).toBe(false)
  })
})

describe('DeliveryNotes — GET /api/deliverynote/:id', () => {
  it('returns a note with populated fields', async () => {
    const { accessToken, projectId, clientId } = await fullSetup()

    const created = await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(baseNote(projectId, clientId))

    const id = created.body.note._id

    const res = await request(app)
      .get(`/api/deliverynote/${id}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(res.status).toBe(200)
    expect(res.body.note.client.name).toBe('Test Client')
    expect(res.body.note.project.name).toBe('Test Project')
  })
})

describe('DeliveryNotes — DELETE', () => {
  it('deletes an unsigned delivery note', async () => {
    const { accessToken, projectId, clientId } = await fullSetup()

    const created = await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(baseNote(projectId, clientId))

    const id = created.body.note._id

    const del = await request(app)
      .delete(`/api/deliverynote/${id}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(del.status).toBe(200)

    const list = await request(app)
      .get('/api/deliverynote')
      .set('Authorization', `Bearer ${accessToken}`)
    expect(list.body.notes).toHaveLength(0)
  })

  it('returns 404 for non-existent id', async () => {
    const { accessToken } = await fullSetup()

    const res = await request(app)
      .delete('/api/deliverynote/000000000000000000000000')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(res.status).toBe(404)
  })
})

describe('DeliveryNotes — GET /api/deliverynote/pdf/:id', () => {
  it('generates a PDF for an unsigned note', async () => {
    const { accessToken, projectId, clientId } = await fullSetup()

    const created = await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(baseNote(projectId, clientId))

    const id = created.body.note._id

    const res = await request(app)
      .get(`/api/deliverynote/pdf/${id}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toMatch(/pdf/)
  })
})
