import type { Handler } from 'express'

interface State {
  sessions: Map<string, SessionStats>
  passcode: string | null
}

declare module 'express-serve-static-core' {
  interface Request {
    state: State
  }
}

export const state: State = {
  sessions: new Map(),
  passcode: null
}

export const middleware: Handler = function middleware (req, res, next): void {
  req.state = state

  next()
}
