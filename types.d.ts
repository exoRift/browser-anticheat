/// <reference types="cookie-session" />

declare namespace CookieSessionInterfaces {
  interface CookieSessionObject {
    valid: boolean
    name?: string
    joinedAt: string
    sequencesServed: number
    mistakes: number
    totalBlurDuration: number
    currentlyBlurred: boolean
  }
}

declare type Session = CookieSessionInterfaces.CookieSessionObject
