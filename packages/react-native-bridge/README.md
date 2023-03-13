# react-native-gutenberg-bridge

## Getting started

This package is not yet published to npm. You can use it locally:

`$ npm install ./gutenberg/packages/react-native-bridge --save`

### Mostly automatic installation

`$ react-native link @wordpress/react-native-bridge`

### Manual installation

#### iOS

1. In XCode, in the project navigator, right click `Libraries` ➜ `Add Files to [your project's name]`
2. Go to `node_modules` ➜ `react-native-bridge` and add `RNReactNativeGutenbergBridge.xcodeproj`
3. In XCode, in the project navigator, select your project. Add `libRNReactNativeGutenbergBridge.a` to your project's `Build Phases` ➜ `Link Binary With Libraries`
4. Run your project (`Cmd+R`)<

#### Android

1. Open up `android/app/src/main/java/[...]/MainActivity.java`

-   Add `import com.reactlibrary.RNReactNativeGutenbergBridgePackage;` to the imports at the top of the file
-   Add `new RNReactNativeGutenbergBridgePackage()` to the list returned by the `getPackages()` method

2. Append the following lines to `android/settings.gradle`:
    ```
    include ':@wordpress_react-native-bridge'
    project(':@wordpress_react-native-bridge').projectDir = new File(rootProject.projectDir, './gutenberg/packages/react-native-bridge/android')
    ```
3. Insert the following lines inside the dependencies block in `android/app/build.gradle`:
    ```
      implementation project(':@wordpress_react-native-bridge')
    ```

## Usage

```javascript
import RNReactNativeGutenbergBridge from '@wordpress/react-native-bridge';

// TODO: What to do with the module?
RNReactNativeGutenbergBridge;
```

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
