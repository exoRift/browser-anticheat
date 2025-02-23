import polka from 'polka'
import { json } from 'body-parser'
import serve from 'sirv'

import * as terminal from './middleware/interface'

const {
  PORT,
  NODE_ENV
} = process.env

// Define server
const app = polka()
app
  .use(json())

// Attach frontend
if (NODE_ENV === 'production') {
  app.use(serve('build', {
    single: true,
    ignores: '/api/*'
  }))
} else {
  const { createServer: createViteServer } = await import('vite')

  const vite = await createViteServer({
    server: { middlewareMode: true }
  })

  app.use(vite.middlewares)
}

// Define controllers
app
  .all('/api', (req, res) => void res.status(200).end())

terminal.launch()

// Listen
app.listen(PORT, () => {
  terminal.indicateOnline()
  fetch('https://api.ipify.org')
    .then((res) => res.text())
    .then((ip) => terminal.indicateOnline(`http://${ip}:${PORT}`))
    .catch((err: Error) => terminal.indicateOnline(err))
})
