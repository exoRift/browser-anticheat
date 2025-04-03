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
    action: (menu: MenuManager) => {
      const input = blessed.textbox({
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
      menu.box.append(input)
      if (state.passcode) input.setValue(state.passcode)

      const placeholder = blessed.text({
        style: {
          fg: 'gray'
        },
        inputOnFocus: true,
        content: 'Enter Password Here',
        top: 1,
        left: 1,
        right: 1,
        height: 1
      })
      menu.box.append(placeholder)

      const list = blessed.list({
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
      menu.box.append(list)

      input.focus()

      function renderPlaceholder (key?: string): void {
        const empty = (input.value.length === 1 && key === 'backspace') || (!input.value.length && (!key || (key.length > 1 && !['space', 'tab'].includes(key))))
        if (empty) placeholder.show()
        else placeholder.hide()
      }
      renderPlaceholder()

      input.on('keypress', (ch, key) => {
        switch (key.name) {
          case 'up': list.up(1); break
          case 'down': list.down(1); break
          case 'enter':
            switch (list.getItem(list.selected).getText()) {
              case 'Set Password': state.passcode = input.value; break
              case 'Clear Password': state.passcode = null; break
            }
          case 'escape': /* eslint-disable-line no-fallthrough */
            input.off('change', renderPlaceholder)
            input.destroy()
            list.destroy()
            placeholder.destroy()
            menu.back()
            break
        }
        renderPlaceholder(key.name ?? key.ch)
        menu.screen.render()
      })

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
        action: () => {
          const input = blessed.input({
            width: '50%',
            height: '50%',
            left: 'center',
            top: 'center'
          })
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
