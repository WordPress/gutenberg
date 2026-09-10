# Automated Testing

## Why is Playwright the tool of choice for end-to-end tests?

There exists a rich ecosystem of tooling available for web-based end-to-end automated testing. Gutenberg uses [Playwright](https://playwright.dev/) as its end-to-end testing framework. The project previously used [Puppeteer](https://pptr.dev/) but has since fully migrated to Playwright. Here are the reasons Playwright was chosen:

-   **Multi-browser support**. Playwright supports Chromium, Firefox, and WebKit out of the box, providing broader browser coverage compared to Puppeteer's Chrome-only approach.
-   **Built-in test runner**. `@playwright/test` provides a powerful test runner with parallel execution, [fixtures](https://playwright.dev/docs/test-fixtures), and auto-waiting, reducing flakiness and improving developer experience.
-   **Auto-waiting and web-first assertions**. Playwright automatically waits for elements to be actionable before performing actions, reducing the need for manual `waitFor*` calls while still surfacing legitimate performance issues that affect users.
-   **Better debugging tools**. Playwright offers a [trace viewer](https://playwright.dev/docs/trace-viewer), [UI mode](https://playwright.dev/docs/test-ui-mode), and a built-in [inspector](https://playwright.dev/docs/debug#playwright-inspector) for step-by-step debugging.
-   **Fixtures over global variables**. Playwright's fixture model injects `page`, `browser`, and other parameters into tests, making it easier to work with multiple pages or tabs and to run tests in parallel.
-   **Page Object Model**. Playwright encourages the [Page Object Model](https://playwright.dev/docs/pom) pattern for reusable utility functions, improving test readability and maintainability.

For more details on writing end-to-end tests, see the [End-to-End Testing guide](/docs/contributors/code/e2e/README.md).