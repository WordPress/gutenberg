# react-native-aztec

Wrapping Aztec Android and Aztec iOS in a React Native component

# License

GPL v2


## Directory structure

```
.
├── example
│   ├── android
│   ├── ios
│   ├── app.json
│   ├── index.android.js
│   ├── index.ios.js
│   └── package.json
├── android
│   └── src
│      └── main
│          └── java
│              └── org
│                  └── wordpress
│                      └── mobile
│                          └── ReactNativeAztec
│                              ├── ReactAztecBlurEvent.java
│                              ├── ReactAztecEndEditingEvent.java
│                              ├── ReactAztecFocusEvent.java
│                              ├── ReactAztecManager.java
│                              ├── ReactAztecPackage.java
│                              ├── ReactAztecText.java
│                              └── ReactAztecView.java
├── src
│   └── AztecView.js
├── index.js
├── ios
│   ├── Frameworks
│   ├── RNTAztecView
│   │      └── RCTAztecView.m
│   └── RNTAztecView.xcodeproj
├── package.json
├── LICENSE.md
└── README.md
```

If you have to change Android native code, you must have a look at the code in `android/src/main/java/` folder.

## Android: Run the example app

At the root folder, run:
```
$ yarn clean:install
```

Make sure to have an emulator running or an Android device connected, and then:

```
$ cd example/
$ yarn clean:install
$ yarn android
```

This will build the Android library (via `gradle`) and example app, then launch the main example activity on your connected device and run the Metro bundler at the same time.

## iOS: Run the example app

At the root folder, clean the library:
```
$ yarn clean:install
```

Then move to the example folder:
```
$ cd example/
```

Clean the example app and run it:
```
$ yarn clean:install
$ yarn ios
```

This will compile the example project, launch metro, run the simulator and run the app.

## FAQ / Troubleshooting

Q: The example app doesn't run

A: Make sure you have yarn and babel installed (https://yarnpkg.com/lang/en/docs/install/)


Q: The example app gets compiled but ReactNative cannot connect to Metro bundler (I'm on a real device attached through USB)

A: To debug on the device through USB, remember to revert ports before launching metro:
`adb reverse tcp:8081 tcp:8081`


Q: The example app gets compiled but ReactNative shows an error 

A: try running, from the root folder in the project
```
yarn clean
yarn
cd example/
yarn start --reset-cache
```

Open a new shell window and run either of these depending on the platform:

```
yarn android

```

or

```
yarn ios
```

