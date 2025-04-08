import express from 'express'
import localtunnel from 'localtunnel'

import cookieSession from 'cookie-session'
import ws from 'express-ws'

import * as terminal from './middleware/interface.ts'
import { middleware as stateMiddleware } from './middleware/state.ts'
import { secure } from './middleware/secure.ts'

import * as join from './controllers/join.ts'
import * as profile from './controllers/profile.ts'
import * as connect from './controllers/connect.ts'
import * as captcha from './controllers/captcha.ts'

// Define server
const app = express()
ws(app)
app
  .use(cookieSession({
    httpOnly: false,
    maxAge: 8 * 60 * 60 * 1000,
    sameSite: 'strict',
    signed: false
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
  .ws('/api/connect', connect.ws)
  .get('/api/captcha/:id', captcha.get)
  .all('/api/*', (req, res) => void res.sendStatus(404).end())

// Attach frontend
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('build'))

  app.get('*', (req, res) => res.sendFile('index.html', { root: 'build/' }))
} else {
  // @bun nobuild[
  const { createServer: createViteServer } = await import('vite')

  const vite = await createViteServer({
    server: {
      middlewareMode: true,
      hotUpdateEnvironments: async () => terminal.screen.render()
    },
    appType: 'spa'
  })

  app.use(vite.middlewares)
  // @bun nobuild]
}

terminal.engageSizeGuard()
// Ask the user how they want to host the server
void terminal.promptBootScreen()
  .then((method) => {
    terminal.launch()
    // terminal.indicateOnline()

    // Listen
    const server = app.listen(method.type === 'classic' ? method.port : 0, (err) => {
      console.error(err)

      if (method.type === 'tunnel') {
        localtunnel({
          port: (server.address() as Exclude<ReturnType<typeof server.address>, string | null>).port,
          subdomain: method.subdomain
        })
          .then(() => {
            console.log('bruh')
          })
          .catch((err) => {
            console.error(err)
          })
      }
    })
  })
