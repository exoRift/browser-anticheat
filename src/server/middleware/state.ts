import type { Handler } from 'express'
import { CaptchaGenerator } from 'captcha-canvas'
import { rmSync } from 'fs'
import fs from 'fs/promises'
import path from 'path'
import type * as ws from 'ws'

const CAPTCHA_WIDTH = 800
const CAPTCHA_HEIGHT = 400
const CAPTCHA_SIZE = 30
const COLORS = ['deeppink', 'orange', 'skyblue', 'mediumspringgreen', 'salmon']
const CAPTCHA_CHARACTERS_LEFT = '1QAZ2WSX3EDC4RFV5TGB'
const CAPTCHA_CHARACTERS_RIGHT = '6YHN7UJM8IK9OLP'
export const CAPTCHA_PATH = path.resolve(process.cwd(), '_captchas/')

const dirPromise = fs.mkdir(CAPTCHA_PATH, { recursive: true })
process.once('exit', () => rmSync(CAPTCHA_PATH, { recursive: true }))

interface SessionStats {
  name?: string
  joinedAt: number
  sequencesServed: number
  mistakes: number
  _storedBlurTime: number
  totalBlurTime: number
  /** The timestamp of the active blur */
  _blurredSince: number | undefined
  totalBlurs: number
  totalInspects: number
  /** Amount of time player has been off the chosen keys */
  _storedOffTime: number
  totalOffTime: number
  /** The timestamp of the last update that hasn't been popped */
  _offSince: number | undefined
  _heldKeys: Set<string>
  _currentSequenceSince: number | undefined
  _lastPingSince: number | undefined
  totalLatePings: number
  avgPing: number | undefined
  _numPings: number
  totalDisconnects: number
}

interface State {
  sessions: SessionManager
  passcode: string | null
  captchaInterval: number
  pingInterval: number
  pingThreshold: number
  captchaMinCharacters: number
  captchaMaxCharacters: number
}

declare module 'express-serve-static-core' {
  interface Request {
    state: State
  }
}

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
class SecureRandom {
  static POOL_SIZE = 64
  static pool = new Uint32Array(this.POOL_SIZE)
  static index = this.pool.length - 1
  static randomFloat (): number {
    if (this.index >= this.pool.length - 1) {
      crypto.getRandomValues(this.pool)
      this.index = 0
    }

    return this.pool[this.index++]! / 0xFFFFFFFF
  }

  static randomInt (min: number, max: number): number {
    return Math.round(this.randomFloat() * (max - min) + min)
  }
}

class SessionManager {
  private readonly captchaTimeouts = new Map<string, Timer>()
  private readonly pingIntervals = new Map<string, Timer>()
  private readonly captchas = new CaptchaManager()
  private readonly sockets = new Map<string, ws.WebSocket>()
  readonly metadata = new Map<string, SessionStats>()

  add (session: Session): void {
    this.metadata.set(session.id, {
      name: session.name,
      joinedAt: Date.now(),
      sequencesServed: 0,
      mistakes: 0,
      _storedBlurTime: 0,
      get totalBlurTime () {
        let amnt = this._storedBlurTime
        if (this._blurredSince !== undefined) amnt += Date.now() - this._blurredSince
        return amnt
      },
      totalBlurs: 0,
      _blurredSince: undefined,
      totalInspects: 0,
      _storedOffTime: 0,
      get totalOffTime () {
        let amnt = this._storedOffTime
        if (this._offSince !== undefined) amnt += Date.now() - this._offSince
        return amnt
      },
      _offSince: undefined,
      _heldKeys: new Set(),
      _currentSequenceSince: undefined,
      _lastPingSince: undefined,
      totalLatePings: 0,
      avgPing: undefined,
      _numPings: 0,
      totalDisconnects: 0
    })
  }

  registerSocket (session: Session, socket: ws.WebSocket): void {
    this.sockets.set(session.id, socket)
    socket.once('close', () => {
      this.sockets.delete(session.id)
      clearInterval(this.pingIntervals.get(session.id))
      this.pingIntervals.delete(session.id)
      const meta = this.metadata.get(session.id)

      meta?._heldKeys.clear()

      if (meta) {
        ++meta.totalDisconnects

        if (meta._blurredSince) meta._storedBlurTime += Date.now() - meta._blurredSince
        meta._blurredSince = undefined

        if (meta._offSince !== undefined) meta._storedOffTime += Date.now() - meta._offSince
        meta._offSince = undefined
      }

      console.warn(`${meta?.name ?? session.id} disconnects`)
    })

    this.pingIntervals.set(session.id, setInterval(() => {
      const meta = this.metadata.get(session.id)
      if (!meta) {
        clearInterval(this.pingIntervals.get(session.id))
        this.pingIntervals.delete(session.id)
        return
      }
      if (meta._lastPingSince !== undefined) return

      socket.ping()
      meta._lastPingSince = Date.now()
      socket.once('pong', () => {
        if (meta._lastPingSince === undefined) return
        const latency = Date.now() - meta._lastPingSince
        meta.avgPing = meta.avgPing === undefined
          ? latency
          : ((meta.avgPing * meta._numPings) + latency) / ++meta._numPings

        if (latency > state.pingThreshold) {
          ++meta.totalLatePings
          console.warn(`${meta.name} pinged late!`)
        }

        meta._lastPingSince = undefined
      })
    }, state.pingInterval))

    socket.on('message', (msg) => {
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      const [command, data] = msg.toString().split(':') as [string, string]

      const meta = this.metadata.get(session.id)
      const captcha = this.captchas.assigned.get(session.id)
      if (!meta) {
        socket.terminate()
        return
      }

      switch (command) {
        case 'SEQUENCE': {
          console.log(`${meta.name} requests a new captcha`)
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
            console.log(`${meta.name} makes a mistake`)
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
        case 'INSPECT':
          ++meta.totalInspects
          console.error(`${meta.name} opens the devtools`)

          break
        case 'BLUR':
          meta._heldKeys.clear()
          console.warn(`${meta.name} blurs the window`)

          if (meta._blurredSince === undefined) meta._blurredSince = Date.now()
          ++meta.totalBlurs

          break
        case 'FOCUS':
          console.log(`${meta.name} refocuses the window`)

          if (meta._blurredSince) meta._storedBlurTime += Date.now() - meta._blurredSince
          meta._blurredSince = undefined

          break
      }

      if (captcha && ['DOWN', 'UP'].includes(command)) {
        if (meta._heldKeys.symmetricDifference(captcha.sequence).size) {
          if (meta._offSince === undefined) {
            meta._offSince = Date.now()
            console.log(`${meta.name} breaks the captcha`)
          }
        } else {
          if (meta._offSince !== undefined) meta._storedOffTime += Date.now() - meta._offSince
          meta._offSince = undefined
          console.log(`${meta.name} completes the captcha`)
          socket.send('COMPLETE')
        }
      }
    })
  }

  async generateNewSequenceForSession (session: Session): Promise<void> {
    clearTimeout(this.captchaTimeouts.get(session.id))
    const data = this.metadata.get(session.id)
    const socket = this.sockets.get(session.id)

    const oldCaptchaID = this.captchas.assigned.get(session.id)
    if (oldCaptchaID) void fs.unlink(path.resolve(CAPTCHA_PATH, oldCaptchaID.id + '.png'))

    if (!data || !socket) {
      this.captchas.assigned.delete(session.id)
      return
    }

    const captcha = await this.captchas.generateCaptcha(session.id)
    ++data.sequencesServed
    data._offSince = Date.now()
    data._currentSequenceSince = Date.now()
    socket.send('SEQUENCE:' + captcha.id)

    this.captchaTimeouts.set(session.id, setTimeout(() => {
      console.log('Auto-generating a new captcha for ' + (data.name ?? session.id))
      void this.generateNewSequenceForSession(session)
    }, state.captchaInterval))
  }

  /**
   * Get the standing of a session formatted for blessed
   * @param id The session ID
   * @returns The standing
   */
  getStanding (id: string): string {
    const data = this.metadata.get(id)
    if (!this.captchas.assigned.has(id) || !data || !this.sockets.has(id)) return '{gray-fg}DC\'d{/gray-fg}'

    if (data.totalInspects) return '{red-fg}CHEATING{/red-fg}'
    if (data._blurredSince !== undefined) return '{bright-red-fg}Blurred{/bright-red-fg}'
    if (data.totalBlurTime > 10_000) return '{yellow-fg}SUSPICIOUS{/yellow-fg}'
    if (data.totalBlurs > 6) return '{yellow-fg}SUSPICIOUS{/yellow-fg}'
    if (data.totalLatePings > 5) return '{yellow-fg}SUSPICIOUS{/yellow-fg}'
    if (data.totalOffTime > 14_000) {
      if (data._offSince && !data._heldKeys.size) return '{yellow-fg}Idle{/yellow-fg}'
      else return '{yellow-fg}SUSPICIOUS{/yellow-fg}'
    }
    if (data.totalDisconnects > 4) return '{yellow-fg}SUSPICIOUS{/yellow-fg}'
    if (data.mistakes > 10) return '{yellow-fg}Clumsy{/yellow-fg}'

    return '{green-fg}Good{/green-fg}'
  }

  kick (id: string): Promise<void> {
    const socket = this.sockets.get(id)
    socket?.send('ERROR:You\'ve been kicked by the host')
    socket?.close()
    this.sockets.delete(id)
    this.metadata.delete(id)
    clearTimeout(this.captchaTimeouts.get(id))
    this.captchaTimeouts.delete(id)
    return this.captchas.removeCaptcha(id)
  }
}

interface Captcha {
  id: string
  sequence: Set<string>
}
class CaptchaManager {
  /** Captchas assigned to players */
  readonly assigned = new Map<string, Captcha>()

  static generateSequence (): Set<string> {
    const numKeys = SecureRandom.randomInt(state.captchaMinCharacters, state.captchaMaxCharacters)
    const sequence = new Set<string>()
    while (sequence.size < numKeys) {
      const characterPool = SecureRandom.randomFloat() > 0.5 ? CAPTCHA_CHARACTERS_LEFT : CAPTCHA_CHARACTERS_RIGHT

      const char = characterPool[SecureRandom.randomInt(0, characterPool.length - 1)]!

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
    this.assigned.set(sessionID, obj)
    return obj
  }

  async removeCaptcha (sessionID: string): Promise<void> {
    const captcha = this.assigned.get(sessionID)

    if (captcha) {
      this.assigned.delete(sessionID)
      return await fs.unlink(path.resolve(CAPTCHA_PATH, captcha.id + '.png'))
    }
  }
}

export const state: State = {
  sessions: new SessionManager(),
  passcode: null,
  captchaInterval: 10 * 60 * 1000, /* 10 minutes */
  captchaMinCharacters: 4,
  captchaMaxCharacters: 6,
  pingInterval: 1000,
  pingThreshold: 400
}

export const middleware: Handler = function middleware (req, res, next): void {
  req.state = state

  next()
}
