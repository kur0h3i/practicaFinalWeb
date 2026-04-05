import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { config } from '../config/index.js'
import { User }    from '../models/User.js'
import { Company } from '../models/Company.js'
import { AppError } from '../utils/AppError.js'
import { notifier } from '../services/notification.service.js'

const generateCode = () => String(Math.floor(100000 + Math.random() * 900000))
const signAccess  = (id) => jwt.sign({ id }, config.jwt.secret,       { expiresIn: config.jwt.expiresIn })
const signRefresh = (id) => jwt.sign({ id }, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpiresIn })

export const register = async (req, res, next) => {
  try {
    const { email, password } = req.body
    const existe = await User.findOne({ email })
    if (existe && existe.status === 'verified') return next(AppError.conflict('Email ya registrado'))
    const hash = await bcrypt.hash(password, 12)
    const code = generateCode()
    const user = await User.create({ email, password: hash, verificationCode: code, verificationAttempts: 3 })
    const accessToken = signAccess(user._id)
    const refreshToken = signRefresh(user._id)
    user.refreshToken = refreshToken
    await user.save()
    const devExtra = config.nodeEnv !== 'production' ? { _devCode: code } : {}
    notifier.emit('user:registered', { id: user._id, email: user.email })
    res.status(201).json({ user: { email: user.email, status: user.status, role: user.role }, accessToken, refreshToken, ...devExtra })
  } catch (err) { next(err) }
}

export const verifyEmail = async (req, res, next) => {
  try {
    const { code } = req.body
    const user = await User.findById(req.user._id).select('+verificationCode +verificationAttempts')
    if (user.status === 'verified') return next(AppError.badRequest('Email ya verificado'))
    if (user.verificationAttempts <= 0) return next(AppError.tooManyRequests('Sin intentos restantes'))
    if (code !== user.verificationCode) {
      user.verificationAttempts -= 1
      await user.save()
      if (user.verificationAttempts <= 0) return next(AppError.tooManyRequests('Código incorrecto. Sin intentos'))
      return next(AppError.badRequest(`Código incorrecto. Intentos: ${user.verificationAttempts}`))
    }
    user.status = 'verified'
    user.verificationCode = undefined
    await user.save()
    res.json({ ok: true })
  } catch (err) { next(err) }
}

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email }).select('+password +refreshToken')
    if (!user) return next(AppError.unauthorized('Credenciales incorrectas'))
    const ok = await bcrypt.compare(password, user.password)
    if (!ok) return next(AppError.unauthorized('Credenciales incorrectas'))
    const accessToken = signAccess(user._id)
    const refreshToken = signRefresh(user._id)
    user.refreshToken = refreshToken
    await user.save()
    res.json({ user: { email: user.email, status: user.status, role: user.role }, accessToken, refreshToken })
  } catch (err) { next(err) }
}

export const updatePersonalData = async (req, res, next) => {
  try {
    const { name, lastName, nif } = req.body
    const user = await User.findByIdAndUpdate(req.user._id, { name, lastName, nif }, { new: true }).populate('company')
    res.json({ ok: true, user })
  } catch (err) { next(err) }
}

export const updateCompany = async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.user._id)
    const { isFreelance } = req.body
    let companyData

    if (isFreelance) {
      if (!currentUser.nif) return next(AppError.badRequest('Completa tus datos personales antes'))
      companyData = { cif: currentUser.nif, name: currentUser.fullName || currentUser.name, isFreelance: true, address: currentUser.address }
    } else {
      companyData = { cif: req.body.cif, name: req.body.name, isFreelance: false, address: req.body.address }
    }

    const existente = await Company.findOne({ cif: companyData.cif })
    let company, nuevoRol = currentUser.role

    if (!existente) {
      company  = await Company.create({ owner: currentUser._id, ...companyData })
      nuevoRol = 'admin'
    } else {
      company  = existente
      nuevoRol = 'guest'
    }

    const user = await User.findByIdAndUpdate(currentUser._id, { company: company._id, role: nuevoRol }, { new: true }).populate('company')
    res.json({ ok: true, user })
  } catch (err) { next(err) }
}

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('company')
    res.json({ ok: true, user })
  } catch (err) { next(err) }
}

export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body
    if (!token) return next(AppError.unauthorized('Refresh token no proporcionado'))
    let payload
    try { payload = jwt.verify(token, config.jwt.refreshSecret) } catch { return next(AppError.unauthorized('Refresh token inválido')) }
    const user = await User.findById(payload.id).select('+refreshToken')
    if (!user || user.refreshToken !== token) return next(AppError.unauthorized('Refresh token inválido'))
    const newAccess  = signAccess(user._id)
    const newRefresh = signRefresh(user._id)
    user.refreshToken = newRefresh
    await user.save()
    res.json({ ok: true, accessToken: newAccess, refreshToken: newRefresh })
  } catch (err) { next(err) }
}

export const logout = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null })
    res.json({ ok: true, mensaje: 'Sesión cerrada' })
  } catch (err) { next(err) }
}

export const deleteUser = async (req, res, next) => {
  try {
    const soft = req.query.soft === 'true'
    if (soft) { await User.findByIdAndUpdate(req.user._id, { deleted: true }) }
    else       { await User.findByIdAndDelete(req.user._id) }
    res.json({ ok: true, mensaje: `Usuario eliminado (${soft ? 'soft' : 'hard'})` })
  } catch (err) { next(err) }
}

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body
    const user = await User.findById(req.user._id).select('+password')
    const ok = await bcrypt.compare(currentPassword, user.password)
    if (!ok) return next(AppError.badRequest('Contraseña actual incorrecta'))
    user.password = await bcrypt.hash(newPassword, 12)
    await user.save()
    res.json({ ok: true, mensaje: 'Contraseña actualizada' })
  } catch (err) { next(err) }
}

export const inviteUser = async (req, res, next) => {
  try {
    const { email, name, lastName } = req.body
    if (!req.user.company) return next(AppError.badRequest('Necesitas una compañía para invitar usuarios'))
    const existe = await User.findOne({ email })
    if (existe) return next(AppError.conflict('Ya existe un usuario con ese email'))
    const tempPass = await bcrypt.hash(Math.random().toString(36).slice(-10), 12)
    const code     = generateCode()
    const invited  = await User.create({ email, name, lastName, password: tempPass, verificationCode: code, verificationAttempts: 3, role: 'guest', status: 'pending', company: req.user.company })
    res.status(201).json({ ok: true, user: { email: invited.email, role: invited.role, company: invited.company } })
  } catch (err) { next(err) }
}

export const uploadCompanyLogo = async (req, res, next) => {
  try {
    if (!req.user.company) return next(AppError.badRequest('Sin compañía asociada'))
    if (!req.file) return next(AppError.badRequest('No se ha subido ningún archivo'))
    const logoUrl = `/${config.upload.path}/${req.file.filename}`
    const company = await Company.findByIdAndUpdate(req.user.company, { logo: logoUrl }, { new: true })
    res.json({ ok: true, logo: company.logo })
  } catch (err) { next(err) }
}
