import type { Handler } from 'express'

export const post: Handler = function post (req, res) {
  if (!req.session) return void res.status(500).send('Session is null when it should not be').end()

  if (!req.state.passcode || req.body.passcode === req.state.passcode) {
    req.session.valid = true
    req.session.joinedAt = new Date().toISOString()
    req.state.sessions.set(req.session.id, {
      name: req.session.name,
      joinedAt: req.session.joinedAt,
      sequencesServed: 0,
      mistakes: 0,
      totalBlurDuration: 0,
      blurredSince: undefined,
      totalBlurs: 0,
      totalInspects: 0
    })
    res.redirect('/profile')
  } else res.redirect('/?invalid')
}
