/// <reference types="cookie-session" />

declare namespace CookieSessionInterfaces {
  interface CookieSessionObject {
    valid: boolean
    name?: string
    joinedAt: string
  }
}

declare type Session = CookieSessionInterfaces.CookieSessionObject
