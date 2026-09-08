# iOS tests

XCUITest suites that drive Safari on an iOS simulator, for behavior only a
real touch device shows, such as auto-capitalization after Enter or where a
tap puts the caret.

Run them on macOS with Xcode and [xcodegen](https://github.com/yonaskolb/XcodeGen)
installed, after building the plugin:

```bash
npm run build
./test/ios/run.sh
```

The script serves the checkout with WordPress Playground, boots a simulator
and runs `xcodebuild test`. Screenshots of failures are in
`test/ios/build/results.xcresult`.

The editor lays out by viewport width, so each suite belongs to a device:

| Suite                     | Device   | Editor          |
| ------------------------- | -------- | --------------- |
| `AutoCapitalizationTests` | iPhone   | mobile layout   |
| `CaretPlacementTests`     | iPad     | desktop layout  |

Pick the device family with `SIMULATOR_DEVICE` (one device with
`SIMULATOR_UDID`) and the suite with an `xcodebuild` argument:

```bash
SIMULATOR_DEVICE=iPad ./test/ios/run.sh -only-testing:SafariTests/CaretPlacementTests
```
