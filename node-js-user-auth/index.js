// codigo base para crear proyecto en express

import express from 'express'
import { PORT, SECRET_JWT_KEY } from './config/config.js'
import { UserRepository } from './user-repository.js'
import jwt from 'jsonwebtoken'
import cookieParser from 'cookie-parser'

const app = express()

app.set('view engine', 'ejs')

// Servir archivos estáticos (CSS, imágenes, JS frontend, etc.)
app.use(express.static('styles'))

app.use(express.urlencoded({ extended: true })) // Permite procesar datos de formularios HTML
app.use(express.json()) // middleware para analizar y convertir datos de un formato a otro en
// el body de las peticiones
app.use(cookieParser())

app.use((req, res, next) => {
  const token = req.cookies.access_token
  let data = null

  req.session = { user: null }
  // Verificar si el usuario tiene una sesión activa

  try {
    data = jwt.verify(token, SECRET_JWT_KEY)
    req.session.user = data
  } catch {}

  next() // la función que cumple next() es pasar al siguiente middleware
})

app.get('/', (req, res) => {
  const user = req.session.user || null // Si no hay usuario, será null
  res.render('index', {
    username: user ? user.username : 'Guest',
    isAuthenticated: !!user // Será true si hay usuario, false si no
  })
})

app.post('/login', async (req, res) => {
  const { username, password } = req.body
  try {
    const user = await UserRepository.login({ username, password })
    const token = jwt.sign({ id: user._id, username: user.username }, SECRET_JWT_KEY, { expiresIn: '1h' })
    res
      .cookie('access_token', token, {
        httpOnly: true, // la cookie solo es accesible por el servidor
        secure: process.env.NODE_ENV === 'production', // solo se envía por HTTPS
        sameSite: 'strict', // solo se envía si la petición es del mismo sitio
        maxAge: 3600000 // tiempo de vida de la cookie en milisegundos
      })
      .send({ user, token })
  } catch (error) {
    res.status(401).send(error.message)
  }
})

app.post('/register', async (req, res) => {
  console.log(req.body) // Ver qué datos está enviando el frontend
  const { username, password } = req.body
  try {
    const id = await UserRepository.create({ username, password })
    res.status(201).json({ id })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

app.post('/logout', (req, res) => {
  res
    .clearCookie('access_token')
    .json({ message: 'Sesión cerrada' })
})

app.get('/protected', (req, res) => {
  const { user } = req.session
  if (!user) {
    return res.status(403).send('No tienes permiso para acceder a este recurso')
  }
  res.render('protected', user) // data es el payload del token, osea, { _id, username }
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
