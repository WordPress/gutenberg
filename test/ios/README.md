# iOS tests

XCUITest suites that drive Safari on an iOS simulator, for behavior only
touch gestures show, such as selecting text with the selection handles.

Run them on macOS with Xcode and [xcodegen](https://github.com/yonaskolb/XcodeGen)
installed, on the Node version in `.nvmrc`, after building the plugin:

```bash
nvm use
npm run build
./test/ios/run.sh
```

The script serves the checkout with WordPress Playground, boots a simulator
and runs `xcodebuild test`. Screenshots of failures are in
`test/ios/build/results.xcresult`.

