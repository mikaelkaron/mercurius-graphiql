'use strict'

// The browser builds served from static/vendor, in load order.
// scripts/prepare.js copies each one from its npm package.
const scripts = [
  { from: 'react', file: 'umd/react.production.min.js' },
  { from: 'react-dom', file: 'umd/react-dom.production.min.js' },
  { from: 'graphiql', file: 'graphiql.min.js' }
]

const styles = [
  { from: 'graphiql', file: 'graphiql.min.css' }
]

module.exports = { scripts, styles }
