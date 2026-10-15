# iOS tests

XCUITest suites that drive the editor on an iOS simulator, for behavior only
touch gestures show, such as selecting text with the selection handles.

The editor runs in a web view in the test app (`Host`), set up like Safari on
an iPhone: the keyboard covers the page instead of resizing it, the user agent
is Safari's, and every launch starts without cookies. The app launches the
same way every time, which Safari did not.

Run them on macOS with Xcode and [xcodegen](https://github.com/yonaskolb/XcodeGen)
installed and PHP 8 with SQLite, after building the plugin:

```bash
nvm use
npm run build
./test/ios/run.sh
```

The script installs WordPress with SQLite, serves it and the checkout with
PHP's built-in server, boots a simulator and runs `xcodebuild test`.
Screenshots of failures are in `test/ios/build/results.xcresult`.

The tests read the software keyboard, so the simulator must show one. A
simulator that has ever had a hardware keyboard connected keeps hiding the
software keyboard, and the tests then stop with "No software keyboard".
Erase that simulator (`xcrun simctl erase <udid>`) or pass a fresh one in
`SIMULATOR_UDID`.
