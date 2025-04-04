import blessed from 'blessed'
import open from 'open'

import { state } from './state.ts'
import { MenuManager } from './menu.ts'

const MIN_WIDTH = 85
const MIN_HEIGHT = 15

export const screen = blessed.screen({
  smartCSR: true,
  title: 'Thor Anticheat'
})

export const grid = blessed.box({
  parent: screen,
  left: 0,
  top: 3,
  right: 0,
  height: '100%-3'
})

export const menuBox = blessed.box({
  parent: grid,
  width: '33%',
  height: '50%',
  left: 0,
  right: 0
})
export const menu = blessed.list({
  parent: menuBox,
  label: ' {bold}Menu{/bold} ',
  tags: true,
  keys: true,
  mouse: true,
  border: { type: 'line' },
  style: {
    selected: { bg: 'blue', fg: 'black' },
    border: { fg: 'white' }
  },
  top: 0,
  left: 0,
  right: 0,
  bottom: 0
})
export const menuManager = new MenuManager(screen, menu, menuBox)

export const players = blessed.listtable({
  parent: grid,
  tags: true,
  keys: true,
  mouse: true,
  clickable: true,
  noCellBorders: true,
  invertSelected: false,
  pad: 1,
  border: { type: 'line' },
  style: {
    border: { fg: 'white' },
    header: {
      fg: 'blue',
      bold: true
    },
    cell: {
      selected: {
        bg: 'gray'
      }
    }
  },
  scrollbar: {
    ch: ' ',
    track: {
      bg: 'gray'
    },
    style: {
      inverse: true
    }
  },
  left: '33%',
  top: 0,
  right: 0,
  height: '50%'
})

players.on('select', (item, index) => {
  if (index < 1) return
  const [id, meta] = state.sessions.metadata.entries().drop(index - 1).next().value!

  const box = blessed.box({
    parent: screen,
    border: { type: 'line' },
    style: {
      border: { fg: 'blue' }
    }
  })

  function exit (): void {
    box.hide()
    players.focus()
    setTimeout(() => box.destroy()) // UGLY: There's a crash if we don't defer the destruction
    menuManager.locked = false
    screen.render()
  }

  const list = blessed.listbar({
    parent: box,
    keys: true,
    mouse: true,
    autoCommandKeys: true,
    style: {
      selected: {
        bg: 'yellow',
        fg: 'black'
      }
    },
    commands: {
      'Reset Standing': () => {
        meta._storedBlurTime = 0
        meta._storedOffTime = 0
        meta.mistakes = 0
        meta.sequencesServed = 0
        meta.totalDisconnects =
        meta.totalInspects = 0
        meta.totalLatePings = 0
        exit()
      },
      Close: exit
    } satisfies Record<string, () => void> as any,
    items: undefined as any,
    left: 'center',
    width: 'shrink',
    bottom: 1,
    height: 1
  })
  list.select(1)

  list.focus()
  menuManager.locked = true
  screen.render()
})

export const log = blessed.log({
  parent: grid,
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
  scrollback: 400,
  scrollbar: {
    ch: ' ',
    track: {
      bg: 'grey'
    },
    style: {
      bg: 'blue'
    }
  },
  left: 0,
  right: 0,
  top: '50%',
  bottom: 0
})

const sizeWarning = blessed.box({
  parent: screen,
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
sizeWarning.hide()

function escKeypress (_: unknown, e: blessed.Widgets.Events.IKeyEventArg): void {
  if (e.name === 'escape') process.exit()
}

setInterval(() => {
  if ((screen.width as number) < MIN_WIDTH || (screen.height as number) < MIN_HEIGHT) {
    if (sizeWarning.hidden) {
      sizeWarning.show()
      screen.on('keypress', escKeypress)
    }
  } else if (!sizeWarning.hidden) {
    sizeWarning.hide()
    screen.off('keypress', escKeypress)
  }

  const selected = players.selected
  players.setData(
    [
      ['Player', 'Served', 'Mistks', 'Blurred', 'Off', 'Standing']
    ].concat(Array.from(state.sessions.metadata.entries()).map(([id, s]) => [
      s.name ?? '<unset>',
      s.sequencesServed.toString(),
      s.mistakes.toString(),
      Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(s.totalBlurTime / 1000) + 's',
      Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(s.totalOffTime / 1000) + 's',
      state.sessions.getStanding(id)
    ]))
  )

  if (screen.focused === players) players.select(isNaN(selected) ? 1 : selected)
  else players.select(NaN)

  screen.render()
}, 50)

// TODO: delete
screen.key('\'', () => process.exit()) // TEMP

export function launch (): void {
  const ogLog = console.log
  const ogError = console.error
  const ogWarn = console.warn

  let entries = 0
  console.log = (l: string) => log.log(`${++entries}. ${l}`)

  console.error = (...es) => es.forEach((e) => log.log(`${++entries}. {red-bg}{black-fg}${e}{/black-fg}{/red-bg}`))
  console.warn = (...ws) => ws.forEach((w) => log.log(`${++entries}. {yellow-bg}{black-fg}${w}{/black-fg}{/yellow-bg}`))

  process.once('uncaughtException', (err) => {
    console.log = ogLog
    console.error = ogError
    console.warn = ogWarn

    // TEMP
    console.error(err.stack)
    throw err
  })

  menu.focus()
  screen.render()
}

const components = [menu, log, players]
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
  parent: screen,
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

  screen.render()
}
