/* eslint-disable new-cap */
import blessed from 'blessed'
import contrib from 'blessed-contrib'
import open from 'open'

export const screen = blessed.screen({
  smartCSR: true
})
export const grid = new contrib.grid({ screen, rows: 12, cols: 12 })
export const menu: ReturnType<typeof blessed.list> = grid.set(1.5, 0, 6, 6, blessed.list, {
  label: ' {bold}Menu{/bold} ',
  tags: true,
  keys: true,
  mouse: true,
  border: { type: 'line' },
  style: {
    selected: { bg: 'blue' },
    border: { fg: 'white' }
  },
  items: ['Set Password', 'Anticheat Settings', 'Shut Down']
} satisfies Parameters<typeof blessed.list>[0])

export const log: ReturnType<typeof blessed.log> = grid.set(7.5, 0, 5, 12, blessed.log, {
  label: ' {bold}Events{/bold} ',
  tags: true,
  keys: true,
  mouse: true,
  border: { type: 'line' },
  style: {
    selected: { bg: 'blue' },
    border: { fg: 'white' }
  }
})

screen.key('escape', () => process.exit())

export function launch (): void {
  console.log = log.log.bind(log)
  console.error = (e: string) => log.log(`{bg-red}${e}{/bg-red}`)
  menu.focus()
  screen.render()
}

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
