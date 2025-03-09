import type { Handler } from 'express'

const join: Handler = function (req, res) {
  if (!req.state.passcode || req.body.passcode === req.state.passcode) {
    res.redirect('/')
  } else res.redirect('/?invalid')
}

export default join
