# RTC WebSocket E2E Tests

This directory contains local-only WebSocket transport variants of the editor
collaboration e2e tests in the parent directory. Each spec imports the matching
HTTP-polling RTC spec; the dedicated Playwright config enables
`GUTENBERG_RTC_TEST_WS_PROVIDER`, activates the test provider plugin, and starts
`bin/rtc-test-ws-sync-server.mjs`.

Run them locally with:

```sh
npm run test:e2e:rtc-websocket
```

The config starts a fresh server on `ws://127.0.0.1:18991` by default. Set
`GUTENBERG_RTC_TEST_WS_REUSE_SERVER=1` only when intentionally reusing a
manually started server on that port.

The default e2e config ignores this directory, and
`playwright.rtc-websocket.config.ts` fails by default when `CI` is set because
the WebSocket transport is not expected to work in CI.
