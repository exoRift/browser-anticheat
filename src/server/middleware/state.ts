import type { Handler } from 'express'

interface State {
  sessions: Session[]
  passcode: string | null
}

declare module 'express-serve-static-core' {
  interface Request {
    state: State
  }
}

export const state: State = {
  sessions: [],
  passcode: null
}

export const middleware: Handler = function middleware (req, res, next): void {
  req.state = state
  if (req.session?.valid && !state.sessions.includes(req.session)) {
    req.session = null
    res.redirect('/')
    return
  }

  next()
}
