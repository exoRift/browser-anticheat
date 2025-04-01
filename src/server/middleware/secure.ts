import type { Handler } from 'express'

export const secure = function secure (secureRoutes: string[], secureFallback: string, insecureRoutes: string[], insecureFallback: string): Handler {
  return function (req, res, next) {
    if (req.session && !req.session.id) req.session.id = Date.now().toString()
    if (req.session?.valid && !req.state.sessions.metadata.has(req.session.id)) {
      req.session = null
      return res.redirect('/')
    }

    if (secureRoutes.includes(req.originalUrl) && !req.session?.valid) {
      req.session = null
      return res.redirect(secureFallback)
    } else if (insecureRoutes.includes(req.originalUrl) && req.session?.valid) {
      return res.redirect(insecureFallback)
    }

    next()
  }
}
