# React Native based mobile Gutenberg
Intertwined with the web codepaths, the Gutenberg repo also includes the [React Native](https://facebook.github.io/react-native/) based mobile tree. The mobile client is packaged and released via the [official WordPress apps](https://wordpress.org/mobile/). Even though the build pipeline is rather different and lives in its own repo for now ([here's the native mobile repo](https://github.com/wordpress-mobile/gutenberg-mobile)), the source code itself is taken directly from this repo and the "web" side codepaths.
## Native mobile specific files
The majority of the code shared with native mobile is in the very same JavaScript module and SASS style files. In the cases where the code paths need to diverge, a `.native.js` or `.native.scss` variant of the file is created. In some cases, platform specific files can be also found for Android (`.android.js`) or iOS (`.ios.js`).
## Mind the mobile
Our tooling isn't as good yet as we'd like to and it's hard to have a good awareness of those native mobile files. That means that contributors need to manually pay attention to update the native mobile files during code refactorings. For example, renaming a function or a prop should also be performed in the native modules too, otherwise, the mobile client will break. We are in the process of putting some more safeguards in place in PRs, but we're still far from done. Please bear with us and thank you in advance. ❤️🙇‍
## Debugging the native mobile unit tests
The native mobile unit tests are Jest tests written in JS and running on Node. That means, one doesn't need a mobile development environment to execute them. It also means that they can be debugged using typical dev tools. To run the tests locally in debug mode, follow these steps:
1. Run `npm run test-unit:native:debug` inside the Gutenberg root folder, on the CLI. Node is now waiting for the debugger to connect.
2. Open `chrome://inspect` in Chrome
3. Under the "Remote Target" section, look for a `../../node_modules/.bin/jest ` target and click on the "inspect" link. That will open a new window with the Chrome DevTools debugger attached to the process and stopped at the beginning of the `jest.js` file. Alternatively, if the targets are not visible, click on the `Open dedicated DevTools for Node` link in the same page.
4. You can place breakpoints or `debugger;` statements throughout the code, including the tests code, to stop and inspect
5. Click on the "Play" button to resume execution
6. Enjoy debugging the native mobile unit tests!