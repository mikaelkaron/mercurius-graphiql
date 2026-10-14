'use strict'

const { defineConfig, devices } = require('@playwright/test')

const PORT = 3123

module.exports = defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'on-first-retry'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  webServer: {
    command: 'node ./e2e/server.js',
    env: { PORT: String(PORT) },
    url: `http://127.0.0.1:${PORT}/api/graphiql`,
    reuseExistingServer: !process.env.CI
  }
})
