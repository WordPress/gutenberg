# Getting Started for the React Native based Mobile Gutenberg

Welcome! This is the Getting Started guide for the native mobile port of the block editor, targeting Android and iOS devices. Overall, it's a React Native library to be used in parent greenfield or brownfield apps. Continue reading for information on how to build, test, and run it.

## Prerequisites

For a developer experience closer to the one the project maintainers current have, make sure you have the following tools installed:

-   git
-   [nvm](https://github.com/nvm-sh/nvm)
-   Node.js and npm (use nvm to install them)
-   [Android Studio](https://developer.android.com/studio/) to be able to compile the Android version of the app
-   [Xcode](https://developer.apple.com/xcode/) to be able to compile the iOS app
-   CocoaPods (`sudo gem install cocoapods`) needed to fetch React and third-party dependencies.

Note that the OS platform used by the maintainers is macOS but the tools and setup should be usable in other platforms too.

## Clone the project

```sh
git clone https://github.com/WordPress/gutenberg.git
```

## Set up

Note that the commands described here should be run in the top-level directory of the cloned project. Before running the demo app, you need to download and install the project dependencies. This is done via the following command:

```sh
nvm install
npm ci
npm run native preios
```

## Run

```sh
npm run native start:reset
```

Runs the packager (Metro) in development mode. The packager stays running to serve the app bundle to the clients that request it.

With the packager running, open another terminal window and use the following command to compile and run the Android app:

```sh
npm run native android
```

The app should now open in a connected device or a running emulator and fetch the JavaScript code from the running packager.

To compile and run the iOS variant of the app using the _default_ simulator device, use:

```sh
npm run native ios
```

which will attempt to open your app in the iOS Simulator if you're on a Mac and have it installed.

### Running on other iOS device simulators

To compile and run the app using a different device simulator, use the following, noting the double sets of `--` to pass the simulator option down to the `react-native` CLI.

```sh
npm run native ios -- -- --simulator="DEVICE_NAME"
```

For example, if you'd like to run in an iPhone Xs Max, try:

```sh
npm run native ios -- -- --simulator="iPhone Xs Max"
```

To see a list of all of your available iOS devices, use `xcrun simctl list devices`.

### Customizing the demo Editor

By default, the Demo editor renders most of the supported core blocks. This is helpful to showcase the editor's capabilities, but can be distracting when focusing on a specific block or feature. One can customize the editor's initial state by leveraging the `native.block_editor_props` hook in a `packages/react-native-editor/src/setup-local.js` file.

<details><summary>Example setup-local.js</summary>

```js
/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';

export default () => {
	addFilter(
		'native.block_editor_props',
		'core/react-native-editor',
		( props ) => {
			return {
				...props,
				initialHtml,
			};
		}
	);
};

const initialHtml = `
<!-- wp:heading -->
<h2 class="wp-block-heading">Just a Heading</h2>
<!-- /wp:heading -->
`;
```

</details>

### Troubleshooting

If the Android emulator doesn't start correctly, or compiling fails with `Could not initialize class org.codehaus.groovy.runtime.InvokerHelper` or similar, it may help to double check the set up of your development environment against the latest requirements in [React Native's documentation](https://reactnative.dev/docs/environment-setup). With Android Studio, for example, you will need to configure the `ANDROID_HOME` environment variable and ensure that your version of JDK matches the latest requirements.

Some times, and especially when tweaking anything in the `package.json`, Babel configuration (`.babelrc`) or the Jest configuration (`jest.config.js`), your changes might seem to not take effect as expected. On those times, you might need to stop the metro bunder process and restart it with `npm run native start:reset`. Other times, you might want to reinstall the NPM packages from scratch and the `npm run native clean:install` script can be handy.

## Developing with Visual Studio Code

Although you're not required to use Visual Studio Code for developing gutenberg-mobile, it is the recommended IDE and we have some configuration for it.

When you first open the project in Visual Studio, you will be prompted to install some recommended extensions. This will help with some things like type checking and debugging.

One of the extensions we are using is the [React Native Tools](https://marketplace.visualstudio.com/items?itemName=vsmobile.vscode-react-native). This allows you to run the packager from VSCode or launch the application on iOS or Android. It also adds some debug configurations so you can set breakpoints and debug the application directly from VSCode. Take a look at the [extension documentation](https://marketplace.visualstudio.com/items?itemName=vsmobile.vscode-react-native) for more details.

## Unit tests

Use the following command to run the test suite:

```sh
npm run test:native
```

It will run the [jest](https://github.com/facebook/jest) test runner on your tests. The tests are running on the desktop against Node.js.

To run the tests with debugger support, start it with the following CLI command:

```sh
npm run test:native:debug
```

Then, open `chrome://inspect` in Chrome to attach the debugger (look into the "Remote Target" section). While testing/developing, feel free to sprinkle `debugger` statements anywhere in the code that you'd like the debugger to break.

## Writing and running unit tests

This project is set up to use [jest](https://jestjs.io/) for tests. You can configure whatever testing strategy you like, but jest works out of the box. Create test files in directories called `__tests__` or with the `.test.js` extension to have the files loaded by jest. See an example test [here](https://github.com/WordPress/gutenberg/blob/HEAD/packages/react-native-editor/src/test/api-fetch-setup.test.js). The [jest documentation](https://jestjs.io/docs/getting-started) is also a wonderful resource, as is the [React Native testing tutorial](https://jestjs.io/docs/tutorial-react-native).

## End-to-end tests

In addition to unit tests, the Mobile Gutenberg (MG) project relies upon end-to-end (E2E) tests to automate testing critical flows in an environment similar to that of an end user. We generally prefer unit tests due to their speed and ease of maintenance. However, assertions that require OS-level features (e.g. complex gestures, text selection) or visual regression testing (e.g. dark mode, contrast levels) we use E2E tests.

The E2E tests are found in the [`packages/react-native-editor/__device-tests__`](/packages/react-native-editor/__device-tests__) directory. Additional documentation on running and contributing to these tests can be found in the [tests directory](/packages/react-native-editor/__device-tests__#readme).
