'use strict'

const { scripts, styles } = require('./assets')
const { basename } = require('node:path')

// `base` is the path from the page to the files under the route prefix.
// Relative paths keep the page working behind a proxy that strips a prefix.
function html (base) {
  const links = styles.map(({ file }) => `${base}vendor/${basename(file)}`)
    .concat(`${base}graphiql.css`)
    .map(href => `  <link rel="stylesheet" href="${href}"/>`)
  const sources = scripts.map(({ file }) => `${base}vendor/${basename(file)}`)
    .concat(`${base}config.js`, `${base}main.js`)
    .map(src => `  <script src="${src}"></script>`)

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>GraphiQL</title>
  <meta name="robots" content="noindex"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
${links.join('\n')}
</head>
<body>
  <div id="main"></div>
${sources.join('\n')}
</body>
</html>
`
}

module.exports = html
