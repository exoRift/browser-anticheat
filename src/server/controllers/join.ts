import type { Handler } from 'express'

/**
 * Create initial session (sign in with password)
 * @param req The request
 * @param res The response
 */
export const post: Handler = function post (req, res): void {
  if (!req.session) return void res.status(500).send('Session is null when it should not be').end()

  if (!req.state.passcode || req.body.passcode === req.state.passcode) {
    req.session.valid = true
    req.state.sessions.add(req.session)
    console.log(`${req.session.id} joins`)
    res.redirect('/profile')
  } else res.redirect('/?invalid')
}
