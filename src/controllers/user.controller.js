import { User } from '../models/User.js'

// registro de usuario
export const register = async (req, res) => {
  try {
    const { email, password } = req.body

    // comprobar si ya existe
    const existe = await User.findOne({ email })
    if (existe) {
      return res.status(400).json({ error: 'email ya registrado' })
    }

    // guardar usuario - TODO encriptar password!!!
    const user = await User.create({ email, password, role: 'admin' })

    res.status(201).json({ user })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
