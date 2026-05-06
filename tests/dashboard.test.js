import request from 'supertest'
import { app } from '../src/app.js'
import { User } from '../src/models/User.js'
import { Company } from '../src/models/Company.js'
import { Client } from '../src/models/Client.js'
import { Project } from '../src/models/Project.js'
import { DeliveryNote } from '../src/models/DeliveryNote.js'
import { connect, closeDatabase, clearDatabase } from './setup.js'

beforeAll(async () => { await connect() })
afterEach(async () => { await clearDatabase() })
afterAll(async () => { await closeDatabase() })

let emailCounter = 0
const uniqueEmail = () => `dash-${++emailCounter}@test.com`

const setupUserWithCompany = async () => {
  const email = uniqueEmail()
  const regRes = await request(app)
    .post('/api/user/register')
    .send({ email, password: 'Password1!' })

  const accessToken = regRes.body.accessToken
  const user = await User.findOne({ email })
  const company = await Company.create({ owner: user._id, name: 'DashCo', cif: 'B12345678' })
  await User.findByIdAndUpdate(user._id, { company: company._id })

  return { accessToken, userId: user._id, companyId: company._id }
}

// ── Dashboard — sin compañía ──────────────────────────────────────────────────
describe('Dashboard — sin compañía', () => {
  it('devuelve mensaje si el usuario no tiene compañía', async () => {
    const regRes = await request(app)
      .post('/api/user/register')
      .send({ email: uniqueEmail(), password: 'Password1!' })

    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${regRes.body.accessToken}`)

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.message).toBeDefined()
  })
})

// ── Dashboard — compañía vacía ────────────────────────────────────────────────
describe('Dashboard — compañía sin datos', () => {
  it('devuelve ceros cuando no hay clientes, proyectos ni albaranes', async () => {
    const { accessToken } = await setupUserWithCompany()

    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.data.resumen.totalClientes).toBe(0)
    expect(res.body.data.resumen.totalProyectos).toBe(0)
    expect(res.body.data.resumen.totalAlbaranes).toBe(0)
    expect(res.body.data.resumen.albFirmados).toBe(0)
  })
})

// ── Dashboard — con datos ─────────────────────────────────────────────────────
describe('Dashboard — con clientes, proyectos y albaranes', () => {
  it('devuelve estadísticas correctas con datos reales', async () => {
    const { accessToken, userId, companyId } = await setupUserWithCompany()

    // Create clients
    const clientA = await Client.create({ user: userId, company: companyId, name: 'Client A', cif: 'A11111111' })
    const clientB = await Client.create({ user: userId, company: companyId, name: 'Client B', cif: 'B22222222' })

    // Create project
    const project = await Project.create({
      user: userId,
      company: companyId,
      client: clientA._id,
      name: 'Project Alpha',
      projectCode: 'PA-001',
    })

    // Create an hours delivery note
    await DeliveryNote.create({
      user: userId,
      company: companyId,
      client: clientA._id,
      project: project._id,
      format: 'hours',
      hours: 8,
      workers: [{ name: 'Worker A', hours: 8 }],
      workDate: new Date(),
      description: 'Test note 1',
      signed: false,
    })

    // Create a signed material delivery note
    await DeliveryNote.create({
      user: userId,
      company: companyId,
      client: clientB._id,
      project: project._id,
      format: 'material',
      material: 'Cemento',
      quantity: 100,
      unit: 'kg',
      workDate: new Date(),
      description: 'Test note 2',
      signed: true,
    })

    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)

    const { resumen, albAranesPorMes, horasPorProyecto, materialesPorCliente, distribucionFormato } = res.body.data

    expect(resumen.totalClientes).toBe(2)
    expect(resumen.totalProyectos).toBe(1)
    expect(resumen.totalAlbaranes).toBe(2)
    expect(resumen.albFirmados).toBe(1)
    expect(resumen.albPendientes).toBe(1)

    expect(Array.isArray(albAranesPorMes)).toBe(true)
    expect(Array.isArray(horasPorProyecto)).toBe(true)
    expect(Array.isArray(materialesPorCliente)).toBe(true)
    expect(Array.isArray(distribucionFormato)).toBe(true)

    // distribucionFormato uses _id field for format
    const formats = distribucionFormato.map((f) => f._id)
    expect(formats).toContain('hours')
    expect(formats).toContain('material')
  })

  it('incluye albaranes por mes del último año', async () => {
    const { accessToken, userId, companyId } = await setupUserWithCompany()

    const client = await Client.create({ user: userId, company: companyId, name: 'Client X', cif: 'X33333333' })
    const project = await Project.create({
      user: userId,
      company: companyId,
      client: client._id,
      name: 'Project Beta',
      projectCode: 'PB-001',
    })

    await DeliveryNote.create({
      user: userId,
      company: companyId,
      client: client._id,
      project: project._id,
      format: 'hours',
      hours: 4,
      workers: [{ name: 'Bob', hours: 4 }],
      workDate: new Date(),
      description: 'Recent note',
      signed: false,
    })

    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(res.status).toBe(200)
    expect(res.body.data.albAranesPorMes.length).toBeGreaterThanOrEqual(1)
    // horasPorProyecto should have the project entry
    expect(res.body.data.horasPorProyecto.length).toBeGreaterThanOrEqual(1)
    expect(res.body.data.horasPorProyecto[0].totalHoras).toBe(4)
  })

  it('requiere autenticación', async () => {
    const res = await request(app).get('/api/dashboard')
    expect(res.status).toBe(401)
  })
})
