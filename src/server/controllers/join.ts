import type { Handler } from 'express'

const join: Handler = function (req, res) {
  process.exit(1)
  console._error('bruh')
  console._error(req.body)

  res.redirect('/')
}

export default join
