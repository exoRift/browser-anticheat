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
  name?: string
  joinedAt: string
  sequencesServed: number
  mistakes: number
  totalBlurDuration: number
  blurredSince: number | undefined
  totalBlurs: number
  totalInspects: number
}
