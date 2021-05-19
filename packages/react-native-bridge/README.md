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
