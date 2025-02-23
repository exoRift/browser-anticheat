import polka from 'polka'
import { json } from 'body-parser'
import serve from 'sirv'

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
  .all('/api', (req, res) => { res.status(200).end() })

// Listen
app.listen(PORT, () => {
  console.info('Server online listening at http://localhost:%s', PORT)
})
