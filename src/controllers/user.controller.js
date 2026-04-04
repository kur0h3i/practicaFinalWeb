import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { config } from '../config/index.js'
import { User } from '../models/User.js'
import { AppError } from '../utils/AppError.js'

const generateCode = () => String(Math.floor(100000 + Math.random() * 900000))
const signAccess  = (id) => jwt.sign({ id }, config.jwt.secret,        { expiresIn: config.jwt.expiresIn })
const signRefresh = (id) => jwt.sign({ id }, config.jwt.refreshSecret,  { expiresIn: config.jwt.refreshExpiresIn })

export const register = async (req, res, next) => {
  try {
    const { email, password } = req.body
    const existe = await User.findOne({ email })
    if (existe && existe.status === 'verified') return next(AppError.conflict('Email ya registrado'))

    const hash = await bcrypt.hash(password, 12)
    const code = generateCode()
    const user = await User.create({ email, password: hash, verificationCode: code, verificationAttempts: 3 })

    const accessToken  = signAccess(user._id)
    const refreshToken = signRefresh(user._id)
    user.refreshToken  = refreshToken
    await user.save()

    const devExtra = config.nodeEnv !== 'production' ? { _devCode: code } : {}
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
      user.verificationAttempts -= 1   // fix: ahora sí se guarda
      await user.save()
      if (user.verificationAttempts <= 0) return next(AppError.tooManyRequests('Código incorrecto. Sin intentos restantes'))
      return next(AppError.badRequest(`Código incorrecto. Intentos restantes: ${user.verificationAttempts}`))
    }

    user.status = 'verified'
    user.verificationCode = undefined
    await user.save()
    res.json({ ok: true, mensaje: 'Email verificado' })
  } catch (err) { next(err) }
}

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email }).select('+password +refreshToken')
    if (!user) return next(AppError.unauthorized('Credenciales incorrectas'))

    const ok = await bcrypt.compare(password, user.password)
    if (!ok) return next(AppError.unauthorized('Credenciales incorrectas'))

    const accessToken  = signAccess(user._id)
    const refreshToken = signRefresh(user._id)
    user.refreshToken  = refreshToken
    await user.save()
    res.json({ user: { email: user.email, status: user.status, role: user.role }, accessToken, refreshToken })
  } catch (err) { next(err) }
}

export const updatePersonalData = async (req, res, next) => {
  try {
    const { name, lastName, nif } = req.body
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, lastName, nif },
      { new: true }
    ).populate('company')
    res.json({ user })
  } catch (err) { next(err) }
}

export const updateCompany = async (req, res, next) => {
  try {
    const { cif, name, address } = req.body
    const { Company } = await import('../models/Company.js')

    const existente = await Company.findOne({ cif })
    let company
    let nuevoRol = 'admin'

    if (!existente) {
      company  = await Company.create({ owner: req.user._id, cif, name, address })
    } else {
      company  = existente
      nuevoRol = 'guest'
    }

    // TODO: falta el caso isFreelance
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { company: company._id, role: nuevoRol },
      { new: true }
    ).populate('company')

    res.json({ user })
  } catch (err) { next(err) }
}
