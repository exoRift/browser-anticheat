import os from 'os'
import blessed from 'blessed'
import open from 'open'
import clipboardy from 'clipboardy'

import { state } from './state.ts'
import { MenuManager } from './menu.ts'

import loki from '../../../public/loki.txt' with { type: 'text' }
import { hypertext } from '../components/hypertext.ts'

const DEFAULT_PORT = 3000
const MIN_WIDTH = 85
const MIN_HEIGHT = 24
const NUMBER_FMT = Intl.NumberFormat(undefined, { maximumFractionDigits: 1 })

const interfaces = os.networkInterfaces()
let localip: string
for (const interf in interfaces) {
  const entry = interfaces[interf]?.find((i) => !i.internal && i.family === 'IPv4')

  if (entry) {
    localip = entry.address
    break
  }
}

const publicip = fetch('https://api.ipify.org')
  .then((res) => res.text())

function lanAddress (port: number): string {
  return `Your server is available on LAN at: [${localip}:${port}](http://${localip}:${port})`
}

function publicAddress (port: number): string {
  const ip = Bun.peek(publicip)
  if (ip instanceof Promise) return 'Loading public IP...'

  return `Your server is available publicly at [${ip}:${port}](http://${ip}:${port})`
}

export function deferredDestroy (node: blessed.Widgets.Node): void {
  setTimeout(() => {
    node.destroy()
    screen.render()
  })
}

export const screen = blessed.screen({
  smartCSR: true,
  title: 'Thor Anticheat'
})

export function engageSizeGuard (): void {
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
    content: 'Please increase your terminal size\nOr Press esc to exit',
    hidden: true
  })

  function escKeypress (): void {
    process.exit()
  }

  function assessSize (): void {
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
  }

  screen.on('resize', assessSize)
  setTimeout(() => {
    assessSize()
    screen.render()
  })
}

export function launch (): void {
  let pauseTableRefresh = false
  screen.on('mousedown', () => {
    if (screen.focused === players) pauseTableRefresh = true
  })
  screen.on('mouseup', () => { pauseTableRefresh = false })

  const grid = blessed.box({
    parent: screen,
    left: 0,
    top: 3,
    right: 0,
    height: '100%-3'
  })

  const menuBox = blessed.box({
    parent: grid,
    width: '33%',
    height: '50%',
    left: 0,
    right: 0
  })
  const menu = blessed.list({
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
  const menuManager = new MenuManager(screen, menu, menuBox)

  const players = blessed.listtable({
    parent: grid,
    label: ' {bold}Players{/bold} ',
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
    const avgPing = blessed.box({
      parent: box,
      tags: true,
      top: 7,
      right: 0,
      width: 'shrink',
      height: 1,
      align: 'right',
      content: 'Avg ping: {gray-fg}N/A{/gray-fg}'
    })
    const disconnects = blessed.box({
      parent: box,
      tags: true,
      top: 8,
      right: 0,
      width: 'shrink',
      height: 1,
      align: 'right',
      content: '# Disconnects: ' + meta.totalDisconnects
    })
    const served = blessed.box({
      parent: box,
      tags: true,
      top: 9,
      right: 0,
      width: 'shrink',
      height: 1,
      align: 'right',
      content: '# Served: ' + meta.sequencesServed
    })
    const mistakes = blessed.box({
      parent: box,
      tags: true,
      top: 10,
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
      avgPing.setContent(`Avg ping: ${meta.avgPing === undefined ? '{gray-fg}N/A{/gray-fg}' : `${NUMBER_FMT.format(meta.avgPing)}ms`}`)
      disconnects.setContent(`# Disconnects: ${meta.totalDisconnects}`)
      served.setContent(`# Served: ${meta.sequencesServed}`)
      mistakes.setContent(`# Mistakes: ${meta.mistakes}`)

      offtimes.setData(
        [
          ['Prior Total', 'Current Time', 'Total'],
          [
            `${NUMBER_FMT.format(meta._storedOffTime / 1000)}s`,
            meta._offSince === undefined ? '{gray-fg}N/A{/gray-fg}' : `${NUMBER_FMT.format((Date.now() - meta._offSince) / 1000)}s`,
            `${NUMBER_FMT.format(meta.totalOffTime / 1000)}s`
          ]
        ]
      )

      blurtimes.setData(
        [
          ['Prior Total', 'Current Time', 'Total'],
          [
            `${NUMBER_FMT.format(meta._storedBlurTime / 1000)}s`,
            meta._blurredSince === undefined ? '{gray-fg}N/A{/gray-fg}' : `${NUMBER_FMT.format((Date.now() - meta._blurredSince) / 1000)}s`,
            `${NUMBER_FMT.format(meta.totalBlurTime / 1000)}s`
          ]
        ]
      )

      screen.render()
    }, 50)

    function exit (): void {
      screen.removeKey('escape', exit)
      clearInterval(interval)
      list.removeAllListeners()
      players.focus()
      players.select(index)
      menuManager.locked = false
      deferredDestroy(box)
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
      commands: undefined as any,
      items: [
        ' Kick Player',
        ' Reset Standing',
        ' Close'
      ] as any,
      left: 'center',
      width: 51,
      bottom: 1,
      height: 1
    })
    list.select(2)
    list.on('select', (item: blessed.Widgets.TextElement) => {
      switch (item.content.split(' ').slice(1).join(' ')) {
        case 'Kick Player':
          console.log(`${meta.name ?? id} is kicked`)
          void state.sessions.kick(id)

          exit()
          break
        case 'Reset Standing':
          meta._storedBlurTime = 0
          meta._storedOffTime = 0
          meta.totalBlurs = 0
          meta.mistakes = 0
          meta.sequencesServed = 0
          meta.totalDisconnects =
          meta.totalInspects = 0
          meta.totalLatePings = 0
          break
        case 'Close': exit(); break
      }
    })

    screen.key('escape', exit)

    list.on('blur', () => {
      if (screen.focused !== list) list.focus()
    })

    list.focus()
    menuManager.locked = true
    screen.render()
  })

  const log = blessed.log({
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

  setInterval(() => {
    if (pauseTableRefresh) return

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
  }, 50)

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

  const ogLog = console.log
  const ogError = console.error
  const ogWarn = console.warn

  let entries = 0
  console.log = (...ls) => ls.forEach((l) => log.log(`${++entries}.`.padEnd(5) + l))
  // @bun nobuild[
  // eslint-disable-next-line no-console
  console.debug = (...ds) => ds.forEach((d) => log.log(`${++entries}.`.padEnd(5) + `{magenta-bg}{black-fg}${d}{/black-fg}{/magenta-bg}`))
  // @bun nobuild]

  // @bun nobuild[
  // Allow proper console logging for debugging purposes by using
  // ... 2> /tmp/var/err
  // and
  // tail -f /tmp/var/err
  // @ts-expect-error
  // eslint-disable-next-line
  console._error = ogError
  // @bun nobuild]

  console.error = (...es) => es.forEach((e) => log.log(`${++entries}.`.padEnd(5) + `{red-bg}{black-fg}${e}{/black-fg}{/red-bg}`))
  console.warn = (...ws) => ws.forEach((w) => log.log(`${++entries}.`.padEnd(5) + `{yellow-bg}{black-fg}${w}{/black-fg}{/yellow-bg}`))

  process.once('uncaughtException', (err) => {
    console.log = ogLog
    console.error = ogError
    console.warn = ogWarn

    screen.destroy()
    console.error(err.stack) // TEMP: https://github.com/oven-sh/bun/issues/18783
    throw err
  })

  menu.focus()
  screen.render()
}

type BlessedEvent = blessed.Widgets.Events.IMouseEventArg & blessed.Widgets.Events.IKeyEventArg

// const indicator: blessed.Widgets.TextElement & { ip?: string } = blessed.text({
//   parent: screen,
//   border: { type: 'line' },
//   tags: true,
//   top: 0,
//   left: 0,
//   right: 0,
//   height: 3
// })
// indicator.on('click', (e: BlessedEvent) => {
//   if (indicator.ip && e.x >= 13) void open(indicator.ip)
// })
// export function indicateOnline (ip?: string | Error): void {
//   if (ip) {
//     if (ip instanceof Error) {
//       indicator.ip = undefined
//       indicator.setLabel(' {bold}Status{/bold} ')
//       indicator.setContent(`{bold}ERROR{/bold} - ${ip.message}`)
//       indicator.style = {
//         fg: 'red',
//         border: { fg: 'white' }
//       }
//     } else {
//       indicator.ip = ip
//       indicator.setLabel(' {bold}Status{/bold} ')
//       indicator.setContent(`{bold}ONLINE{/bold}. IP: {underline}${ip}{/underline}`)
//       indicator.style = {
//         fg: 'green',
//         border: { fg: 'white' }
//       }
//     }
//   } else {
//     indicator.ip = undefined
//     indicator.setLabel(' {bold}Status{/bold} ')
//     indicator.setContent('{bold}OFFLINE{/bold}')
//     indicator.style = {
//       fg: 'gray',
//       border: { fg: 'white' }
//     }
//   }

//   screen.render()
// }

const explanations = {
  tunnel: 'Create a [localtunnel](https://www.npmjs.com/package/localtunnel) that will allow connections without port forwarding. Will enforce a tunnel password',
  classic: 'Host the server directly on a port. This will require port forwarding for players not on the local network',
  quit: 'Quit the application and allow cheating'
}

export type HostType = {
  type: 'classic'
  port: number
} | {
  type: 'tunnel'
  subdomain: string
}

export function promptBootScreen (): Promise<HostType> {
  return new Promise((resolve) => {
    const box = blessed.box({
      parent: screen,
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
      border: 'line',
      style: {
        border: {
          fg: 'yellow'
        }
      }
    })

    blessed.box({
      parent: box,
      top: 0,
      left: 0,
      right: 0,
      height: 1,
      align: 'center',
      bold: 'true',
      fg: 'lightyellow',
      content: 'Welcome to Thor Anticheat'
    })

    blessed.box({
      parent: box,
      top: 2,
      left: 4,
      right: 4,
      height: 4,
      align: 'center',
      content: 'Thor Anticheat is a tool meant to be used in conjunction with other software (such as a Discord call with webcams) to prevent cheating in activities such as gameshows. It reports different actions performed by players and uses basic heuristics to determine if they are cheating.'
    })

    blessed.box({
      parent: box,
      left: 0,
      right: 0,
      top: 6,
      height: (loki.match(/\n/g)?.length ?? 0) + 1,
      bold: 'true',
      align: 'center',
      fg: blessed.colors.match('#005000'),
      content: loki
    })

    blessed.box({
      parent: box,
      left: 0,
      right: 0,
      top: 8,
      height: 1,
      bold: 'true',
      align: 'center',
      content: 'How do you want players to connect to your application?'
    })

    const explanation = hypertext({
      parent: box,
      left: 0,
      right: 0,
      bottom: 3,
      height: 2,
      align: 'center',
      valign: 'bottom',
      fg: 'gray',
      content: explanations.tunnel
    })

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
      commands: undefined as any,
      items: [
        ' Tunnel',
        ' Classic',
        ' Quit'
      ] as any,
      left: 'center',
      width: 38,
      bottom: 1,
      height: 1
    })
    list.focus()

    list.on('blur', () => !list.hidden && screen.focused !== list && list.focus())

    list.on('select item', (item: blessed.Widgets.TextElement) => {
      switch (item.content.split(' ')[1]) {
        case 'Tunnel': explanation.setContent(explanations.tunnel); break
        case 'Classic': explanation.setContent(explanations.classic); break
        case 'Quit': explanation.setContent(explanations.quit); break
      }
    })

    list.on('select', (item: blessed.Widgets.TextElement) => {
      switch (item.content.split(' ')[1]) {
        case 'Classic': {
          list.hide()
          let port = DEFAULT_PORT

          const subbox = blessed.box({
            parent: box,
            top: 0,
            left: 1,
            right: 1,
            bottom: 0,
            border: 'line',
            style: {
              border: {
                fg: 'green'
              }
            }
          })
          blessed.box({
            parent: subbox,
            left: 0,
            right: 0,
            align: 'center',
            bold: 'true',
            fg: 'green',
            content: 'Classic Connection'
          })
          blessed.box({
            parent: subbox,
            top: 2,
            left: 4,
            right: 4,
            height: 4,
            align: 'center',
            content: 'A classic connection hosts the server on a port on your machine. It can easily be accessed by machines on the local network or by devices over the internet if the port is forwarded on your router'
          })

          blessed.box({
            parent: subbox,
            left: 0,
            right: 0,
            top: 7,
            height: 1,
            align: 'center',
            fg: 'gray',
            content: 'Press tab to edit port. Press enter or escape to stop editing'
          })

          const input = blessed.textbox({
            parent: subbox,
            left: 'center',
            width: 8,
            height: 1,
            top: 8,
            bottom: 0,
            align: 'center',
            bg: 'white',
            fg: 'black',
            keys: true,
            mouse: true,
            inputOnFocus: true,
            value: port.toString()
          })

          const lan = hypertext({
            parent: subbox,
            left: 0,
            right: 0,
            height: 1,
            top: 11,
            bottom: 0,
            align: 'center',
            content: lanAddress(port)
          })
          const pub = hypertext({
            parent: subbox,
            left: 0,
            right: 0,
            height: 1,
            top: 12,
            bottom: 0,
            align: 'center',
            content: publicAddress(port)
          })
          void publicip.then(() => pub.setContent(publicAddress(port)))

          input.on('keypress', () => {
            setTimeout(() => {
              const number = parseInt(input.value)
              if (!isNaN(number) && number >= 0) {
                input.style.bg = 'white'
                port = number
                lan.setContent(lanAddress(port))
                pub.setContent(publicAddress(port))
              } else {
                input.style.bg = 'red'
              }
              screen.render()
            })
          })

          function onKey (ch: any, key: blessed.Widgets.Events.IKeyEventArg): void {
            switch (key.name) {
              case 'tab': input.focus(); break
            }
          }

          const sublist = blessed.listbar({
            parent: subbox,
            bottom: 1,
            left: 'center',
            width: 23,
            height: 1,
            keys: true,
            mouse: true,
            autoCommandKeys: true,
            style: {
              selected: {
                bg: 'yellow',
                fg: 'black'
              }
            },
            commands: undefined as any,
            items: [
              ' Use',
              ' Back'
            ] as any
          })
          sublist.focus()
          sublist.on('blur', () => sublist.focusable && screen.focused !== sublist && sublist.focus())

          sublist.on('select', (item: blessed.Widgets.TextElement) => {
            switch (item.content.split(' ')[1]) {
              case 'Use':
                screen.off('keypress', onKey)
                deferredDestroy(box)
                resolve({
                  type: 'classic',
                  port
                })
                break
              case 'Back':
                screen.off('keypress', onKey)
                deferredDestroy(subbox)
                list.show()
                list.focus()
                break
            }
          })

          screen.on('keypress', onKey)
          break
        }
        case 'Tunnel': {
          list.hide()
          let subdomain = `${os.userInfo().username}-thor`

          const subbox = blessed.box({
            parent: box,
            top: 0,
            left: 1,
            right: 1,
            bottom: 0,
            border: 'line',
            style: {
              border: {
                fg: 'blue'
              }
            }
          })
          blessed.box({
            parent: subbox,
            left: 0,
            right: 0,
            align: 'center',
            bold: 'true',
            fg: 'blue',
            content: 'Localtunnel Connection'
          })

          blessed.box({
            parent: subbox,
            top: 2,
            left: 4,
            right: 4,
            height: 4,
            align: 'center',
            content: 'A connection hosted on a port reverse-proxied using localtunnel. This removes the need for port-forwarding and allows for easy setup. The chosen port doesn\'t matter as long as its available. A custom subdomain can be requested.'
          })

          blessed.box({
            parent: subbox,
            left: 0,
            right: 0,
            top: 7,
            height: 1,
            align: 'center',
            fg: 'gray',
            content: 'Press tab to edit subdomain. Press enter or escape to stop editing'
          })

          const addressBox = blessed.box({
            parent: subbox,
            left: 'center',
            width: 28,
            height: 1,
            top: 8
          })
          const input = blessed.textbox({
            parent: addressBox,
            left: 0,
            width: 20,
            height: 1,
            top: 0,
            align: 'right',
            bg: 'white',
            fg: 'black',
            keys: true,
            mouse: true,
            inputOnFocus: true,
            value: subdomain
          })
          blessed.box({
            parent: addressBox,
            left: 20,
            top: 0,
            right: 0,
            bottom: 0,
            content: '.loca.lt'
          })

          const password = blessed.box({
            parent: subbox,
            tags: true,
            left: 'center',
            width: 'shrink',
            top: 12,
            height: 1,
            align: 'center',
            content: 'Loading tunnel password...'
          })
          void publicip.then((ip) => {
            password.style.underline = true
            password.setHover('Click to copy')
            password.setContent(`Your tunnel password will be {magenta-fg}${ip}{/magenta-fg}`)
            screen.render()
            password.on('click', () => {
              void clipboardy.write(ip)
                .then(() => {
                  sublist.focus()
                  password.style.fg = 'green'
                  screen.render()
                  setTimeout(() => {
                    password.style.fg = 'white'
                    screen.render()
                  }, 500)
                })
            })
          })

          input.on('keypress', () => {
            setTimeout(() => {
              subdomain = input.value
            })
          })

          function onKey (ch: any, key: blessed.Widgets.Events.IKeyEventArg): void {
            switch (key.name) {
              case 'tab': input.focus(); break
            }
          }

          const sublist = blessed.listbar({
            parent: subbox,
            bottom: 1,
            left: 'center',
            width: 23,
            height: 1,
            keys: true,
            mouse: true,
            autoCommandKeys: true,
            style: {
              selected: {
                bg: 'yellow',
                fg: 'black'
              }
            },
            commands: undefined as any,
            items: [
              ' Use',
              ' Back'
            ] as any
          })
          sublist.focus()
          sublist.on('blur', () => sublist.focusable && screen.focused !== sublist && sublist.focus())

          sublist.on('select', (item: blessed.Widgets.TextElement) => {
            switch (item.content.split(' ')[1]) {
              case 'Use':
                screen.off('keypress', onKey)
                deferredDestroy(box)
                resolve({
                  type: 'tunnel',
                  subdomain
                })
                break
              case 'Back':
                screen.off('keypress', onKey)
                deferredDestroy(subbox)
                list.show()
                list.focus()
                break
            }
          })

          screen.on('keypress', onKey)
          break
        }
        case 'Quit': process.exit(); break
      }
    })

    screen.render()
  })
}
