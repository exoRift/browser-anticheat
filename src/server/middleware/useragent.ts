import type { Handler } from 'express'
import { UAParser as uap } from 'ua-parser-js'

export const middleware: Handler = async function middleware (req, res, next): Promise<void> {
  const agent = await uap(req.headers).withClientHints()

  if (!agent.browser.name) res.status(418).send('bruh')
  else next()
}
