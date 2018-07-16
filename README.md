# Mobile Gutenberg

Note: The project is at an early stage phase, it's not yet ready for integration.

This is the mobile version of Gutenberg, targeting Android and iOS. It's a React Native library bootstrapped by CRNA and now ejected.

## Getting Started

### Prerequisities

For a developer experience closer to the one the project maintainers current have, make sure you have the following tools installed:

* git
* [nvm](https://github.com/creationix/nvm)
* Node.js and npm (use nvm to install them)
* yarn (`npm install -g yarn`)
* [AndroidStudio](https://developer.android.com/studio/) to be able to compile the Android version of the app
* [Xcode](https://developer.apple.com/xcode/) to be able to compile the iOS app

Note that the OS platform used by the maintainers is macOS but the tools and setup should be usable in other platforms too.

### Clone the project

* Clone the project and submodules:
```
$ git clone --recurse-submodules https://github.com/automattic/gutenberg-mobile
```

* Or if you already have the project cloned, initialize and update the submodules:
```
$ git submodule init
$ git submodule update
```

## Set up

Before running the demo app, you need to download and install the project dependencies. This is done via the following command:

```
yarn install
```

## Run

Note: the most recent and complete version of this guide is available [here](https://github.com/react-community/create-react-native-app/blob/master/react-native-scripts/template/README.md).

```
yarn start
```

Runs the packager (Metro) in development mode. The packager stays running to serve the app bundle to the clients that request it.

With the packager running, open another terminal window and use the following command to compile and run the Android app:

```
yarn android
```

The app should now open in a connected device or a running emulator and fetch the JavaScript code from the running packager.

To compile and run the iOS variant of the app, use:

```
yarn ios
```

which will attempt to open your app in the iOS Simulator if you're on a Mac and have it installed.

### When things seem crazy

Some times, and especially when tweaking anything in the `package.json`, Babel configuration (`.babelrc`) or the Jest configuration (`jest.config.js`), your changes might seem to not take effect as expected. On those times, you might need to clean various caches before starting the packager. To do that, run the script: `yarn start:reset`. Other times, you might want to reinstall the NPM packages from scratch and the `yarn clean:install` script can be handy.

## Test

Use the following command to run the test suite:

```
yarn test
```

It will run the [jest](https://github.com/facebook/jest) test runner on your tests. The tests are running on the desktop against Node.js.

To run the tests with debugger support, start it with the following CLI command:

```
yarn test:debug
```

Then, open `chrome://inspect` in Chrome to attach the debugger (look into the "Remote Target" section). While testing/developing, feel free to springle `debugger` statements anywhere in the code that you'd like the debugger to break.

## Writing and Running Tests

This project is set up to use [jest](https://facebook.github.io/jest/) for tests. You can configure whatever testing strategy you like, but jest works out of the box. Create test files in directories called `__tests__` or with the `.test.js` extension to have the files loaded by jest. See the [the template project](https://github.com/react-community/create-react-native-app/blob/master/react-native-scripts/template/App.test.js) for an example test. The [jest documentation](https://facebook.github.io/jest/docs/en/getting-started.html) is also a wonderful resource, as is the [React Native testing tutorial](https://facebook.github.io/jest/docs/en/tutorial-react-native.html).


## Static analysis and code style

The project includes a linter (`eslint`) to perform codestyle and static analysis of the code. The configuration used it the same as [the one in the Gutenerg project](https://github.com/WordPress/gutenberg/blob/master/eslint/config.js). To perform the check, run:

```
yarn lint
```

To have the linter also _fix_ the violations run: `yarn lint:fix`.

In parallel to `eslint` the project uses `Prettier` for codestyling. Run:

```
yarn prettier
```
to enforce the style. This will modify the source files to make them comform to the rules.

`Flow` is used as a static type checker for JavaScript code. Flow checks JavaScript code for errors through static type annotations. These types allow you to tell Flow how you want your code to work, and Flow will make sure it does work that way. To perform the check run:

```
yarn flow
```

You might want to use Visual Studio Code as an editor. The project includes the configuration needed to use the above codestyle and lint tools automatically.

## License

Gutenberg Mobile is an Open Source project covered by the [GNU General Public License version 2](LICENSE).

