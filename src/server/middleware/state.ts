import type { Handler } from 'express'
import { CaptchaGenerator } from 'captcha-canvas'
import { rmSync } from 'fs'
import fs from 'fs/promises'
import path from 'path'
import type * as ws from 'ws'

const CAPTCHA_WIDTH = 800
const CAPTCHA_HEIGHT = 400
const CAPTCHA_SIZE = 30
const COLORS = ['deeppink', 'green']
const CAPTCHA_CHARACTERS_LEFT = '1QAZ2WSX3EDC4RFV5TGB'
const CAPTCHA_CHARACTERS_RIGHT = '6YHN7UJM8IK9OLP'
export const CAPTCHA_PATH = path.resolve(process.cwd(), '_captchas/')

const dirPromise = fs.mkdir(CAPTCHA_PATH, { recursive: true })
process.once('exit', () => rmSync(CAPTCHA_PATH, { recursive: true }))

interface SessionStats {
  name?: string
  joinedAt: string
  sequencesServed: number
  mistakes: number
  totalBlurTime: number
  /** The timestamp of the active blur */
  _blurredSince: number | undefined
  totalBlurs: number
  totalInspects: number
  /** Amount of time player has been off the chosen keys */
  totalOffTime: number
  /** The timestamp of the last update that hasn't been popped */
  _offSince: number | undefined
  _heldKeys: Set<string>
  _currentSequenceSince: number | undefined
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
  metadata = new Map<string, SessionStats>()
  intervals = new Map<string, Timer>()
  captchas = new CaptchaManager()
  sockets = new Map<string, ws.WebSocket>()

  add (session: Session): void {
    this.metadata.set(session.id, {
      name: session.name,
      joinedAt: session.joinedAt,
      sequencesServed: 0,
      mistakes: 0,
      totalBlurTime: 0,
      totalBlurs: 0,
      _blurredSince: undefined,
      totalInspects: 0,
      totalOffTime: 0,
      _offSince: undefined,
      _heldKeys: new Set(),
      _currentSequenceSince: undefined
    })
  }

  registerSocket (session: Session, socket: ws.WebSocket): void {
    this.sockets.set(session.id, socket)
    socket.addEventListener('close', () => this.sockets.delete(session.id), { once: true })

    socket.on('message', (msg) => {
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      const [command, data] = msg.toString().split(':')

      const meta = this.metadata.get(session.id)
      const captcha = this.captchas.map.get(session.id)
      if (!meta) {
        socket.terminate()
        return
      }

      switch (command) {
        case 'SEQUENCE': {
          console.log(`${meta.name} requested a new captcha`)
          void this.generateNewSequenceForSession(session)
          break
        }
        case 'DOWN': {
          if (!captcha) break
          if (data.length > 1) {
            socket.send('ERROR:BAD DATA')
            break
          }
          const key = data.toUpperCase()

          if (captcha.sequence.has(key)) socket.send(`CORRECT:${key}`)
          else {
            console.log(`${meta.name} made a mistake`)
            ++meta.mistakes
            socket.send(`INCORRECT:${key}`)
          }

          meta._heldKeys.add(key)

          break
        }
        case 'UP': {
          if (!captcha) break
          if (data.length > 1) {
            socket.send('ERROR:BAD DATA')
            break
          }
          const key = data.toUpperCase()

          meta._heldKeys.delete(key)

          break
        }
      }

      if (captcha) {
        if (meta._heldKeys.symmetricDifference(captcha.sequence).size) {
          if (meta._offSince === undefined) meta._offSince = Date.now()
        } else {
          meta.totalOffTime += Date.now() - (meta._offSince ?? 0)
          meta._offSince = undefined
          socket.send('COMPLETE')
        }
      }
    })
  }

  async generateNewSequenceForSession (session: Session): Promise<void> {
    clearTimeout(this.intervals.get(session.id))
    const data = this.metadata.get(session.id)
    const socket = this.sockets.get(session.id)
    if (!data || !socket) return

    const oldCaptchaID = this.captchas.map.get(session.id)
    if (oldCaptchaID) void fs.unlink(path.resolve(CAPTCHA_PATH, oldCaptchaID.id + '.png'))

    const captcha = await this.captchas.generateCaptcha(session.id)
    ++data.sequencesServed
    data._offSince = Date.now()
    data._currentSequenceSince = Date.now()
    socket.send('SEQUENCE:' + captcha.id)

    this.intervals.set(session.id, setTimeout(() => {
      console.log('Auto-generated new captcha for ' + (data.name ?? 'MISSING NAME'))
      void this.generateNewSequenceForSession(session)
    }, this.interval))
  }

  /**
   * Get the standing of a session formatted for blessed
   * @param id The session ID
   * @returns The standing
   */
  getStanding (id: string): string {
    const data = this.metadata.get(id)
    if (!this.captchas.map.has(id) || !data) return '{gray-fg}DC\'d{/gray-fg}'

    if (data.totalInspects) return '{red-fg}CHEATING{/red-fg}'
    if (data.totalBlurTime > 10_000) return '{yellow-fg}SUSPICIOUS{/yellow-fg}'

    return '{green-fg}Good{/green-fg}'
  }
}

interface Captcha {
  id: string
  sequence: Set<string>
}
class CaptchaManager {
  map = new Map<string, Captcha>()

  static generateSequence (): Set<string> {
    const numKeys = Math.round(Math.random() * 2 + 3)
    const sequence = new Set<string>()
    while (sequence.size < numKeys) {
      const characterPool = Math.random() > 0.5 ? CAPTCHA_CHARACTERS_LEFT : CAPTCHA_CHARACTERS_RIGHT
      const char = characterPool[Math.round(Math.random() * (characterPool.length - 1))]

      sequence.add(char)
    }

    return sequence
  }

  async generateCaptcha (sessionID: string): Promise<Captcha> {
    const id = Date.now().toString()
    const color = COLORS[Math.round(Math.random() * (COLORS.length - 1))]

    const sequence = CaptchaManager.generateSequence()
    const captcha = new CaptchaGenerator()
      .setDimension(CAPTCHA_HEIGHT, CAPTCHA_WIDTH)
      .setCaptcha({
        text: Array.from(sequence).join(''),
        size: CAPTCHA_SIZE,
        color,
        font: 'monospace'
      })
      .setDecoy({
        color,
        opacity: 0.8
      })
      .setTrace({
        color,
        opacity: 0.2
      })
    const buffer = await captcha.generate()

    await dirPromise
    await fs.writeFile(path.resolve(CAPTCHA_PATH, id + '.png'), buffer)

    const obj = {
      sequence,
      id
    }
    this.map.set(sessionID, obj)
    return obj
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
