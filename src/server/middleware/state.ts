import type { Handler } from 'express'

declare module 'express-serve-static-core' {
  interface Request {
    state: {
      password: string | null
    }
  }
}

const state: Handler = function state (req, res, next): void {
  req.state = {
    password: null
  }

  next()
}

export default state
