/// <reference types="cookie-session" />

declare namespace CookieSessionInterfaces {
  interface CookieSessionObject {
    id: string
    valid: boolean
    name?: string
    joinedAt: string
  }
}

declare type Session = CookieSessionInterfaces.CookieSessionObject
declare interface SessionStats {
  joinedAt: string
  sequencesServed: number
  mistakes: number
  totalBlurDuration: number
  currentlyBlurred: boolean
}
