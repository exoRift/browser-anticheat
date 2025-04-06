/// <reference types="cookie-session" />

import type expressWs from 'express-ws'

declare module 'express-serve-static-core' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Application extends expressWs.Router {}
}

declare global {
  namespace CookieSessionInterfaces {
    interface CookieSessionObject {
      id: string
      valid: boolean
    }
  }

  type Session = CookieSessionInterfaces.CookieSessionObject
}
