import type { Handler } from 'express'
import { CaptchaGenerator } from 'captcha-canvas'
import fs from 'fs/promises'
import path from 'path'

const CAPTCHA_WIDTH = 800
const CAPTCHA_HEIGHT = 400
const CAPTCHA_PATH = path.resolve(process.cwd(), 'public/captchas/')

const captcha = new CaptchaGenerator({ width: CAPTCHA_WIDTH, height: CAPTCHA_HEIGHT })

const dirPromise = fs.mkdir(CAPTCHA_PATH)

interface SessionStats {
  name?: string
  joinedAt: string
  sequencesServed: number
  mistakes: number
  totalBlurDuration: number
  /** The timestamp of the active blur */
  _blurredSince: number | undefined
  totalBlurs: number
  totalInspects: number
  /** Amount of time player has been off the chosen keys */
  offTime: number
  /** The timestamp of the last update that hasn't been popped */
  _offSince: number
  _currentSequenceKeys: string | undefined
  _currentSequenceSince: number | undefined
  _currentSequenceID: string | undefined
}

interface State {
  sessions: SessionManager
  passcode: string | null
}

declare module 'express-serve-static-core' {
  interface Request {
    state: State
  }
}

class SessionManager {
  interval = 10 * 60 * 1000 /* 10 minutes */
  map = new Map<string, SessionStats>()
  intervals = new Map<string, Timer>()

  add (session: Session): void {
    this.map.set(session.id, {
      name: session.name,
      joinedAt: session.joinedAt,
      sequencesServed: 0,
      mistakes: 0,
      totalBlurDuration: 0,
      _blurredSince: undefined,
      totalBlurs: 0,
      totalInspects: 0,
      offTime: 0,
      _offSince: 0,
      _currentSequenceKeys: undefined,
      _currentSequenceSince: undefined,
      _currentSequenceID: undefined
    })

    function tick (this: SessionManager): void {
      const data = this.map.get(session.id)
      if (!data) return

      ++data.sequencesServed
      const numKeys = Math.round(Math.random() * 2 + 3)
      const buffer = new Uint8Array(numKeys)
      crypto.getRandomValues(buffer)
      const sequence = Buffer.from(buffer).toString('hex').slice(0, numKeys)

      data._offSince = Date.now()
      data._currentSequenceKeys = sequence

      this.intervals.set(session.id, setTimeout(tick.bind(this), this.interval))
    }
    tick.call(this)
  }

  /**
   * Get the standing of a session formatted for blessed
   * @param session The session
   * @returns The standing
   */
  getStanding (session: SessionStats): string {
    if (!session._currentSequenceID) return '{gray-fg}DC\'d{/gray-fg}'

    if (session.totalInspects) return '{red-fg}CHEATING{/red-fg}'
    if (session.totalBlurDuration > 10_000) return '{yellow-fg}SUSPICIOUS{/yellow-fg}'

    return '{green-fg}Good{/green-fg}'
  }

  async getSequence (id: string): Promise<string> {
    const data = this.map.get(id)
    if (!data) throw Error('Missing data from session store')

    if (data._currentSequenceID) return data._currentSequenceID
    else {
      const captchaID = Date.now().toString()
      const buffer = await captcha.generate()

      await dirPromise
      await fs.writeFile(path.resolve(CAPTCHA_PATH, captchaID), buffer)
      data._currentSequenceID = captchaID
      return id
    }
  }
}

export const state: State = {
  sessions: new SessionManager(),
  passcode: null
}

export const middleware: Handler = function middleware (req, res, next): void {
  req.state = state

  next()
}
