import type blessed from 'blessed'

export type Option = {
  type: 'action'
  name: string
  action: (dims: [number, number, number, number]) => void
} | {
  type: 'submenu'
  name: string
  options: Option[]
}

export const options: Option[] = [
  {
    type: 'action',
    name: 'Set Password',
    action: () => process.exit(0)
  },
  {
    type: 'action',
    name: 'Anticheat Settings',
    action: () => process.exit(0)
  },
  {
    type: 'action',
    name: 'Shut Down',
    action: () => process.exit(0)
  }
]

export class MenuManager {
  private screen: ReturnType<typeof blessed.screen>
  private component: ReturnType<typeof blessed.list>
  private activeMenu = ''
  private dims: [number, number, number, number]

  constructor (screen: ReturnType<typeof blessed.screen>, component: ReturnType<typeof blessed.list>, dims: [number, number, number, number]) {
    this.screen = screen
    this.component = component
    this.dims = dims
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

    return choices
  }

  drill (submenu: string): void {
    this.activeMenu += '.' + submenu
  }

  back (): void {
    this.activeMenu = this.activeMenu.slice(0, this.activeMenu.lastIndexOf('.'))
  }

  registerEvents (): void {
    this.component.key('escape', () => this.back())
    this.component.on('select', (item) => {
      const active = this.getOptions()
      const option = active.find((o) => o.name === item.getText())
      switch (option?.type) {
        case 'action': option.action(this.dims); break
        case 'submenu': this.drill(option.name); break
      }
    })
  }

  render (): void {
    const opts = this.getOptions()
    this.component.setItems(opts.map((o) => o.name))
    this.screen.render()
  }
}
