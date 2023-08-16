import { readFileSync } from 'node:fs'
import crypto from 'node:crypto'

import express from 'express'
// import cors from 'cors'
import { validateMovie, validatePartialMovie } from './schemas/movies.js'

const movies = JSON.parse(readFileSync('./movies.json'))

const app = express()
app.disable('x-powered-by')

// app.use(cors())
app.use(express.json())

const PORT = process.env.PORT ?? 4000

// Methods: GET/HEAD/POST
// Methods: PUT/PATCH/DELETE, require options(CORS Pre-Flight)

const ACCEPTED_ORIGINS = [
  'http://localhost:8080',
  'https://locahost:4000'
]

app.get('/movies', (req, res) => {
  const origin = req.header('origin')
  // console.log(origin)
  if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
    res.header('Access-Control-Allow-Origin', origin)
  }
  const { genre: genreQuery } = req.query
  // console.log('genreQuery:', genreQuery)

  const moviesByGenre = genreQuery
    ? movies.filter(({ genre }) => genre.some(g => g.toLocaleLowerCase() === genreQuery.toLocaleLowerCase()))
    : []
  // console.log(moviesByGenre)

  if (moviesByGenre.length) return res.json(moviesByGenre)

  // res.status(404).json({ message: 'Movies not found' })
  res.json(movies)
})

app.get('/movies/:id', (req, res) => {
  const { id } = req.params

  const movie = movies.find(movie => movie.id === id)
  // console.log(movie)

  if (movie) return res.json(movie)

  res.status(404).json({ message: 'Movie not found' })
})

app.post('/movies', (req, res) => {
  const result = validateMovie(req.body)

  if (!result.success) {
    // 400 -> Bad request
    // 422 -> Unprocessable Entity
    return res.status(400).json({ error: JSON.parse(result.error.message) })
  }

  // TODO: Save in DB
  const newMovie = {
    id: crypto.randomUUID(),
    ...result.data
  }

  movies.push(newMovie)

  res.status(201).json(newMovie)
})

app.patch('/movies/:id', (req, res) => {
  const { id } = req.params

  const result = validatePartialMovie(req.body)

  if (!result.success) {
    return res.status(400).json({ error: JSON.parse(result.error.message) })
  }

  const movieIndex = movies.findIndex(movie => movie.id === id)

  if (movieIndex === -1) return res.status(404).json({ message: 'Movie not found' })

  const updateMovie = {
    ...movies[movieIndex],
    ...result.data
  }

  movies[movieIndex] = updateMovie

  return res.json(updateMovie)
})

app.delete('/movies/:id', (req, res) => {
  const origin = req.header('origin')
  // console.log(origin)
  if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
    res.header('Access-Control-Allow-Origin', origin)
  }

  const { id } = req.params

  const movieIndex = movies.findIndex(movie => movie.id === id)

  if (movieIndex === -1) return res.status(404).json({ message: 'Movie not found' })

  movies.splice(movieIndex, 1)

  return res.status(204).send()
})

// This is required when the method is PUT, PATCH or DELETE
app.options('/movies/:id', (req, res) => {
  const origin = req.header('origin')

  if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
    res.header('Access-Control-Allow-Origin', origin)
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE')
  }

  res.send(200)
})

// app.use(express.static('web'))

app.listen(PORT, () => {
  console.log(`Server is running in http://localhost:${PORT}`)
})
