import express from 'express'

import cookieSession from 'cookie-session'

import * as terminal from './middleware/interface'
import { middleware as stateMiddleware } from './middleware/state'

import join from './controllers/join'

const {
  PORT,
  NODE_ENV
} = process.env

// Define server
const app = express()
app
  .use(cookieSession({
    name: 'session',
    httpOnly: false,
    maxAge: 8 * 60 * 60,
    keys: [crypto.randomUUID()]
  }))
  .use(stateMiddleware)

// Define controllers
app
  .all('/api', (req, res) => void res.sendStatus(200))
  .use('/api/join', express.urlencoded({ extended: false }))
  .post('/api/join', join)

terminal.launch()

// Attach frontend
if (NODE_ENV === 'production') {
  app.use(express.static('build'))

  app.get('*', (req, res) => res.sendFile('index.html', { root: 'build' }))
} else {
  const { createServer: createViteServer } = await import('vite')

  const vite = await createViteServer({
    server: {
      middlewareMode: true
    },
    appType: 'spa'
  })

  app.use(vite.middlewares)
}

// Listen
app.listen(PORT, () => {
  terminal.indicateOnline()
  fetch('https://api.ipify.org')
    .then((res) => res.text())
    .then((ip) => terminal.indicateOnline(`http://${ip}:${PORT}`))
    .catch((err: Error) => terminal.indicateOnline(err))
})
