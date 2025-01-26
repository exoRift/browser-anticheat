import send from '@polka/send-type'
import type { Middleware } from 'polka'

declare module 'express-serve-static-core' {
  interface Response {
    sendt: (status: number, content?: any) => void
  }
}

export const sendType: Middleware = (req, res, next) => {
  res.sendt = function (status: number, content: any) {
    send(this, status, content)
  }

  next()
}
