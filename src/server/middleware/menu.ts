import blessed from 'blessed'

import { numberInput } from '../components/number_input.ts'
import { state } from './state.ts'

export type Option = {
  type: 'action'
  name: string
  action: (menu: MenuManager) => void
} | {
  type: 'submenu'
  name: string
  options: Option[]
}

export const options: Option[] = [
  {
    type: 'action',
    name: 'Set Password',
    action: (menu) => {
      const input = blessed.textbox({
        parent: menu.box,
        border: {
          type: 'line'
        },
        style: {
          fg: 'white',
          border: {
            fg: 'cyan'
          }
        },
        inputOnFocus: true,
        top: 0,
        height: 3,
        left: 0,
        right: 0
      })
      if (state.passcode) input.setValue(state.passcode)

      const placeholder = blessed.text({
        parent: input,
        style: {
          fg: 'gray'
        },
        inputOnFocus: true,
        content: 'Enter Password Here',
        top: 0,
        left: 0,
        right: 0,
        height: 0
      })

      const list = blessed.list({
        parent: menu.box,
        mouse: true,
        items: ['Set Password', 'Clear Password', 'Cancel'],
        border: {
          type: 'line'
        },
        style: {
          fg: 'white',
          bg: 'black',
          border: {
            fg: 'cyan'
          },
          item: {
            fg: 'white',
            bg: 'black'
          },
          selected: {
            fg: 'black',
            bg: 'yellow'
          }
        },
        top: 3,
        bottom: 0,
        left: 0,
        right: 0
      })

      input.focus()

      function renderPlaceholder (): void {
        const empty = !input.value.length
        if (empty) placeholder.show()
        else placeholder.hide()
      }
      renderPlaceholder()

      function exit (): void {
        input.destroy()
        list.destroy()
        placeholder.destroy()
        menu.list.show()
        menu.locked = false
        menu.list.focus()
      }

      list.on('select', (item) => {
        switch (item.getText()) {
          case 'Set Password': state.passcode = input.value; break
          case 'Clear Password': state.passcode = null; break
        }

        exit()
      })

      input.on('keypress', (ch, key: blessed.Widgets.Events.IKeyEventArg) => {
        switch (key.name) {
          case 'up': list.up(1); break
          case 'down': list.down(1); break
          case 'enter': list.emit('select', list.getItem(list.selected), list.selected); break
          case 'escape': exit(); break
        }
        setTimeout(() => {
          renderPlaceholder()
          menu.screen.render()
        })
        menu.screen.render()
      })

      menu.locked = true
      menu.list.hide()
      menu.screen.render()
    }
  },
  {
    type: 'submenu',
    name: 'Anticheat Settings',
    options: [
      {
        type: 'action',
        name: 'Captcha Update Interval',
        action: (menu) => {
          const header = blessed.box({
            parent: menu.box,
            align: 'center',
            height: 1,
            top: 0,
            left: 0,
            right: 0,
            fg: 'blue',
            content: 'Captcha Update Interval'
          })

          const unit = blessed.box({
            parent: menu.box,
            align: 'center',
            height: 1,
            top: 1,
            left: 0,
            right: 0,
            bold: 'true',
            content: 'Time in minutes'
          })

          const [box, input] = numberInput({
            parent: menu.box,
            top: 2,
            value: state.captchaInterval / 60_000,
            forcePositive: true,
            onExit: (v) => {
              if (v !== undefined) state.captchaInterval = v * 60_000

              header.destroy()
              unit.destroy()
              box.destroy()
              menu.list.show()
              menu.locked = false
              menu.list.focus()
            }
          })

          // WARN: input.focus() MUST be before list.hide() because for some reason if not, the list isn't focused when shown on back
          input.focus()
          menu.locked = true
          menu.list.hide()
          menu.screen.render()
        }
      },
      {
        type: 'action',
        name: 'Captcha Minimum Characters',
        action: (menu) => {
          const header = blessed.box({
            parent: menu.box,
            align: 'center',
            height: 1,
            top: 0,
            left: 0,
            right: 0,
            fg: 'blue',
            content: 'Captcha Minimum Characters'
          })

          const [box, input] = numberInput({
            parent: menu.box,
            top: 1,
            value: state.captchaMinCharacters,
            forcePositive: true,
            onExit: (v) => {
              if (v !== undefined) state.captchaMinCharacters = Math.round(v)

              header.destroy()
              box.destroy()
              menu.list.show()
              menu.locked = false
              menu.list.focus()
            }
          })

          // WARN: input.focus() MUST be before list.hide() because for some reason if not, the list isn't focused when shown on back
          input.focus()
          menu.locked = true
          menu.list.hide()
          menu.screen.render()
        }
      },
      {
        type: 'action',
        name: 'Captcha Maximum Characters',
        action: (menu) => {
          const header = blessed.box({
            parent: menu.box,
            align: 'center',
            height: 1,
            top: 0,
            left: 0,
            right: 0,
            fg: 'blue',
            content: 'Captcha Maximum Characters'
          })

          const [box, input] = numberInput({
            parent: menu.box,
            top: 1,
            value: state.captchaMaxCharacters,
            forcePositive: true,
            onExit: (v) => {
              if (v !== undefined) state.captchaMaxCharacters = Math.round(v)

              header.destroy()
              box.destroy()
              menu.list.show()
              menu.locked = false
              menu.list.focus()
            }
          })

          // WARN: input.focus() MUST be before list.hide() because for some reason if not, the list isn't focused when shown on back
          input.focus()
          menu.locked = true
          menu.list.hide()
          menu.screen.render()
        }
      },
      {
        type: 'action',
        name: 'Ping Interval',
        action: (menu) => {
          const header = blessed.box({
            parent: menu.box,
            align: 'center',
            height: 1,
            top: 0,
            left: 0,
            right: 0,
            fg: 'blue',
            content: 'Ping Interval'
          })

          const unit = blessed.box({
            parent: menu.box,
            align: 'center',
            height: 1,
            top: 1,
            left: 0,
            right: 0,
            bold: 'true',
            content: 'Time in seconds'
          })

          const [box, input] = numberInput({
            parent: menu.box,
            top: 2,
            value: state.pingInterval / 1000,
            forcePositive: true,
            onExit: (v) => {
              if (v !== undefined) state.pingInterval = v * 1000

              header.destroy()
              unit.destroy()
              box.destroy()
              menu.list.show()
              menu.locked = false
              menu.list.focus()
            }
          })

          // WARN: input.focus() MUST be before list.hide() because for some reason if not, the list isn't focused when shown on back
          input.focus()
          menu.locked = true
          menu.list.hide()
          menu.screen.render()
        }
      },
      {
        type: 'action',
        name: 'Ping Threshold',
        action: (menu) => {
          const header = blessed.box({
            parent: menu.box,
            align: 'center',
            height: 1,
            top: 0,
            left: 0,
            right: 0,
            fg: 'blue',
            content: 'Ping Threshold'
          })

          const unit = blessed.box({
            parent: menu.box,
            align: 'center',
            height: 1,
            top: 1,
            left: 0,
            right: 0,
            bold: 'true',
            content: 'Time in seconds'
          })

          const [box, input] = numberInput({
            parent: menu.box,
            top: 2,
            value: state.pingThreshold / 1000,
            forcePositive: true,
            onExit: (v) => {
              if (v !== undefined) state.pingThreshold = v * 1000

              header.destroy()
              unit.destroy()
              box.destroy()
              menu.list.show()
              menu.locked = false
              menu.list.focus()
            }
          })

          // WARN: input.focus() MUST be before list.hide() because for some reason if not, the list isn't focused when shown on back
          input.focus()
          menu.locked = true
          menu.list.hide()
          menu.screen.render()
        }
      }
    ]
  },
  {
    type: 'action',
    name: 'Shut Down',
    action: () => process.exit(0)
  }
]

export class MenuManager {
  private activeMenu = ''
  readonly list: ReturnType<typeof blessed.list>
  readonly screen: ReturnType<typeof blessed.screen>
  readonly box: blessed.Widgets.Node

  locked = false

  constructor (screen: ReturnType<typeof blessed.screen>, list: ReturnType<typeof blessed.list>, box: blessed.Widgets.Node) {
    this.list = list
    this.screen = screen
    this.box = box
    this.render()
    this.registerEvents()
  }

  getOptions (): Option[] {
    const submenus = this.activeMenu.split('.')
    let choices = options
    for (const submenu of submenus) {
      if (!submenu) continue

      const option = options.find((o) => o.name === submenu)
      choices = option?.type === 'submenu' ? option.options : []
    }

    return submenus.length > 1
      ? choices.concat({
        type: 'action',
        name: 'Back',
        action: () => this.back()
      })
      : choices
  }

  drill (submenu: string): void {
    this.list.select(0)
    this.activeMenu += '.' + submenu
    this.list.focus()
    this.render()
  }

  back (): void {
    this.list.select(0)
    this.activeMenu = this.activeMenu.slice(0, this.activeMenu.lastIndexOf('.'))
    this.list.focus()
    this.render()
  }

  registerEvents (): void {
    this.list.key('escape', () => this.back())
    this.list.on('select', (item) => {
      const active = this.getOptions()
      const option = active.find((o) => o.name === item.getText())
      switch (option?.type) {
        case 'action': option.action(this); break
        case 'submenu': this.drill(option.name); break
      }
    })
  }

  render (): void {
    const opts = this.getOptions()
    this.list.setItems(opts.map((o) => o.name))
    this.screen.render()
  }
}
