import blessed from 'blessed'
import open from 'open'

import { state } from './state.ts'
import { MenuManager } from './menu.ts'

const MIN_WIDTH = 85
const MIN_HEIGHT = 24
const NUMBER_FMT = Intl.NumberFormat(undefined, { maximumFractionDigits: 1 })

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
  if (isNaN(index) || index < 1) return
  const [id, meta] = state.sessions.metadata.entries().drop(index - 1).next().value!

  const box = blessed.box({
    parent: screen,
    border: { type: 'line' },
    style: {
      border: { fg: 'blue' }
    },
    left: 4,
    top: 4,
    right: 4,
    bottom: 4
  })

  blessed.box({
    parent: box,
    content: `<${id}>`,
    bold: 'true',
    align: 'center',
    top: 0,
    left: 0,
    right: 0,
    height: 1
  })

  const name = blessed.box({
    parent: box,
    content: meta.name ?? '<unset>',
    fg: 'gray',
    align: 'center',
    top: 1,
    left: 0,
    right: 0,
    height: 1
  })

  const standing = blessed.box({
    parent: box,
    tags: true,
    content: `[${state.sessions.getStanding(id)}]`,
    align: 'center',
    top: 2,
    left: 0,
    right: 0,
    height: 1
  })

  blessed.box({
    parent: box,
    content: `Joined at ${new Date(meta.joinedAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}`,
    fg: 'gray',
    top: 0,
    left: 0,
    width: 'shrink',
    height: 1
  })

  blessed.box({
    parent: box,
    tags: true,
    content: '{bold}Off times{/bold} - {gray-fg}Time spent with incorrect captcha{/gray-fg}',
    left: 0,
    top: 4
  })
  const offtimes = blessed.listtable({
    parent: box,
    tags: true,
    noCellBorders: true,
    interactive: false,
    pad: 1,
    style: {
      header: {
        bold: 'true',
        fg: 'blue'
      }
    },
    top: 5,
    height: 2,
    left: 0,
    right: 0
  })

  blessed.box({
    parent: box,
    tags: true,
    content: '{bold}Blur times{/bold} - {gray-fg}Time spent outside the browser{/gray-fg}',
    left: 0,
    top: 8
  })
  const blurtimes = blessed.listtable({
    parent: box,
    tags: true,
    noCellBorders: true,
    interactive: false,
    pad: 1,
    style: {
      header: {
        bold: 'true',
        fg: 'blue'
      }
    },
    top: 9,
    height: 2,
    left: 0,
    right: 0
  })

  const inspects = blessed.box({
    parent: box,
    tags: true,
    top: 4,
    right: 0,
    width: 'shrink',
    height: 1,
    align: 'right',
    content: '# Devtools Opened: ' + meta.totalInspects
  })
  const blurs = blessed.box({
    parent: box,
    tags: true,
    top: 5,
    right: 0,
    width: 'shrink',
    height: 1,
    align: 'right',
    content: '# Blurs: ' + meta.totalBlurs
  })
  const latePings = blessed.box({
    parent: box,
    tags: true,
    top: 6,
    right: 0,
    width: 'shrink',
    height: 1,
    align: 'right',
    content: '# Late Pings: ' + meta.totalLatePings
  })
  const disconnects = blessed.box({
    parent: box,
    tags: true,
    top: 7,
    right: 0,
    width: 'shrink',
    height: 1,
    align: 'right',
    content: '# Disconnects: ' + meta.totalDisconnects
  })
  const served = blessed.box({
    parent: box,
    tags: true,
    top: 8,
    right: 0,
    width: 'shrink',
    height: 1,
    align: 'right',
    content: '# Served: ' + meta.sequencesServed
  })
  const mistakes = blessed.box({
    parent: box,
    tags: true,
    top: 9,
    right: 0,
    width: 'shrink',
    height: 1,
    align: 'right',
    content: '# Mistakes: ' + meta.mistakes
  })

  const interval = setInterval(() => {
    if (meta.name) name.setContent(meta.name)
    standing.setContent(`[${state.sessions.getStanding(id)}]`)
    inspects.setContent(`# Devtools Opened: ${meta.totalInspects ? `{red-fg}${meta.totalInspects}{/red-fg}` : 0}`)
    blurs.setContent(`# Blurs: ${meta.totalBlurs ? `{yellow-fg}${meta.totalBlurs}{/yellow-fg}` : 0}`)
    latePings.setContent(`# Late Pings: ${meta.totalLatePings ? `{yellow-fg}${meta.totalLatePings}{/yellow-fg}` : 0}`)
    disconnects.setContent(`# Disconnects: ${meta.totalDisconnects}`)
    served.setContent(`# Served: ${meta.sequencesServed}`)
    mistakes.setContent(`# Mistakes: ${meta.mistakes}`)

    offtimes.setData(
      [
        ['Prior Total', 'Current Time', 'Total']
      ].concat(Array.from(state.sessions.metadata.values()).map((s) => [
        `${NUMBER_FMT.format(s._storedOffTime / 1000)}s`,
        s._offSince === undefined ? '{gray-fg}N/A{/gray-fg}' : `${NUMBER_FMT.format((Date.now() - s._offSince) / 1000)}s`,
        `${NUMBER_FMT.format(s.totalOffTime / 1000)}s`
      ]))
    )

    blurtimes.setData(
      [
        ['Prior Total', 'Current Time', 'Total']
      ].concat(Array.from(state.sessions.metadata.values()).map((s) => [
        `${NUMBER_FMT.format(s._storedBlurTime / 1000)}s`,
        s._blurredSince === undefined ? '{gray-fg}N/A{/gray-fg}' : `${NUMBER_FMT.format((Date.now() - s._blurredSince) / 1000)}s`,
        `${NUMBER_FMT.format(s.totalBlurTime / 1000)}s`
      ]))
    )

    screen.render()
  }, 50)

  let list: blessed.Widgets.ListbarElement // eslint-disable-line prefer-const

  function exit (): void {
    screen.removeKey('escape', exit)
    list.removeAllListeners()
    clearInterval(interval)
    box.hide()
    players.focus()
    setTimeout(() => box.destroy()) // UGLY: There's a crash if we don't defer the destruction
    menuManager.locked = false
    screen.render()
  }

  list = blessed.listbar({
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
      ' Kick Player': () => {
        console.log(`${meta.name ?? id} is kicked`)
        void state.sessions.kick(id)

        exit()
      },
      ' Reset Standing': () => {
        meta._storedBlurTime = 0
        meta._storedOffTime = 0
        meta.totalBlurs = 0
        meta.mistakes = 0
        meta.sequencesServed = 0
        meta.totalDisconnects =
        meta.totalInspects = 0
        meta.totalLatePings = 0
      },
      ' Close': exit
    } satisfies Record<string, () => void> as any,
    items: undefined as any,
    left: 'center',
    width: 51,
    bottom: 1,
    height: 1
  })
  list.select(2)

  screen.key('escape', exit)

  list.on('blur', () => {
    if (screen.focused !== list) list.focus()
  })

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

function escKeypress (): void {
  process.exit()
}

setInterval(() => {
  if ((screen.width as number) < MIN_WIDTH || (screen.height as number) < MIN_HEIGHT) {
    if (sizeWarning.hidden) {
      sizeWarning.setFront()
      sizeWarning.show()
      screen.key('escape', escKeypress)
    }
  } else if (!sizeWarning.hidden) {
    sizeWarning.hide()
    screen.removeKey('escape', escKeypress)
  }

  const selected = players.selected
  players.setData(
    [
      ['Player', 'Served', 'Mistks', 'Blurred', 'Off', 'Standing']
    ].concat(Array.from(state.sessions.metadata.entries()).map(([id, s]) => [
      s.name
        ? s.name.length > 20
          ? `${s.name.slice(0, 20)}...`
          : s.name
        : '<unset>',
      s.sequencesServed.toString(),
      s.mistakes.toString(),
      NUMBER_FMT.format(s.totalBlurTime / 1000) + 's',
      NUMBER_FMT.format(s.totalOffTime / 1000) + 's',
      state.sessions.getStanding(id)
    ]))
  )

  if (screen.focused === players) players.select(isNaN(selected) ? 1 : selected)
  else players.select(NaN)

  screen.render()
}, 200)

export function launch (): void {
  const ogLog = console.log
  const ogError = console.error
  const ogWarn = console.warn

  let entries = 0
  console.log = (...ls) => ls.forEach((l) => log.log(`${++entries}.`.padEnd(5) + l))
  // @bun nobuild[
  // eslint-disable-next-line no-console
  console.debug = (...ds) => ds.forEach((d) => log.log(`${++entries}.`.padEnd(5) + `{magenta-bg}{black-fg}${d}{/black-fg}{/magenta-bg}`))
  // @bun nobuild]

  console.error = (...es) => es.forEach((e) => log.log(`${++entries}.`.padEnd(5) + `{red-bg}{black-fg}${e}{/black-fg}{/red-bg}`))
  console.warn = (...ws) => ws.forEach((w) => log.log(`${++entries}.`.padEnd(5) + `{yellow-bg}{black-fg}${w}{/black-fg}{/yellow-bg}`))

  process.once('uncaughtException', (err) => {
    console.log = ogLog
    console.error = ogError
    console.warn = ogWarn

    screen.destroy()
    console.error(err.stack) // TEMP
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
screen.on('keypress', (_, key) => {
  if (!menuManager.locked && key.name === 'tab') {
    if (key.shift) screen.focusPrevious()
    else screen.focusNext()
  }
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
