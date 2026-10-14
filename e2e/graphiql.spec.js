'use strict'

const { test, expect } = require('@playwright/test')

async function run (page, query) {
  const editor = page.locator('.graphiql-query-editor .CodeMirror')
  await expect(editor).toBeVisible()
  await editor.evaluate((element, query) => element.CodeMirror.setValue(query), query)
  await page.locator('.graphiql-execute-button').click()
}

const external = []

test.beforeEach(async ({ page, baseURL }) => {
  // GraphiQL must work offline: fail every request to another origin
  external.length = 0
  await page.route('**/*', route => {
    if (route.request().url().startsWith(baseURL)) {
      return route.continue()
    }
    external.push(route.request().url())
    return route.abort()
  })
})

test.afterEach(() => {
  expect(external).toEqual([])
})

test('runs a query', async ({ page }) => {
  await page.goto('/api/graphiql')
  await run(page, '{ add(x: 2, y: 2) }')

  await expect(page.locator('.result-window')).toContainText('"add": 4')
})

test('runs a subscription over a WebSocket, showing each event', async ({ page }) => {
  await page.goto('/api/graphiql/')
  await run(page, 'subscription { ticks }')

  await expect(page.locator('.result-window')).toContainText('"ticks": 3')
})

test('loads the GraphiQL plugins', async ({ page }) => {
  await page.goto('/api/graphiql')
  await page.getByRole('button', { name: 'Show Counting' }).click()

  await expect(page.locator('.graphiql-plugin')).toContainText('Counting')
})

test('passes every event of a subscription through fetcherWrapper', async ({ page }) => {
  await page.goto('/api/graphiql')
  await run(page, 'subscription { ticks }')

  await expect(page.locator('.result-window')).toContainText('"ticks": 3')
  const counted = await page.evaluate(() => window.countingPlugin.counted)
  await expect(page.locator('.result-window')).toContainText(`"counted": ${counted}`)
  expect(counted).toBeGreaterThanOrEqual(4)
})

test('renders without a GraphiQL plugin that fails to load', async ({ page }) => {
  await page.route('**/api/plugin.js', route => route.fulfill({ status: 404 }))
  await page.goto('/api/graphiql')
  await run(page, '{ add(x: 2, y: 2) }')

  await expect(page.locator('.result-window')).toContainText('"add": 4')
  await expect(page.getByRole('button', { name: 'Show Counting' })).toHaveCount(0)
})
