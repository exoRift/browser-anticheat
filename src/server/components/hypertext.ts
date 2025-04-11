import blessed from 'blessed'
import open from 'open'

const LINK_REGEX = /\[(?<text>.*?)\]\((?<link>.*?)\)/g

/**
 * A blessed text element that replaces markdown hyperlinks with clickable underlined segments
 * @param props         The props
 * @param props.content The text content
 * @returns             The element
 */
export function hypertext ({ content, ...options }: blessed.Widgets.BoxOptions): blessed.Widgets.BoxElement {
  let segments: Array<[start: number, length: number, url: string]> = []

  function renderContent (content: string): string {
    const matches = content.matchAll(LINK_REGEX)

    let renderedContent = ''
    let lastMatchEnd = 0
    for (const match of matches) {
      const prior = content.slice(lastMatchEnd, match.index)
      renderedContent += prior

      const start = blessed.stripTags(renderedContent.replaceAll('\n', '')).length
      renderedContent += `{underline}{blue-fg}${match.groups!.text}{/blue-fg}{/underline}`
      segments.push([start, match.groups!.text!.length, match.groups!.link!])

      lastMatchEnd = match.index + match[0].length
    }

    const post = content.slice(lastMatchEnd, content.length)
    renderedContent += post

    return renderedContent
  }

  const box = blessed.box({
    ...options,
    tags: true,
    content: content && renderContent(content)
  })
  box.on('click', (e) => {
    const lines = box.getScreenLines()
    let lineNum = e.y - (box.atop as number)
    if (box.options.valign === 'bottom') lineNum -= (box.height as number) - lines.length
    else if (box.options.valign === 'middle') lineNum -= Math.floor(box.height as number / 2) - lines.length
    if (lineNum < 0) return

    const line = lines[lineNum]
    if (!line?.trim().length) return

    const linePad = lines.slice(0, lineNum).reduce((a, l) => a + blessed.stripTags(l.trim()).length + 1, 0)

    const index = linePad + e.x - (box.aleft as number) - (line.length - line.trimStart().length)
    if (index < linePad) return

    for (const segment of segments) {
      if (index >= segment[0] && index < segment[0] + segment[1]) {
        void open(segment[2])
        break
      }
    }
  })

  const ogSetContent = box.setContent.bind(box)

  /**
   * @override
   */
  box.setContent = function (content: string) {
    for (const child of box.children) child.destroy()
    box.children = []
    segments = []
    ogSetContent(renderContent(content))
  }

  return box
}
