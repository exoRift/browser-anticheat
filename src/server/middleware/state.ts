import type { Handler } from 'express'

interface State {
  passcode: string | null
}

declare module 'express-serve-static-core' {
  interface Request {
    state: State
  }
}

export const state: State = {
  passcode: null
}

export const middleware: Handler = function middleware (req, res, next): void {
  req.state = state

  next()
}
