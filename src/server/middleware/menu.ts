import blessed from 'blessed'

import { state } from './state.ts'

declare module 'blessed' {
  /* eslint-disable-next-line @typescript-eslint/no-namespace */
  export namespace Widgets {
    interface ListElement {
      selected: number
    }
  }
}

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
        menu.back()
      }

      list.on('select', (item) => {
        switch (item.getText()) {
          case 'Set Password': state.passcode = input.value; break
          case 'Clear Password': state.passcode = null; break
        }

        exit()
      })

      input.on('keypress', (ch, key) => {
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
          let value = state.captchaInterval

          const header = blessed.box({
            parent: menu.box,
            align: 'center',
            height: 1,
            top: 0,
            left: 0,
            right: 0,
            bold: 'true',
            content: 'Time in minutes'
          })

          const inputBox = blessed.box({
            parent: menu.box,
            left: 'center',
            width: '60%',
            height: 1,
            top: 1
          })

          const input = blessed.textbox({
            parent: inputBox,
            left: 3,
            right: 3,
            top: 0,
            bottom: 0,
            bg: 'white',
            fg: 'black',
            inputOnFocus: true
          })

          const left = blessed.button({
            parent: inputBox,
            content: '\u25c0',
            mouse: true,
            left: 0,
            width: 2,
            bg: 'gray'
          })
          const right = blessed.button({
            parent: inputBox,
            content: '\u25b6',
            mouse: true,
            right: 0,
            width: 2,
            bg: 'gray'
          })
          right.on('press', () => {
            value += 60 * 1000
            renderInput()
          })
          left.on('press', () => {
            value -= 60 * 1000
            renderInput()
          })

          const error = blessed.box({
            parent: menu.box,
            top: 2,
            height: 2,
            left: 0,
            right: 0,
            align: 'center',
            content: 'Input must be a positive number',
            fg: 'red'
          })
          error.hide()

          const list = blessed.list({
            parent: menu.box,
            top: 4,
            mouse: true,
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
            items: [
              'Save',
              'Cancel'
            ]
          })

          list.on('select', (item) => {
            switch (item.getText()) {
              case 'Save':
                state.captchaInterval = value
                break
            }

            header.destroy()
            inputBox.destroy()
            error.destroy()
            list.destroy()
            menu.list.show()
            menu.locked = false
            menu.back()
          })

          input.on('keypress', (ch, key) => {
            switch (key.name) {
              case 'left': left.press(); break
              case 'right': right.press(); break
              case 'up': list.up(1); break
              case 'down': list.down(1); break
              case 'enter': list.emit('select', list.getItem(list.selected), list.selected); break
              case 'escape': list.emit('select', list.getItem(1), 1); break
            }

            setTimeout(() => {
              const parsed = parseFloat(input.value)
              if (isNaN(parsed) || parsed < 0) {
                input.style.bg = 'red'
                error.show()
              } else {
                input.style.bg = 'white'
                error.hide()
                value = parsed * 60 * 1000
              }

              menu.screen.render()
            })
          })

          function renderInput (): void {
            input.setValue((value / 60 / 1000).toString())
            input.style.bg = 'white'
            error.hide()
            menu.screen.render()
          }

          renderInput()
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
