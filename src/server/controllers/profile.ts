import type { Handler } from 'express'

export interface Profile {
  name?: string
}

/**
 * Get the player's profile information
 * @param req The request
 * @param res The response
 */
export const get: Handler = function get (req, res): void {
  if (!req.session) return void res.status(500).send('Session is null when it should not be').end()
  const meta = req.state.sessions.metadata.get(req.session.id)

  res
    .status(200)
    .json({
      name: meta?.name
    })
    .end()
}

/**
 * Edit the player's profile
 * @param req The request
 * @param res The response
 */
export const post: Handler = function post (req, res): void {
  if (!req.session) return void res.status(500).send('Session is null when it should not be').end()

  if (typeof req.body.name === 'string') {
    const name: string = req.body.name.trim()
    const meta = req.state.sessions.metadata.get(req.session.id)

    const nameTaken = req.state.sessions.metadata.values().some((s) => s !== meta && s.name === name)
    if (nameTaken) return res.redirect(`/profile?nametaken=${encodeURIComponent(name)}`)

    if (meta) {
      meta.name = name
      console.log(`${req.session.id} changes name to ${meta.name}`)
    }
  }

  res.redirect('/profile')
}
