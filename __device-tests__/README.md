# Overview

We use [appium](http://appium.io/) combined with [SauceLabs](https://saucelabs.com/) as an on-device testing solution for covering writing flows using Gutenberg blocks.

Appium is built on the idea that testing native apps shouldn't require including an SDK or recompiling your app. And that you should be able to use your preferred test practices, frameworks, and tools. Appium is an open source project and has made design and tool decisions to encourage a vibrant contributing community.

SauceLabs is a cloud hosting platform that provides access to a variety of simulators, emulators and real devices. 

## Getting set up to run the tests

### Emulators && Simulators

iOS: Once you've already set up XCode and the simulators you should be good to go to run the tests on an iOS simulator.

Android: You'll need to have created the emulator images and fired up the desired emulator before running the tests against an Android emulator. 

### Real Devices 

TBA

## Running the tests locally

TLDR; to run the tests locally ensure metro isn't running and then run `yarn test:e2e:ios:local` and `yarn test:e2e:android:local` for the desired platform.

Those commands include the process to build a testable version of the app, if it's the case you don't want to run the 
full suite and want to run a specific file or files you can use the e2e build commands that can be found in the package.json for the respective platform and then 
run `TEST_RN_PLATFORM=android yarn device-tests <pattern>` where the pattern can just be the file path.

### Starting the Appium Server

One of the Caveats to using Appium is the need for the Appium server to be running to interact with the Simulator or Device through Webdriver, as a result the appium server will need to be started before running the tests. To make the entire process easier in the `beforeAll` block of the tests an Appium instance is fired up on a default port of 4723. If you already have something running on that port and would rather not stop that you can change the port within the code that starts that up. At the moment that port number is referenced from the config located at `__device-tests__/helpers/serverConfigs.js`. The process is killed in the `afterAll` block but at the time of writing this there's a small chance  some errors might cause it not to get there so it might be best to kill the process yourself if you think something is up. The server output when running the tests are written to `appium-out.log`, this can provide useful information when debugging the issues with the tests. 

### WebDriver capabilities 

Appium uses a config object that contains `capabilities` to define how it will connect to a simulator or device, this object is currently located in `__device-tests__/helpers/caps.js` and then referenced when firing up the driver. There are two values that I think are important to know and that's

- `platformVersion` which is the platform version of a connected adb device. e.g `9.0` for Android or `12.2` for iOS. The version used here is upper bounded by the max allowed on CI but feel free to change this value locally as needed. 
- `app` which is the absolute path to the `.app` or `.apk` file or the path relative to the **Appium root**. It's important to note that that when using the relative paths it's not to the project folder but to the appium server, since by default we start up appium in the project root when running the paths appear relative to the root but if you were using another instance of the Appium server the relative path would need to come from there.  

A full spec on the capabilities can be found [here](http://appium.io/docs/en/writing-running-appium/caps/). If you'd like to change configurations like
what port appium runs on or what device or emulator the tests should be executed on that file would be where you'd like to make that update.

## The run process 

At the moment when running locally, the app attempts to fire up an appium server and then connects to it via webdriver. Then 

* on Android, a debug version of the app is bundled, built, and used. 
* on iOS a release version is bundled built and used. 

**It's important to ensure that **metro is not running.** This would cause the value of the `__DEV__` variable to be true and load up the sample blocks.** 

After the build is complete, an appium server is fired up on port 4723 and the device tests are ran on the connected device/simulator. 

-----

To read more about writing your own tests please read the [contributing guide](https://github.com/wordpress-mobile/gutenberg-mobile/blob/develop/__device-tests__/CONTRIBUTING.md)
