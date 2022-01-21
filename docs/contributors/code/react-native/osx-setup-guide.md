# Setup guide for React Native development (macOS)

Are you interested in contributing to the native mobile editor? This
guide is a detailed walk through designed to get you up and running!

Note that the following instructions here are primarily focused on the
macOS environment. For other environments, [the React Native quickstart documentation](https://reactnative.dev/docs/environment-setup)
has helpful pointers and steps for getting set up.

## Install Xcode

Install [Xcode](https://developer.apple.com/xcode/) via the app store. We'll be using
the XCode to both compile the iOS app and use the phone simulator app.

Once it has been installed from the App Store, open it by visiting `Applications > Xcode`

After opening the application:

-   Accept the license agreement.
-   Verify that `Xcode > Preferences > Locations > Command Line Tools` points at the current Xcode version.

<img src="https://developer.wordpress.org/files/2021/10/xcode-command-line-tools.png" width="500" alt="Screenshot of XCode command line tools settings.">

## Clone Gutenberg

If Xcode was installed successfully, we'll also have a version of git available. (It's possible to
update this later if we want to use a more recent version).

In a terminal run:

```sh
git clone git@github.com:WordPress/gutenberg.git
```

### Install node and npm

If you’re working in multiple JS projects, a node version manager may make sense. A manager will let you
switch between different node and npm versions of your choosing.

Some good options are [nvm](https://github.com/nvm-sh/nvm) or [volta](https://volta.sh/).

Pick one and follow the install instructions noted on their website.

Then run:

```sh
nvm install 'lts/*'
nvm alias default 'lts/*' # sets this as the default when opening a new terminal
nvm use # switches to the project settings
```

Or

```sh
volta install node #defaults to installing lts
```

Then install dependencies from your Gutenberg checkout folder:

```
npm ci
```

#### Do you have an older existing Gutenberg checkout?

If you have an existing Gutenberg checkout be sure to fully clean `node_modules` and re-install dependencies.
This may help avoid errors in the future.

```sh
pnpm distclean
npm ci
```

## Unit Tests

Unit tests should work at this point.

```sh
pnpm native test
```

## iOS

The easiest way to figure out what needs to be installed is using the
[react native doctor](https://reactnative.dev/blog/2019/11/18/react-native-doctor). From your checkout, or
relative to `/packages/react-native-editor folder`, run:

```sh
npx @react-native-community/cli doctor
```

<img src="https://developer.wordpress.org/files/2021/10/react-native-doctor.png" width="500px" alt="Screenshot of react-native-community/cli doctor tool running in the terminal.">

See if `doctor` can fix both "common" and "iOS" issues. (Don't worry if "Android" still has ❌s at this stage, we'll get to those later!)

Once all common and iOS issues are resolved, try:

```
pnpm native start:reset #starts metro
```

In another terminal type:

```
pnpm native ios
```

After waiting for everything to build we should see:

<img src="https://developer.wordpress.org/files/2021/10/iOS-Simulator.png" alt="Screenshot of the block editor in iOS simulator." />

## Android

To keep things simple, let's use Android Studio for all JDK and SDK package management.
The first step is [downloading Android Studio](https://developer.android.com/studio).

Next, open an existing project and select the gutenberg folder you cloned:

Click on the cube with the down arrow:

<img src="https://developer.wordpress.org/files/2021/10/react-native-package-manager.png" alt="Screenshot highlighting where the package manager button is located in Android Studio.">

We can download SDK platforms, packages and other tools on this screen. Specific versions are
hidden behind the "Show package details" checkbox, check it, since our build requires specific versions for E2E and
development:

<img src="https://developer.wordpress.org/files/2021/10/react-native-show-package-details.png" alt="Screenshot of the package manager in Android Studio, highlighting the Show Package Details checkbox.">

Check all related packages from [build.gradle](https://github.com/WordPress/gutenberg/blob/trunk/packages/react-native-editor/android/build.gradle).
Then click on "Apply" to download items. There may be other related dependencies from build.gradle files in node_modules.
If you don’t want to dig through files, stack traces will complain of missing packages, but it does take quite a number
of tries if you go through this route.

<img src="https://developer.wordpress.org/files/2021/10/react-native-editor-build-gradle.png" alt="Screenshot of the build.gradle configuration file.">

<img src="https://developer.wordpress.org/files/2021/10/react-native-sdk.png" width="500" alt="Screenshot of the package manager displaying SDK Platforms.">

<img src="https://developer.wordpress.org/files/2021/10/react-native-sdk-tools.png" width="500" alt="Screenshot of the package manager displaying SDK Tools.">

### Update Paths

Export the following env variables and update $PATH. We can normally add this to our ` ~/.zshrc` file if we're using zsh
in our terminal, or `~/.bash_profile` if the terminal is still using bash.

```sh
### Java that comes with Android Studio:
export JAVA_HOME=/Applications/Android\ Studio.app/Contents/jre/Contents/Home
### Android Home is configurable in Android Studio. Go to Preferences > System Settings > Android SDK
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

Save then source, or open a new terminal to pick up changes.

```sh
source ~/.zshrc
```

or

```sh
source ~/.bash_profile
```

If the SDK path can't be found, you can verify its location by visiting Android Studio > Preferences > System Settings > Android SDK

<img src="https://developer.wordpress.org/files/2021/10/sdk-path.png" alt="Screenshot of where the SDK Path may be found in Android Studio.">

### Create a new device image

Next, let’s create a virtual device image. Click on the phone icon with an android to the bottom-right.

<img src="https://developer.wordpress.org/files/2021/10/react-native-android-device-manager-button.png" alt="Screenshot of where to find the android device manager button.">

This brings up the “Android Virtual Device Manager” or (AVD). Click on “Create Virtual Device”. Pick a phone type of your choice:

<img src="https://developer.wordpress.org/files/2021/10/react-native-android-select-hardware.png" alt="Screenshot of the Virtual Device Configuration setup.">

Pick the target SDK version. This is the targetSdkVersion set in the
[build.gradle](https://github.com/WordPress/gutenberg/blob/trunk/packages/react-native-editor/android/build.gradle) file.

<img src="https://developer.wordpress.org/files/2021/10/react-native-adv-system-image.png" alt="Screenshot of picking a system image in the Android Device Manager workflow.">

There are some advanced settings we can toggle, but these are optional. Click finish.

### Putting it all together

Start metro:

```
pnpm native start:reset
```

In another terminal run the following to launch the demo app in the Android emulator (if the emulator isn't already running, it'll also be launched as part of this command):

```
pnpm native android
```

After a bit of a wait, we’ll see something like this:

<img src="https://developer.wordpress.org/files/2021/10/android-simulator.png" alt="Screenshot of a the block editor in Android Simulator.">

## Integration Tests

[Appium](https://appium.io/) has it own doctor tool. Run this with:

```sh
npx appium-doctor
```

<img src="https://developer.wordpress.org/files/2021/10/CleanShot-2021-10-27-at-15.20.16.png" width="500px" alt="Screenshot of the appium-doctor tool running in the terminal.">

Resolve any required dependencies.

### iOS Integration Tests

If we know we can run the iOS local environment without issue, E2Es for iOS are straightforward. Stop any running metro processes.
This was launched previously with `pnpm native start:reset`.

Then in terminal type:

```sh
pnpm native test:e2e:ios:local
```

Passing a filename should also work to run a subset of tests:

```sh
pnpm native test:e2e:ios:local gutenberg-editor-gallery.test.js
```

If all things go well, it should look like:

<video src="https://user-images.githubusercontent.com/1270189/137403353-2a8ded47-5c7c-4f99-b2cc-fa6def4b4990.mp4" data-canonical-src="https://user-images.githubusercontent.com/1270189/137403353-2a8ded47-5c7c-4f99-b2cc-fa6def4b4990.mp4" controls="controls" muted="muted" class="d-block rounded-bottom-2 width-fit" style="max-height:640px;" alt="A video of block editor integration tests in iOS Simulator"></video>

### Android Integration Tests

**Create a new virtual device()** that matches the device specified in [packages/react-native-editor/**device-tests**/helpers/caps.js](https://github.com/WordPress/gutenberg/blob/trunk/packages/react-native-editor/__device-tests__/helpers/caps.js#L30) At the time of this writing, this would be a Pixel 3 XL image, using Android 9 (API 28).

Start the virtual device first. Go back to the AVD by clicking on the phone icon, then click the green play button.

<img src="https://developer.wordpress.org/files/2021/10/adv-integration.png" alt="A screenshot of how to start the Android Simulator.">

Make sure no metro processes are running. This was launched previously with `pnpm native start:reset`.

Then in a terminal run:

```sh
pnpm native test:e2e:android:local
```

Passing a filename should also work to run a subset of tests:

```
pnpm native test:e2e:android:local gutenberg-editor-gallery.test.js
```

After a bit of a wait we should see:

<img src="https://developer.wordpress.org/files/2021/10/CleanShot-2021-10-27-at-15.28.22.png" alt="A screenshot of block editor integration tests in Android Simulator.">
