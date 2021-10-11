# Getting Started for the React Native based Mobile Gutenberg

Welcome! This is the Getting Started guide for the native mobile port of the block editor, targeting Android and iOS devices. Overall, it's a React Native library to be used in parent greenfield or brownfield apps. Continue reading for information on how to build, test, and run it.

## Prerequisites

For a developer experience closer to the one the project maintainers current have, make sure you have the following tools installed:

-   git
-   [nvm](https://github.com/creationix/nvm)
-   Node.js and npm (use nvm to install them)
-   [Android Studio](https://developer.android.com/studio/) to be able to compile the Android version of the app
-   [Xcode](https://developer.apple.com/xcode/) to be able to compile the iOS app
-   CocoaPods (`sudo gem install cocoapods`) needed to fetch React and third-party dependencies.

Note that the OS platform used by the maintainers is macOS but the tools and setup should be usable in other platforms too.

## First time set up

### Clone the project

```sh
git clone https://github.com/WordPress/gutenberg.git
```

Note that the commands described here should be run in the top-level directory of the cloned project. Before running the demo app, you need to download and install the project dependencies. This is done via the following command:

```sh
nvm install
npm ci
```

If you have an existing checkout, try cleaning node_modules to avoid potential errors:

```sh
npm run distclean
npm ci
```

### Unit Tests

Unit tests should work at this point.

```sh
npm run native test
```

### iOS

The easiest way to figure out what needs to be installed is using the [react native doctor](https://reactnative.dev/blog/2019/11/18/react-native-doctor). From your checkout, or relative to /packages/react-native-editor folder, run:

```
npx @react-native-community/cli doctor
```

See if doctor can fix both common and iOS issues. At this stage Android will still have ❌s for items.

Once all common and iOS issues are resolved, try:

```sh
npm run native start:reset #starts metro
```

In another terminal type:

```
npm run native ios
```

After waiting for everything to build we should see XCode bring up the iPhone simulator with the Block editor visible.

### Android

For ease of setup it's ideal to use Android Studio for all JDK and SDK package management. The first step is downloading [Android Studio](https://developer.android.com/studio):

#### Download packages

Next, open an existing project with Android Studio and select the gutenberg folder you cloned. Click on the cube with the down arrow in the top toolbar.

We can download SDK platforms, packages and other tools on this screen. Specific versions are hidden behind this the "Show package details" checkbox, make sure this is checked, since our build requires specific versions for E2E and development:

Check all related packages from https://github.com/WordPress/gutenberg/blob/trunk/packages/react-native-editor/android/build.gradle. Then click on "Apply" to download items. There may be other related dependecies from build.gradle files in node_modules. If you don’t want to dig through files, stack traces will complain of missing packages, but it does take quite a number of tries if you go through this route.

For good measure, let’s also set the project SDK in Android Studio in File > Project Structure to match what is specified in react-native-editor build.gradle.

#### Update Paths

Export the following env variables and update $PATH

```sh
export JAVA_HOME=/Applications/Android\ Studio.app/Contents/jre/jdk/Contents/Home
export ANDROID_HOME=/Users/{your-username}/Library/Android/sdk
export ANDROID_AVD_HOME=/Users/{your-username}/.android/avd
export ANDROID_SDK_ROOT=/Users/{your-username}/Library/Android/sdk
export ANDROID_NDK=/Users/{your-username}/Library/Android/ndk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

Save, then source in a terminal, or open a new terminal to pick up the environment changes.

#### Create a device image

Next, let’s create a virtual device image. In Android Studio's top toolbar, click on the tiny phone icon with an android to the bottom-right.

This brings up the “Android Virtual Device Manager” or (AVD). Click on “Create Virtual Device”.

Pick a phone type of your choice. This is the targetSdkVersion set in the [build.gradle](https://github.com/WordPress/gutenberg/blob/trunk/packages/react-native-editor/android/build.gradle#L8) file.

There are some advanced settings we can toggle, but it appears to work okay with out of the box defaults. Click finish.

#### Putting it all together

Start metro:

```
npm run native start:reset
```

In another terminal run the following. The emulator doesn’t need to be launched previously.

```
npm run native android
```

After a bit of a wait, we should see the Android emulator with the Block Editor running.

### E2E Tests

#### Install Appium

[Appium](https://appium.io/) has it own doctor tool. Run this with:

```sh
npx appium-doctor
```

Resolve any required dependencies.

#### iOS E2E

If we know we can run the iOS local environment without issue, E2Es for iOS are straightforward. Stop any running metro processes. This was launched previously with `npm run native start:reset`.

Then in terminal type:

```sh
npm run native test:e2e:ios:local
```

Passing a filename should also work to run a subset of tests:

```
npm run native test:e2e:ios:local gutenberg-editor-gallery.test.js
```

If all things go well, we should see the iOS iPhone simulator being driven by Appium in the Block Editor.

### Android E2E

**Create a new virtual device()** that matches the device specified in [packages/react-native-editor/__device-tests__/helpers/caps.js](https://github.com/WordPress/gutenberg/blob/trunk/packages/react-native-editor/__device-tests__/helpers/caps.js#L30) At the time of this writing, this would be a Pixel 3 XL image, using Android 9 (API 28).

Start the virtual device first. Go back to the AVD by clicking on the phone icon, then click the green play button.

Make sure no metro processes are running. This was launched previously with `npm run native start:reset`.

Then in a terminal run:

```sh
npm run native test:e2e:android:local
```

Passing a filename should also work to run a subset of tests:

```sh
npm run native test:e2e:android:local gutenberg-editor-gallery.test.js
```

If all things go well, we should see the Android simulator being driven by Appium in the Block Editor.

## Quick Start

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

### Running on Other iOS Device Simulators

To compile and run the app using a different device simulator, use the following, noting the double sets of `--` to pass the simulator option down to the `react-native` CLI.

```sh
npm run native ios -- -- --simulator="DEVICE_NAME"
```

For example, if you'd like to run in an iPhone Xs Max, try:

```sh
npm run native ios -- -- --simulator="iPhone Xs Max"
```

To see a list of all of your available iOS devices, use `xcrun simctl list devices`.

### Troubleshooting

Some times, and especially when tweaking anything in the `package.json`, Babel configuration (`.babelrc`) or the Jest configuration (`jest.config.js`), your changes might seem to not take effect as expected. On those times, you might need to stop the metro bunder process and restart it with `npm run native start:reset`. Other times, you might want to reinstall the NPM packages from scratch and the `npm run native clean:install` script can be handy.

## Developing with Visual Studio Code

Although you're not required to use Visual Studio Code for developing gutenberg-mobile, it is the recommended IDE and we have some configuration for it.

When you first open the project in Visual Studio, you will be prompted to install some recommended extensions. This will help with some things like type checking and debugging.

One of the extensions we are using is the [React Native Tools](https://marketplace.visualstudio.com/items?itemName=vsmobile.vscode-react-native). This allows you to run the packager from VSCode or launch the application on iOS or Android. It also adds some debug configurations so you can set breakpoints and debug the application directly from VSCode. Take a look at the [extension documentation](https://marketplace.visualstudio.com/items?itemName=vsmobile.vscode-react-native) for more details.

## Unit Tests

Use the following command to run the test suite:

```sh
npm run native test
```

It will run the [jest](https://github.com/facebook/jest) test runner on your tests. The tests are running on the desktop against Node.js.

To run the tests with debugger support, start it with the following CLI command:

```sh
npm run native test:debug
```

Then, open `chrome://inspect` in Chrome to attach the debugger (look into the "Remote Target" section). While testing/developing, feel free to sprinkle `debugger` statements anywhere in the code that you'd like the debugger to break.

## Writing and Running Unit Tests

This project is set up to use [jest](https://facebook.github.io/jest/) for tests. You can configure whatever testing strategy you like, but jest works out of the box. Create test files in directories called `__tests__` or with the `.test.js` extension to have the files loaded by jest. See an example test [here](https://github.com/WordPress/gutenberg/blob/HEAD/packages/react-native-editor/src/test/api-fetch-setup.test.js). The [jest documentation](https://facebook.github.io/jest/docs/en/getting-started.html) is also a wonderful resource, as is the [React Native testing tutorial](https://facebook.github.io/jest/docs/en/tutorial-react-native.html).

## UI Tests

This repository uses Appium to run UI tests. The tests live in `__device-tests__` and are written using Appium to run tests against simulators and real devices. To run these you'll need to check off a few things:

-   When running the tests, you'll need to ensure the Metro bundler (`npm run native start`) is not running.
-   [Appium CLI](https://github.com/appium/appium/blob/HEAD/docs/en/about-appium/getting-started.md) installed and available globally. We also recommend using [appium-doctor](https://github.com/appium/appium-doctor) to ensure all of Appium's dependencies are good to go. You don't have to worry about starting the server yourself, the tests handle starting the server on port 4723, just be sure that the port is free or feel free to change the port number in the test file.
-   For iOS a simulator should automatically launch but for Android you'll need to have an emulator _with at least platform version 8.0_ fired up and running.

Then, to run the UI tests on iOS:

```sh
npm run native test:e2e:ios:local
```

and for Android:

```sh
npm run native test:e2e:android:local
```

To run a single test instead of the entire suite, use `npm run native device-tests:local`. Here's an example that runs only `gutenberg-editor-gallery.test.js`:

```sh
npm run native test:e2e:android:local gutenberg-editor-gallery.test.js
```

Note: You might experience problems that seem to be related to the tests starting the Appium server, e.g. errors that say `Connection Refused`, `Connection Reset` or `The requested environment is not available`. For now, you can manually start the Appium server via [appium desktop](https://github.com/appium/appium-desktop) or the CLI, then change the port number in the tests while (optionally) commenting out related code in the `beforeAll` and `afterAll` block.

For a more detailed outline of the UI tests and how to get started writing one, please visit the [UI Test documentation](/packages/react-native-editor/__device-tests__/README.md) and our [contributing guide](/packages/react-native-editor/__device-tests__/CONTRIBUTING.md).

You might want to use Visual Studio Code as an editor. The project includes the configuration needed to use the above codestyle and linting tools automatically.
