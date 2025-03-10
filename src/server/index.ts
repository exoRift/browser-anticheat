import express from 'express'

import cookieSession from 'cookie-session'

import * as terminal from './middleware/interface'
import { middleware as stateMiddleware } from './middleware/state'
import { secure } from './middleware/secure'

import * as join from './controllers/join'
import * as profile from './controllers/profile'

const {
  PORT,
  NODE_ENV
} = process.env

terminal.launch()
terminal.indicateOnline()

// Define server
const app = express()
app
  .use(cookieSession({
    httpOnly: false,
    maxAge: 8 * 60 * 60 * 1000,
    sameSite: 'strict',
    signed: false // TODO: figure out why signing doesn't work
  }))
  .use(stateMiddleware)
  .use(secure(['/profile', '/game'], '/', ['/'], '/profile'))

// Define controllers
app
  .all('/api', (req, res) => void res.sendStatus(200).end())
  .use('/api/join', express.urlencoded({ extended: false }))
  .post('/api/join', join.post)
  .get('/api/profile', profile.get)
  .use('/api/profile', express.urlencoded({ extended: false }))
  .post('/api/profile', profile.post)

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
  fetch('https://api.ipify.org')
    .then((res) => res.text())
    .then((ip) => terminal.indicateOnline(`http://${ip}:${PORT}`))
    .catch((err: Error) => terminal.indicateOnline(err))
})
