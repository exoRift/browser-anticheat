import type { BunPlugin } from 'bun'

/**
 * A plugin that removes code between "// @bun nobuild[" and "// @bun nobuild]" directives.
 */
const nobuildPlugin: BunPlugin = {
  name: 'bun-nobuild',
  setup (build) {
    const regex = /\/\/\s*@bun\s+nobuild\[\s*\n([\s\S]*?)\/\/\s*@bun\s+nobuild\]\s*\n/g
    const filter = /\.(js|jsx|ts|tsx)$/

    build.onLoad({ filter }, async (args) => {
      const source = await Bun.file(args.path).text()

      const transformed = source.replace(regex, '')

      return {
        contents: transformed,
        loader: args.path.endsWith('.ts') || args.path.endsWith('.tsx') ? 'ts' : 'js'
      }
    })
  }
}

const result = await Bun.build({
  entrypoints: ['src/server/index.ts'],
  outdir: './build',
  target: 'bun',
  format: 'esm',
  plugins: [nobuildPlugin],
  minify: true,
  packages: 'external',
  sourcemap: 'inline',
  env: 'inline'
})

if (result.success) {
  console.log('Build completed successfully!')
  console.log(`Output files: ${result.outputs.map(f => f.path).join(', ')}`)
} else {
  console.error('Build failed with errors:')
  for (const log of result.logs) {
    console.error(`- ${log.message}`)
  }
  process.exit(1)
}
