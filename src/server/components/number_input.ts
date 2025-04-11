import blessed from 'blessed'

/**
 * A blessed number input element
 * @param props               The props
 * @param props.value         The numerical value
 * @param props.forcePositive Force the value to be positive
 * @param props.onExit        Save callback
 * @returns                   The node
 */
export function numberInput ({
  value,
  forcePositive,
  onExit,
  ...options
}: {
  value: number
  forcePositive?: boolean
  onExit?: (value?: number) => void
} & blessed.Widgets.BoxOptions): [blessed.Widgets.BoxElement, blessed.Widgets.TextboxElement] {
  const box = blessed.box(options)

  const inputBox = blessed.box({
    parent: box,
    left: 'center',
    width: '60%',
    height: 1,
    top: 0
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
    ++value
    renderInput()
  })
  left.on('press', () => {
    --value
    renderInput()
  })

  const error = blessed.box({
    parent: box,
    top: 1,
    height: 2,
    left: 0,
    right: 0,
    align: 'center',
    content: `Input must be a${forcePositive ? ' positive' : ''} number`,
    fg: 'red'
  })
  error.hide()

  const list = blessed.list({
    parent: box,
    top: 3,
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
      case 'Save': onExit?.(value); break
      default: onExit?.(); break
    }
  })

  input.on('keypress', (_, key: blessed.Widgets.Events.IKeyEventArg) => {
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
      if (isNaN(parsed) || (forcePositive && parsed < 0)) {
        input.style.bg = 'red'
        error.show()
      } else {
        input.style.bg = 'white'
        error.hide()
        value = parsed
      }

      box.screen.render()
    })
  })

  function renderInput (): void {
    input.setValue((Math.trunc(value * 10000) / 10000).toString())
    input.style.bg = 'white'
    error.hide()
    box.screen.render()
  }

  renderInput()

  return [box, input]
}
