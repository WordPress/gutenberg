# React Native mobile editor

The Gutenberg repository includes the source for the [React Native](https://facebook.github.io/react-native/) based editor for mobile.

## Mind the mobile

Contributors need to ensure that they update any affected native mobile files during code refactorings because we cannot yet rely on automated tooling to do this for us. For example, renaming a function or a prop should also be performed in the native modules too, otherwise, the mobile client will break. We have added some mobile specific CI tests as safeguards in place in PRs, but we're still far from done. Please bear with us and thank you in advance. ❤️🙇‍

## Native mobile specific files

The majority of the code shared with native mobile is in the very same JavaScript module and SASS style files. In the cases where the code paths need to diverge, a `.native.js` or `.native.scss` variant of the file is created. In some cases, platform specific files can be also found for Android (`.android.js`) or iOS (`.ios.js`).

## Running Gutenberg Mobile on Android and iOS

For instructions on how to run the **Gutenberg Mobile Demo App** on Android or iOS, see [Getting Started for the React Native based Mobile Gutenberg](/docs/contributors/code/react-native/getting-started-react-native.md)

Also, the mobile client is packaged and released via the [official WordPress apps](https://wordpress.org/mobile/). Even though the build pipeline is slightly different then the mobile demo apps and lives in its own repo for now ([here's the native mobile repo](https://github.com/wordpress-mobile/gutenberg-mobile)), the source code itself is taken directly from this repo and the "web" side codepaths.

## Native mobile E2E tests in Continuous Integration

If you encounter a failed Android/iOS test on your pull request, we recommend the following steps:

1. Re-running the failed GitHub Action job ([guide for how to re-run](https://docs.github.com/en/actions/configuring-and-managing-workflows/managing-a-workflow-run#viewing-your-workflow-history)) - This should fix failed tests the majority of the time. Cases where you need to re-run tests for a pass should go down in the near future as flakiness in tests is actively being worked on. See the following GitHub issue for updated info on known failures: https://github.com/WordPress/gutenberg/issues/23949
2. You can check if the test is failing locally by following the steps to run the E2E test on your machine from the [mobile getting started guide](/docs/contributors/code/react-native/getting-started-react-native.md#ui-tests), with even more relevant info in the [relevant directory README.md](https://github.com/WordPress/gutenberg/tree/HEAD/packages/react-native-editor/__device-tests__#running-the-tests-locally)
3. In addition to reading the logs from the E2E test, you can download a video recording from the Artifacts section of the GitHub job that may have additional useful information.
4. Check if any changes in your PR would require corresponding changes to `.native.js` versions of files.
5. Lastly, if you're stuck on a failing mobile test, feel free to reach out to contributors on Slack in the #mobile or #core-editor chats in the WordPress Core Slack, [free to join](https://make.wordpress.org/chat/).

## Debugging the native mobile unit tests

Follow the instructions in [Native mobile testing](/docs/contributors/code/react-native/integration-test-guide.md) to locally debug the native mobile unit tests when needed.

## Internationalization (i18n)

Further information about this topic can be found in the [React Native Internationalization Guide](/docs/contributors/code/react-native/internationalization-guide.md).