import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { User } from '../models/User.js'

const generateCode = () => String(Math.floor(100000 + Math.random() * 900000))

export const register = async (req, res) => {
  try {
    const { email, password } = req.body

    const existe = await User.findOne({ email })
    if (existe) {
      return res.status(409).json({ error: 'email ya registrado' })
    }

    const hash = await bcrypt.hash(password, 12)
    const code = generateCode()

    const user = await User.create({
      email,
      password: hash,
      verificationCode: code,
      verificationAttempts: 3
    })

    // jwt sin expiración... lo arreglo luego
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)

    res.status(201).json({
      user: { email: user.email, status: user.status },
      token
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
