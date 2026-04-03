import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { config } from '../config/index.js'
import { User } from '../models/User.js'

const generateCode = () => String(Math.floor(100000 + Math.random() * 900000))

const signAccess = (id) => jwt.sign({ id }, config.jwt.secret, { expiresIn: config.jwt.expiresIn })
const signRefresh = (id) => jwt.sign({ id }, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpiresIn })

export const register = async (req, res) => {
  try {
    const { email, password } = req.body

    const existe = await User.findOne({ email })
    if (existe && existe.status === 'verified') {
      return res.status(409).json({ error: 'email ya registrado' })
    }

    const hash = await bcrypt.hash(password, 12)
    const code = generateCode()

    const user = await User.create({
      email, password: hash,
      verificationCode: code,
      verificationAttempts: 3
    })

    const accessToken = signAccess(user._id)
    const refreshToken = signRefresh(user._id)
    user.refreshToken = refreshToken
    await user.save()

    const devExtra = config.nodeEnv !== 'production' ? { _devCode: code } : {}

    res.status(201).json({
      user: { email: user.email, status: user.status, role: user.role },
      accessToken, refreshToken, ...devExtra
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    // fix: añadir select('+password')
    const user = await User.findOne({ email }).select('+password +refreshToken')
    if (!user) return res.status(401).json({ error: 'credenciales incorrectas' })

    const ok = await bcrypt.compare(password, user.password)
    if (!ok) return res.status(401).json({ error: 'credenciales incorrectas' })

    const accessToken = signAccess(user._id)
    const refreshToken = signRefresh(user._id)
    user.refreshToken = refreshToken
    await user.save()

    res.json({ user: { email: user.email, status: user.status, role: user.role }, accessToken, refreshToken })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const verifyEmail = async (req, res) => {
  try {
    const { code } = req.body
    const user = await User.findById(req.user._id).select('+verificationCode +verificationAttempts')

    if (user.status === 'verified') {
      return res.status(400).json({ error: 'el email ya esta verificado' })
    }

    if (code !== user.verificationCode) {
      // BUG: resta pero no guarda, siempre tiene 3 intentos
      user.verificationAttempts - 1
      return res.status(400).json({ error: 'codigo incorrecto' })
    }

    user.status = 'verified'
    await user.save()
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
