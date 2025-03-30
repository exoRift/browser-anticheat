import type { Handler } from 'express'

export const post: Handler = function post (req, res) {
  if (!req.session) return void res.status(500).send('Session is null when it should not be').end()

  if (!req.state.passcode || req.body.passcode === req.state.passcode) {
    req.session.valid = true
    req.session.joinedAt = new Date().toISOString()
    req.state.sessions.add(req.session)
    res.redirect('/profile')
  } else res.redirect('/?invalid')
}
