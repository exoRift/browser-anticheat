/* eslint-disable new-cap */
import blessed from 'blessed'
import contrib from 'blessed-contrib'
import open from 'open'

import { state } from './state.ts'
import { MenuManager } from './menu.ts'

const MIN_WIDTH = 85
const MIN_HEIGHT = 15

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
  columnWidth: [Math.round((screen.width as number) / 2) - 28, 7, 7, 8, 8, 100],
  right: 0
} satisfies Parameters<typeof contrib.table>[0])
userTable.width = undefined as any

const sizeWarning = blessed.box({
  top: 0,
  bottom: 0,
  right: 0,
  left: 0,
  bg: 'black',
  fg: 'white',
  align: 'center',
  valign: 'middle',
  content: 'Please increase your terminal size\nOr Press esc to exit'
})

function escKeypress (_: unknown, e: blessed.Widgets.Events.IKeyEventArg): void {
  if (e.name === 'escape') process.exit()
}

setInterval(() => {
  if ((screen.width as number) < MIN_WIDTH || (screen.height as number) < MIN_HEIGHT) {
    screen.append(sizeWarning)
    screen.on('keypress', escKeypress)
  } else {
    screen.remove(sizeWarning)
    screen.off('keypress', escKeypress)
  }

  userTable.options.columnWidth = [Math.round((screen.width as number) / 2) - 28, 7, 7, 8, 8, 100]
  userTable.setData({
    headers: ['Player', 'Served', 'Mistks', 'Blurred', 'Off', 'Standing'],
    data: Array.from(state.sessions.metadata.entries()).map(([id, s]) => [
      s.name ?? '<unset>',
      s.sequencesServed.toString(),
      s.mistakes.toString(),
      Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(s.totalBlurTime / 1000) + 's',
      Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(s.totalOffTime / 1000) + 's',
      state.sessions.getStanding(id)
    ])
  })
  userTable.children.find((c): c is blessed.Widgets.ListElement => c.type === 'list')!.select(NaN) // get rid of selected formatting
  screen.render()
}, 500)

screen.key('\'', () => process.exit()) // TEMP

export function launch (): void {
  console.log = (l: string) => log.log(l)

  // console.error = (...es) => es.forEach((e) => log.log(`{red-bg}{black-fg}${e}{/black-fg}{/red-bg}`))
  // console.warn = (...es) => es.forEach((e) => log.log(`{yellow-bg}{black-fg}${e}{/black-fg}{/yellow-bg}`))

  menu.focus()
  screen.render()
}

const components = [menu, log]
for (const component of components) {
  component.on('focus', () => {
    if (screen.focused === component && component.style.border.fg !== 'cyan') {
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
