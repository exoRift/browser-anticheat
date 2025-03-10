import type { Handler } from 'express'

export interface Profile {
  name?: string
}

export const get: Handler = function get (req, res) {
  if (!req.session) return void res.status(500).send('Session is null when it should not be').end()

  res
    .status(200)
    .json({
      name: req.session.name
    })
    .end()
}

export const post: Handler = function post (req, res) {
  if (!req.session) return void res.status(500).send('Session is null when it should not be').end()

  if (req.body.name) req.session.name = req.body.name
  res.redirect('/profile')
}
