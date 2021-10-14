# A first-time setup guide to native mobile development (OSX)

Are you interested in contributing to native mobile development? This
guide is a detailed walk through designed to get you up and running!

Note that the following instructions here are primarily focused on the
OSX environment.

## Install Xcode

Install [Xcode](https://developer.apple.com/xcode/) via the app store. We'll be using
the XCode to both compile the iOS app and use the phone simulator app.

Once it has been installed from the App Store, open it by visiting `Applications > Xcode`

After opening the application:
* Accept the license agreement.
* Verify that `Xcode > Preferences > Locations > Command Line Tools` points at the current Xcode version.

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
nvm install lts/*
nvm alias default lts/* #sets this as the default when opening a new terminal
nvm use #switches to the project settings
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

If you have an existing Gutenberg checkout be sure to fully clean node_modules and re-install dependencies.
This may help avoid errors in the future.

```sh
npm run distclean
npm ci
```

## Unit Tests

Unit tests should work at this point.

```sh
npm run native test
```

## iOS

The easiest way to figure out what needs to be installed is using the
[react native doctor](https://reactnative.dev/blog/2019/11/18/react-native-doctor). From your checkout, or
relative to `/packages/react-native-editor folder`, run:

```sh
npx @react-native-community/cli doctor
```

[Add screenshot of cli doctor]

See if doctor can fix both "common" and "iOS" issues. At this stage "Android" will still have ❌s for items.

Once all common and iOS issues are resolved, try:

```
npm run native start:reset #starts metro
```

In another terminal type:
```
npm run native ios
```

After waiting for everything to build we should see:

[Add video of working iOS Simulator]

## Android

To keep things simple, let's use Android Studio for all JDK and SDK package management.
The first step is [downloading Android Studio](https://developer.android.com/studio).

Next, open an existing project and select the gutenberg folder you cloned:

Click on the cube with the down arrow:

[Add screenshot of Android studio with the icon annotated]

We can download SDK platforms, packages and other tools on this screen. Specific versions are
hidden behind the "Show package details" checkbox, check it, since our build requires specific versions for E2E and
development:

[Add screenshot of the package manager with the checkbox annotated]

Check all related packages from [build.gradle](https://github.com/WordPress/gutenberg/blob/trunk/packages/react-native-editor/android/build.gradle).
Then click on "Apply" to download items. There may be other related dependencies from build.gradle files in node_modules.
If you don’t want to dig through files, stack traces will complain of missing packages, but it does take quite a number
of tries if you go through this route.

[Add screenshot of example package list]

For good measure, let’s also set the project SDK in Android Studio in File > Project Structure

[Add screenshot of project structure]

Then set it to our current SDK target 29:

[Add screenshot of project settings]

### Update Paths

Export the following env variables and update $PATH. We can normally add this to our ` ~/.zshrc` file if we're using zsh
in our terminal, or `.bash_profile` if the terminal is still using bash.

```sh
export JAVA_HOME=/Applications/Android\ Studio.app/Contents/jre/jdk/Contents/Home
export ANDROID_HOME=/Users/{your-username}/Library/Android/sdk
export ANDROID_AVD_HOME=/Users/{your-username}/.android/avd
export ANDROID_SDK_ROOT=/Users/{your-username}/Library/Android/sdk
export ANDROID_NDK=/Users/{your-username}/Library/Android/ndk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

Save then source, or open a new terminal to pick up changes.
```sh
source ~/.zshrc
```
or
```sh
source ~/.bash_profile
```
### Create a new device image

Next, let’s create a virtual device image. Click on the phone icon with an android to the bottom-right.

[Add screenshot]

This brings up the “Android Virtual Device Manager” or (AVD). Click on “Create Virtual Device”.

[Add screenshot]

Pick a phone type of your choice:

[Add screenshot]

Pick the target SDK version. This is the targetSdkVersion set in the
[build.gradle](https://github.com/WordPress/gutenberg/blob/trunk/packages/react-native-editor/android/build.gradle) file.

[Add screenshot]

There are some advanced settings we can toggle, but these are optional. Click finish.

[Add screenshot]

### Putting it all together

Start metro:

```
npm run native start:reset
```

In another terminal run the following. The emulator doesn’t need to be launched previously.

```
npm run native android
```

After a bit of a wait, we’ll see something like this:

[Add video of a working env]

## Integration Tests

[Appium](https://appium.io/) has it own doctor tool. Run this with:

```sh
npx appium-doctor
```

[Add screenshot of appium doctor]

Resolve any required dependencies.

### iOS Integration Tests

If we know we can run the iOS local environment without issue, E2Es for iOS are straightforward. Stop any running metro processes.
This was launched previously with `npm run native start:reset`.

Then in terminal type:

```sh
npm run native test:e2e:ios:local
```

Passing a filename should also work to run a subset of tests:

```sh
npm run native test:e2e:ios:local gutenberg-editor-gallery.test.js
```

If all things go well, it should look like:

[Add video of working integration tests]

### Android Integration Tests

**Create a new virtual device()** that matches the device specified in [packages/react-native-editor/__device-tests__/helpers/caps.js](https://github.com/WordPress/gutenberg/blob/trunk/packages/react-native-editor/__device-tests__/helpers/caps.js#L30) At the time of this writing, this would be a Pixel 3 XL image, using Android 9 (API 28).

Start the virtual device first. Go back to the AVD by clicking on the phone icon, then click the green play button.

[Add screenshot]

Make sure no metro processes are running. This was launched previously with `npm run native start:reset`.

Then in a terminal run:

```sh
npm run native test:e2e:android:local
```

Passing a filename should also work to run a subset of tests:

```
npm run native test:e2e:android:local gutenberg-editor-gallery.test.js
```

After a bit of a wait we should see:

[Add video of working integration tests]
