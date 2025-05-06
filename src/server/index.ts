import express from 'express'
import localtunnel from 'localtunnel'

import cookieSession from 'cookie-session'
import ws from 'express-ws'

import * as terminal from './middleware/interface'
import { middleware as userAgentCheckerMiddleware } from './middleware/useragent'
import { middleware as stateMiddleware } from './middleware/state'
import { secure } from './middleware/secure'

import * as join from './controllers/join'
import * as profile from './controllers/profile'
import * as connect from './controllers/connect'
import * as captcha from './controllers/captcha'

// Define server
const app = express()
ws(app)
app
  .use(userAgentCheckerMiddleware)
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
  .all('/api', (_, res) => void res.sendStatus(200).end())
  .use('/api/join', express.urlencoded({ extended: false }))
  .post('/api/join', join.post)
  .get('/api/profile', profile.get)
  .use('/api/profile', express.urlencoded({ extended: false }))
  .post('/api/profile', profile.post)
  .ws('/api/connect', connect.ws)
  .get('/api/captcha/:id', captcha.get)
  .all('/api/*', (_, res) => void res.sendStatus(404).end())

// Attach frontend
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('build'))

  app.get('*', (_, res) => res.sendFile('index.html', { root: 'build/' }))
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
    terminal.indicateOnline()

    // Listen
    const server = app.listen(method.type === 'classic' ? method.port : 0, (err) => {
      if (err) terminal.indicateOnline(err)
      else {
        const port = (server.address() as Exclude<ReturnType<typeof server.address>, string | null>).port

        if (method.type === 'tunnel') {
          localtunnel({
            port,
            subdomain: method.subdomain
          })
            .then((tunnel) => terminal.indicateOnline({
              type: 'tunnel',
              address: tunnel.url
            }))
            .catch((err) => terminal.indicateOnline(err))
        } else terminal.indicateOnline({ type: 'classic', port })
      }
    })
  })
