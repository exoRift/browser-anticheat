import type { Handler } from 'express'
import path from 'path'

import { CAPTCHA_PATH } from '../middleware/state'

/**
 * Get the player's active captcha (image buffer)
 * @param req The request
 * @param res The response
 */
export const get: Handler = function get (req, res): void {
  if (!req.session) return void res.status(500).send('Session is null when it should not be').end()

  const id = req.params.id!
  const filename = path.resolve(CAPTCHA_PATH, id + '.png')
  return res.sendFile(filename, (e: Error | undefined) => {
    if (e) res.status(404).send('Captcha not found').end()
  })
}
