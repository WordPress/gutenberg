# iOS tests

XCUITest suites that drive Safari on an iOS simulator, for behavior only the
iOS keyboard shows, such as auto-capitalization after Enter.

Run them on macOS with Xcode and [xcodegen](https://github.com/yonaskolb/XcodeGen)
installed, after building the plugin:

```bash
npm run build
./test/ios/run.sh
```

The script serves the checkout with WordPress Playground, boots a simulator
and runs `xcodebuild test`. Screenshots of failures are in
`test/ios/build/results.xcresult`.
