import PDFDocument from 'pdfkit'

const fmt = (v) => v ?? '—'

export const generateDeliveryNotePdf = (note, { user, company, client, project }) => {
  return new Promise((resolve, reject) => {
    const doc    = new PDFDocument({ margin: 50 })
    const chunks = []

    doc.on('data',  (c) => chunks.push(c))
    doc.on('end',   ()  => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    // ── Header ──────────────────────────────────────────────────────────────
    doc.fontSize(20).font('Helvetica-Bold').text('ALBARÁN', { align: 'center' })
    doc.moveDown(0.5)
    doc.fontSize(10).font('Helvetica').text(
      `Fecha de emisión: ${new Date().toLocaleDateString('es-ES')}`,
      { align: 'right' }
    )
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke()
    doc.moveDown()

    // ── Company / Emisor ────────────────────────────────────────────────────
    doc.fontSize(12).font('Helvetica-Bold').text('EMISOR')
    doc.fontSize(10).font('Helvetica')
    doc.text(`Empresa: ${fmt(company?.name)}`)
    doc.text(`CIF: ${fmt(company?.cif)}`)
    if (company?.address?.street) {
      doc.text(`Dirección: ${company.address.street} ${company.address.number || ''}, ${company.address.city || ''}`)
    }
    doc.text(`Responsable: ${fmt(user?.name)} ${fmt(user?.lastName)}`)
    doc.text(`Email: ${fmt(user?.email)}`)
    doc.moveDown()

    // ── Client ──────────────────────────────────────────────────────────────
    doc.fontSize(12).font('Helvetica-Bold').text('CLIENTE')
    doc.fontSize(10).font('Helvetica')
    doc.text(`Nombre: ${fmt(client?.name)}`)
    doc.text(`CIF: ${fmt(client?.cif)}`)
    if (client?.address?.street) {
      doc.text(`Dirección: ${client.address.street} ${client.address.number || ''}, ${client.address.city || ''}`)
    }
    if (client?.email) doc.text(`Email: ${client.email}`)
    doc.moveDown()

    // ── Project ─────────────────────────────────────────────────────────────
    doc.fontSize(12).font('Helvetica-Bold').text('PROYECTO')
    doc.fontSize(10).font('Helvetica')
    doc.text(`Nombre: ${fmt(project?.name)}`)
    doc.text(`Código: ${fmt(project?.projectCode)}`)
    if (project?.address?.city) doc.text(`Lugar: ${project.address.city}`)
    doc.moveDown()

    // ── Delivery Note Details ────────────────────────────────────────────────
    doc.fontSize(12).font('Helvetica-Bold').text('DETALLE DEL ALBARÁN')
    doc.fontSize(10).font('Helvetica')
    doc.text(`Fecha trabajo: ${note.workDate ? new Date(note.workDate).toLocaleDateString('es-ES') : '—'}`)
    doc.text(`Tipo: ${note.format === 'hours' ? 'Horas trabajadas' : 'Materiales'}`)
    if (note.description) doc.text(`Descripción: ${note.description}`)
    doc.moveDown(0.5)

    if (note.format === 'material') {
      doc.text(`Material: ${fmt(note.material)}`)
      doc.text(`Cantidad: ${fmt(note.quantity)} ${fmt(note.unit)}`)
    } else {
      if (note.hours != null) {
        doc.text(`Horas totales: ${note.hours}`)
      }
      if (note.workers?.length) {
        doc.moveDown(0.3)
        doc.font('Helvetica-Bold').text('Trabajadores:')
        doc.font('Helvetica')
        note.workers.forEach((w) => {
          doc.text(`  • ${w.name}: ${w.hours} h`)
        })
      }
    }
    doc.moveDown()

    // ── Signature ────────────────────────────────────────────────────────────
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke()
    doc.moveDown(0.5)
    if (note.signed) {
      doc.fontSize(12).font('Helvetica-Bold').text('FIRMADO')
      doc.fontSize(10).font('Helvetica')
      if (note.signedAt) doc.text(`Fecha de firma: ${new Date(note.signedAt).toLocaleDateString('es-ES')}`)
      if (note.signatureUrl) {
        doc.moveDown(0.5)
        doc.text('Firma:')
        doc.moveDown(0.3)
        try {
          doc.image(note.signatureUrl, { width: 200, height: 80 })
        } catch {
          doc.text('[imagen de firma no disponible]')
        }
      }
    } else {
      doc.fontSize(10).font('Helvetica').text('Albarán pendiente de firma')
    }

    doc.end()
  })
}
