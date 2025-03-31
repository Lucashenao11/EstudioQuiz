import fs from 'fs'
import path from 'path'

export default class DBLocal {
  constructor ({ path }) {
    this.path = path
    this.data = { User: [] }

    // Asegurarse de que el archivo existe al iniciar
    this.loadData()
  }

  loadData () {
    try {
      if (fs.existsSync(this.path)) {
        const fileData = fs.readFileSync(this.path, 'utf8').trim()
        this.data.User = fileData ? JSON.parse(fileData) : []
      }
    } catch (error) {
      console.error('Error al cargar User.json:', error)
      this.data.User = [] // Si hay error, usar un array vacío
    }
  }

  saveData () {
    try {
      const dir = path.dirname(this.path) // Obtener la carpeta del archivo
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true }) // Crear la carpeta si no existe
      }

      fs.writeFileSync(this.path, JSON.stringify(this.data.User, null, 2))
      console.log('User.json actualizado correctamente')
    } catch (error) {
      console.error('Error guardando datos:', error)
    }
  }

  Schema (name) {
    return {
      create: (data) => ({
        save: () => {
          const exists = this.data.User.some(user => user.username === data.username)
          if (exists) {
            throw new Error(`El usuario ${data.username} ya existe`)
          }

          this.data.User.push(data)
          this.saveData() // Guardar en el archivo después de agregar el usuario
          console.log(`Saved ${name}:`, data)
        }
      }),
      findOne: (query) => this.data.User.find(user => user.username === query.username) || null
    }
  }
}
