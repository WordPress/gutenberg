
# react-native-react-native-gutenberg-bridge

## Getting started

`$ npm install react-native-react-native-gutenberg-bridge --save`

### Mostly automatic installation

`$ react-native link react-native-react-native-gutenberg-bridge`

### Manual installation


#### iOS

1. In XCode, in the project navigator, right click `Libraries` ➜ `Add Files to [your project's name]`
2. Go to `node_modules` ➜ `react-native-react-native-gutenberg-bridge` and add `RNReactNativeGutenbergBridge.xcodeproj`
3. In XCode, in the project navigator, select your project. Add `libRNReactNativeGutenbergBridge.a` to your project's `Build Phases` ➜ `Link Binary With Libraries`
4. Run your project (`Cmd+R`)<

#### Android

1. Open up `android/app/src/main/java/[...]/MainActivity.java`
  - Add `import com.reactlibrary.RNReactNativeGutenbergBridgePackage;` to the imports at the top of the file
  - Add `new RNReactNativeGutenbergBridgePackage()` to the list returned by the `getPackages()` method
2. Append the following lines to `android/settings.gradle`:
  	```
  	include ':react-native-react-native-gutenberg-bridge'
  	project(':react-native-react-native-gutenberg-bridge').projectDir = new File(rootProject.projectDir, 	'../node_modules/react-native-react-native-gutenberg-bridge/android')
  	```
3. Insert the following lines inside the dependencies block in `android/app/build.gradle`:
  	```
      compile project(':react-native-react-native-gutenberg-bridge')
  	```

#### Windows
[Read it! :D](https://github.com/ReactWindows/react-native)

1. In Visual Studio add the `RNReactNativeGutenbergBridge.sln` in `node_modules/react-native-react-native-gutenberg-bridge/windows/RNReactNativeGutenbergBridge.sln` folder to their solution, reference from their app.
2. Open up your `MainPage.cs` app
  - Add `using React.Native.Gutenberg.Bridge.RNReactNativeGutenbergBridge;` to the usings at the top of the file
  - Add `new RNReactNativeGutenbergBridgePackage()` to the `List<IReactPackage>` returned by the `Packages` method


## Usage
```javascript
import RNReactNativeGutenbergBridge from 'react-native-react-native-gutenberg-bridge';

// TODO: What to do with the module?
RNReactNativeGutenbergBridge;
```
  