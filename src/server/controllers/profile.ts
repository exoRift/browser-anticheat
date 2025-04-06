import type { Handler } from 'express'

export interface Profile {
  name?: string
}

export const get: Handler = function get (req, res) {
  if (!req.session) return void res.status(500).send('Session is null when it should not be').end()
  const meta = req.state.sessions.metadata.get(req.session.id)

  res
    .status(200)
    .json({
      name: meta?.name
    })
    .end()
}

export const post: Handler = function post (req, res) {
  if (!req.session) return void res.status(500).send('Session is null when it should not be').end()

  if (req.body.name) {
    const meta = req.state.sessions.metadata.get(req.session.id)
    if (meta) {
      meta.name = req.body.name
      console.log(`${req.session.id} changes name to ${meta.name}`)
    }
  }
  res.redirect('/profile')
}
