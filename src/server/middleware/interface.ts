/* eslint-disable new-cap */
import blessed from 'blessed'
import contrib from 'blessed-contrib'
import open from 'open'

import { MenuManager } from './menu'

export const screen = blessed.screen({
  smartCSR: true,
  title: 'Thor Anticheat'
})
export const grid = new contrib.grid({ screen, rows: 12, cols: 12 })
export const menu: ReturnType<typeof blessed.list> = grid.set(1.5, 0, 6, 6, blessed.list, {
  label: ' {bold}Menu{/bold} ',
  tags: true,
  keys: true,
  mouse: true,
  border: { type: 'line' },
  style: {
    selected: { bg: 'blue', fg: 'black' },
    border: { fg: 'white' }
  }
} satisfies Parameters<typeof blessed.list>[0])
export const menuManager = new MenuManager(screen, menu, grid, [1.5, 0, 6, 6])

export const log: ReturnType<typeof blessed.log> = grid.set(7.5, 0, 5, 12, blessed.log, {
  label: ' {bold}Events{/bold} ',
  tags: true,
  keys: true,
  mouse: true,
  border: { type: 'line' },
  style: {
    selected: { bg: 'blue' },
    border: { fg: 'white' }
  },
  scrollable: true,
  scrollback: 50
} satisfies Parameters<typeof blessed.log>[0])

screen.key('\'', () => process.exit()) // TEMP

export function launch (): void {
  console.log = (l: string) => log.log(l)

  if (process.env.NODE_ENV === 'production') console.error = (e: string) => log.log(`{red-bg}${e}{/red-bg}`)
  else {
    const ogError = console.error
    console.error = (e: string) => { ogError(e); log.log(`{red-bg}{black-fg}${e}{/black-fg}{/red-bg}`) }
  }

  menu.focus()
  screen.render()
}

const components = [menu, log]
for (const component of components) {
  component.on('focus', () => {
    component.style.border.fg = 'cyan'
    screen.render()
  })
  component.on('blur', () => {
    component.style.border.fg = 'white'
    screen.render()
  })
}
screen.on('keypress', (k) => {
  if (!menuManager.locked && k === '\t') screen.focusNext()
})

type BlessedEvent = blessed.Widgets.Events.IMouseEventArg & blessed.Widgets.Events.IKeyEventArg

export function indicateOnline (ip?: string | Error): void {
  let options: Parameters<typeof blessed.text>[0]

  if (ip) {
    if (ip instanceof Error) {
      options = {
        label: ' {bold}Status{/bold} ',
        content: `{bold}ERROR{/bold} - ${ip.message}`,
        tags: true,
        border: { type: 'line' },
        style: {
          fg: 'red',
          border: { fg: 'white' }
        }
      }
    } else {
      options = {
        label: ' {bold}Status{/bold} ',
        content: `{bold}ONLINE{/bold}. IP: {underline}${ip}{/underline}`,
        tags: true,
        border: { type: 'line' },
        style: {
          fg: 'green',
          border: { fg: 'white' }
        }
      }
    }
  } else {
    options = {
      label: ' {bold}Status{/bold} ',
      content: '{bold}OFFLINE{/bold}',
      tags: true,
      border: { type: 'line' },
      style: {
        fg: 'gray',
        border: { fg: 'white' }
      }
    }
  }

  const text: ReturnType<typeof blessed.text> = grid.set(0, 0, 1.5, 12, blessed.text, options)
  if (typeof ip === 'string') {
    text.on('click', (e: BlessedEvent) => {
      if (e.x >= 13) void open(ip)
    })
  }

  screen.render()
}
