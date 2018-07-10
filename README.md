# Mobile Gutenberg

Note: The project is at an early stage project, it's not yet ready for integration.

This is the mobile version of Gutenberg, targeting Android and iOS. It's a React Native library bootstrapped by CRNA.

## Getting Started

### Clone the project

* Clone the project and submodules:
```
$ git clone --recurse-submodules https://github.com/automattic/gutenberg-mobile
```

* Or if you already have the project cloned, init the `gutenberg` submodule:
```
$ cd gutenberg
$ git submodule init
$ git submodule update
```

### Set up

Before running the demo app, you need to download and install the project dependencies. This is done via the following command:

```
npm install
```

## Run

Note: the most recent and complete version of this guide is available [here](https://github.com/react-community/create-react-native-app/blob/master/react-native-scripts/template/README.md).

### `npm start`

Runs your app in development mode.

Open it in the [Expo app](https://expo.io) on your phone to view it. It will reload if you save edits to your files, and you will see build errors and logs in the terminal.

Sometimes you may need to reset or clear the React Native packager's cache. To do so, you can pass the `--reset-cache` flag to the start script:

```
npm start -- --reset-cache
```

#### `npm test`

Runs the [jest](https://github.com/facebook/jest) test runner on your tests.

To run `jest` with debugger support, start it with the following CLI command:
```
NODE_ENV=test node --inspect-brk node_modules/.bin/jest --runInBand
```

Append `--config <jest config json file>` to specify a config file other than the default.

Then, open `chrome://inspect` in Chrome to attach the debugger (look into the "Remote Target" section). While testing/developing, feel free to springle `debugger` statements anywhere in the code that you'd like the debugger to break.

#### `npm run ios`

Like `npm start`, but also attempts to open your app in the iOS Simulator if you're on a Mac and have it installed.

#### `npm run android`

Like `npm start`, but also attempts to open your app on a connected Android device or emulator. Requires an installation of Android build tools (see [React Native docs](https://facebook.github.io/react-native/docs/getting-started.html) for detailed setup). We also recommend installing Genymotion as your Android emulator. Once you've finished setting up the native build environment, there are two options for making the right copy of `adb` available to Create React Native App:

#### `npm run flow`

Flow is a static type checker for JavaScript code. Flow checks JavaScript code for errors through static type annotations. These types allow you to tell Flow how you want your code to work, and Flow will make sure it does work that way.

## Writing and Running Tests

This project is set up to use [jest](https://facebook.github.io/jest/) for tests. You can configure whatever testing strategy you like, but jest works out of the box. Create test files in directories called `__tests__` or with the `.test` extension to have the files loaded by jest. See the [the template project](https://github.com/react-community/create-react-native-app/blob/master/react-native-scripts/template/App.test.js) for an example test. The [jest documentation](https://facebook.github.io/jest/docs/en/getting-started.html) is also a wonderful resource, as is the [React Native testing tutorial](https://facebook.github.io/jest/docs/en/tutorial-react-native.html).


## Code style

Run the style checker with this command that lists the files having at least one style violation:
```
$ npm run prettier:check
```

Fix style violations:
```
$ npm run prettier
```

## Linter

Note: our linter configuration does some style checking as well. Run the linter to list errors and warnings:
```
$ npm run lint
```

It's capable of fixing _some_ of the lint warnings and errors:
```
$ npm run lint:fix
```


## License

Gutenberg Mobile is an Open Source project covered by the [GNU General Public License version 2](LICENSE).

