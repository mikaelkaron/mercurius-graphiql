'use strict'

const { mkdirSync, readFileSync, rmSync, writeFileSync } = require('node:fs')
const { basename, dirname, join } = require('node:path')
const { scripts, styles } = require('../lib/assets')

const vendor = join(__dirname, '../static/vendor')

rmSync(vendor, { recursive: true, force: true })
mkdirSync(vendor, { recursive: true })

// The source maps are not copied, so their references are dropped.
const sourceMap = /\n?\/[*/]# sourceMappingURL=\S+?(?: \*\/)?\s*$/

for (const { from, file } of [...scripts, ...styles]) {
  // React's exports map hides its UMD builds, so resolve from the package root
  const root = dirname(require.resolve(`${from}/package.json`))
  const source = readFileSync(join(root, file), 'utf8')
  writeFileSync(join(vendor, basename(file)), source.replace(sourceMap, ''))
}
