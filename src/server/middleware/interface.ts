/* eslint-disable new-cap */
import blessed from 'blessed'
import contrib from 'blessed-contrib'
import open from 'open'

import { state } from './state'
import { MenuManager } from './menu'

export const screen = blessed.screen({
  smartCSR: true,
  title: 'Thor Anticheat'
})
export const grid = new contrib.grid({ screen, rows: 12, cols: 12, top: 3 })
export const menu: ReturnType<typeof blessed.list> = grid.set(0, 0, 6, 4, blessed.list, {
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
export const menuManager = new MenuManager(screen, menu, grid, [0, 0, 6, 4])

export const log: ReturnType<typeof blessed.log> = grid.set(6, 0, 5, 12, blessed.log, {
  label: ' {bold}Events{/bold} ',
  tags: true,
  keys: true,
  mouse: true,
  border: { type: 'line' },
  style: {
    selected: { bg: 'blue', fg: 'black' },
    border: { fg: 'white' }
  },
  scrollable: true,
  scrollback: 50,
  bottom: 0
} satisfies Parameters<typeof blessed.log>[0])
log.height = undefined as any

export const userTable: ReturnType<typeof contrib.table> = grid.set(0, 4, 6, 8, contrib.table, {
  label: ' {bold}Players{/bold} ',
  tags: true,
  focusable: false,
  selectedBg: 'black',
  selectedFg: undefined,
  fg: 'white',
  border: { type: 'line' },
  style: {
    border: { fg: 'white' }
  },
  columnSpacing: 1,
  columnWidth: [16, 10, 10, 8, 14],
  right: 0
} satisfies Parameters<typeof contrib.table>[0])
userTable.width = undefined as any

setInterval(() => {
  userTable.setData({
    headers: ['Player', 'Served', 'Mistakes', 'Fail %', 'Standing'],
    data: Array.from(state.sessions.values()).map((s) => [
      s.name ?? '<unset>',
      s.sequencesServed.toString(),
      s.mistakes.toString(),
      s.sequencesServed ? Intl.NumberFormat(undefined, { style: 'percent' }).format(s.mistakes / s.sequencesServed) : '0%',
      s.totalBlurDuration > 10_000 ? '{yellow-fg}SUSPICIOUS{/yellow-fg}' : s.totalInspects ? '{red-fg}CHEATING{/red-fg}' : '{green-fg}Good{/green-fg}'
    ])
  })
  userTable.children.find((c): c is blessed.Widgets.ListElement => c.type === 'list')!.select(NaN) // get rid of selected formatting
  screen.render()
}, 500)

screen.key('\'', () => process.exit()) // TEMP

export function launch (): void {
  console.log = (l: string) => log.log(l)

  if (process.env.NODE_ENV === 'production') {
    console.error = (...es) => es.forEach((e) => log.log(`{red-bg}{black-fg}${e}{/black-fg}{/red-bg}`))
  } else {
    const ogError = console.error
    console.error = (...es) => { ogError(...es); es.forEach((e) => log.log(`{red-bg}{black-fg}${e}{/black-fg}{/red-bg}`)) }
  }

  menu.focus()
  screen.render()
}

const components = [menu, log]
for (const component of components) {
  component.on('focus', () => {
    if (component.style.border.fg !== 'cyan') {
      component.style.border.fg = 'cyan'
      screen.render()
    }
  })
  component.on('blur', () => {
    if (screen.focused !== component && component.style.border.fg !== 'white') {
      component.style.border.fg = 'white'
      screen.render()
    }
  })
}
screen.on('keypress', (k) => {
  if (!menuManager.locked && k === '\t') screen.focusNext()
})

type BlessedEvent = blessed.Widgets.Events.IMouseEventArg & blessed.Widgets.Events.IKeyEventArg

const indicator: blessed.Widgets.TextElement & { ip?: string } = blessed.text({
  border: { type: 'line' },
  tags: true,
  top: 0,
  left: 0,
  right: 0,
  height: 3
})
indicator.on('click', (e: BlessedEvent) => {
  if (indicator.ip && e.x >= 13) void open(indicator.ip)
})
screen.append(indicator)
export function indicateOnline (ip?: string | Error): void {
  if (ip) {
    if (ip instanceof Error) {
      indicator.ip = undefined
      indicator.setLabel(' {bold}Status{/bold} ')
      indicator.setContent(`{bold}ERROR{/bold} - ${ip.message}`)
      indicator.style = {
        fg: 'red',
        border: { fg: 'white' }
      }
    } else {
      indicator.ip = ip
      indicator.setLabel(' {bold}Status{/bold} ')
      indicator.setContent(`{bold}ONLINE{/bold}. IP: {underline}${ip}{/underline}`)
      indicator.style = {
        fg: 'green',
        border: { fg: 'white' }
      }
    }
  } else {
    indicator.ip = undefined
    indicator.setLabel(' {bold}Status{/bold} ')
    indicator.setContent('{bold}OFFLINE{/bold}')
    indicator.style = {
      fg: 'gray',
      border: { fg: 'white' }
    }
  }

  indicator.render()
  screen.render()
}
