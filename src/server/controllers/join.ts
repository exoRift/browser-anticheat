import type { Handler } from 'express'

const join: Handler = function (req, res) {
  if (!req.session) return void res.status(500).send('Session is null when it should not be').end()

  if (!req.state.passcode || req.body.passcode === req.state.passcode) {
    req.session.valid = true
    req.session.joinedAt = new Date().toISOString()
    req.session.sequencesServed = 0
    req.session.mistakes = 0
    req.session.totalBlurDuration = 0
    req.session.currentlyBlurred = false
    res.redirect('/profile')
  } else res.redirect('/?invalid')
}

export default join
