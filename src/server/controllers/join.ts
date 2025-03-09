import type { Handler } from 'express'

const join: Handler = function (req, res) {
  if (!req.session) return void res.status(500).send('Session is null when it should not be').end()

  if (!req.state.passcode || req.body.passcode === req.state.passcode) {
    req.session.valid = true
    req.session.joinedAt = new Date().toISOString()
    res.redirect('/')
  } else res.redirect('/?invalid')
}

export default join
