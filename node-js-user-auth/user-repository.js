import DBLocal from './db-local.js'
import crypto from 'crypto'
import bycrypt from 'bcrypt'
import { SALT_ROUNDS } from './config/config.js'

const db = new DBLocal({ path: 'db/User.json' }) // Guardar usuarios en User.json

const User = db.Schema('User', {
  _id: { type: String, required: true },
  username: { type: String, required: true },
  password: { type: String, required: true }
})

export class UserRepository {
  static async create ({ username, password }) {
    // 1. validaciones de username
    Validacion.username(username)
    // 2. validaciones de password
    Validacion.password(password)

    const user = User.findOne({ username })
    if (user) {
      throw new Error('username already exists')
    }

    const id = crypto.randomUUID()
    const hashedPassword = await bycrypt.hash(password, SALT_ROUNDS)

    User.create({ _id: id, username, password: hashedPassword }).save()

    return id
  }

  static async login ({ username, password }) {
    // 1. validaciones de username
    Validacion.username(username)
    // 2. validaciones de password
    Validacion.password(password)

    const user = User.findOne({ username })
    if (!user) {
      throw new Error('username does not exist')
    }

    const isValid = await bycrypt.compare(password, user.password)
    if (!isValid) {
      throw new Error('password is incorrect')
    }

    return user
  }
}

class Validacion {
  static username (username) {
    if (typeof username !== 'string') {
      throw new Error('username must be a string')
    }
    if (username.length < 3) {
      throw new Error('username must be at least 3 characters long')
    }
  }

  static password (password) {
    if (typeof password !== 'string') {
      throw new Error('password must be a string')
    }
    if (password.length < 6) {
      throw new Error('password must be at least 6 characters long')
    }
  }
}
