# Mobile Gutenberg E2E Tests

The Mobile Gutenberg (MG) project maintains a suite of automated end-to-end (E2E) tests that uses [Appium](https://appium.io/docs/en/2.1/) to facilitate UI automation. The E2E tests run on iOS simulators and Android emulators to simulate an environment similar to that of an end user. This document provides an overview for running these tests on your local development computer.

## Setup

1. Complete the [React Native Getting Started](https://reactnative.dev/docs/environment-setup) guide for both iOS and Android, which covers setting up Xcode, Android Studio, the Android SDK.
1. Open [Xcode settings](https://developer.apple.com/documentation/xcode/installing-additional-simulator-runtimes#Install-and-manage-Simulator-runtimes-in-settings) to install the iOS 16.2 simulator runtime.
1. Install [`jq`](https://jqlang.github.io/jq/download/) via [Homebrew](https://brew.sh/) or your preferred package manager.
1. `npm run native test:e2e:setup`

## Running Tests

The process for running the E2E tests differ in subtle, important ways for iOS and Android respectively. Before running E2E tests, if you previously ran `npm run native start:reset`, **ensure the Metro development server is no longer running.**

### iOS

The following script will launch the correct iOS simulator and run all of the E2E tests.

```shell
npm run native test:e2e:ios:local
```

### Android

The following script will launch the correct Android emulator and run all of the E2E tests.

```shell
npm run native test:e2e:android:local
```

## Filtering Test Runs

By default, the E2E test scripts run all tests in the suite. While this is helpful for verifying all tests pass, the entire test suite takes a long time to complete. Running all tests is not very effective for local development.

You can filter which test runs by one of two ways:

-   Passing a file name argument to the CLI script.
-   Leveraging Jest’s interactive watch mode.

```shell
# Run a single test file on iOS
npm run native test:e2e:ios:local gutenberg-editor-paragraph.test.js

# Enable watch mode on iOS
npm run native test:e2e:ios:local -- -- -- --watch
```

## Speeding Up Test Runs

The `native test:e2e:(android|ios):local` script performs several steps via associated npm scripts.

-   Create the JavaScript bundle: `test:e2e:bundle:(ios|android)`
-   Compile the app: `test:e2e:build-app:(ios|android)`
-   Launch the test runner: `device-tests:local`

While we must run all of these at least once to produce a testable app, it is often not necessary to run them each multiple times over while modifying or writing tests. To speed up multiple test runs, you can invoke the individual scripts as needed.

-   If you only modified the native app code, you can run `test:e2e:build-app:(ios|android)` followed by `device-tests:local`.
-   If you only modified JavaScript app code, you can run `test:e2e:bundle:(ios|android)` followed by `device-tests:local`.
-   If you only modified E2E tests code, you can run `device-tests:local`.

By default `device-tests:local` runs tests for Android. To run tests on iOS, you can prefix the script with the `TEST_RN_PLATFORM` environment variable.

```shell
# Run tests on iOS
TEST_RN_PLATFORM=ios npm run native device-tests:local

# Run tests on iOS with watch mode enabled
TEST_RN_PLATFORM=ios npm run native device-tests:local -- -- --watch
```

## Debugging Tests

Much like other development servers, values outputted to the console via `console.log` should display in the Jest test runner server log.

Occasionally, it is helpful to inspect breakpoints during the execution of a test.The MG project includes a `device-tests:debug` script which sets the `--inspect` flag required for attaching an inspector. Additional details on attaching an inspector can be found in Node.js’ [Debugging Guide](https://nodejs.org/en/docs/guides/debugging-getting-started).

## Writing Tests

Jest is the test runner for the E2E test suite. Reviewing the [Jest’s Introduction](https://jestjs.io/docs/getting-started) documentation provides an overview of writing JavaScript-based tests for Jest.

The E2E tests utilize WebdriverIO as the Appium driver, which is an interface that allows Appium to automate a particular platform. The WebdriverIO documentation for [Appium](https://webdriver.io/docs/api/appium/) and the [driver object](https://webdriver.io/docs/api/browser) provides useful information for automating interactions with mobile apps.

Additionally, the project’s E2E tests leverage a [Page Object](https://webdriver.io/docs/pageobjects/) pattern. The `editor-page.js` file defines methods managing all interactions with page UI. Tests themselves reside in separate files.

Expanding the Page Object to interact with specific UI elements often requires determining a [locator strategy](https://saucelabs.com/resources/blog/advanced-locator-strategies) for the targeted UI element. Generally, an accessibility (a11y) identifier is preferred over an Xpath selector, which are slower and considered implementation details.

Determining the correct selector query is often made easier by leveraging a tool to inspect the properties of UI elements.

-   [**Appium Inspector**](https://github.com/appium/appium-inspector#readme) – cross-platform tool for inspecting UI elements and their properties.
-   [**Android Studio Layout Inspector**](https://developer.android.com/studio/debug/layout-inspector) – Android tool allowing you to debug the layout of your app by showing a view hierarchy and allowing you to inspect the properties of each view.
-   [**Xcode Accessibility Inspector**](https://developer.apple.com/documentation/accessibility/integrating_accessibility_into_your_app#4154486) – Xcode tool that displays all accessibility information for an element.

## Continuous Integration

In addition to running the E2E tests on local computers, the continuous integration (CI) server runs some of these tests on every Pull Request. Configuration for this can be found in the [.github configuration directory](/.github/workflows).
