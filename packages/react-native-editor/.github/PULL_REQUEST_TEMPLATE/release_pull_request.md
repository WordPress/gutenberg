Release for Gutenberg Mobile v1.XX.Y

## Related PRs

- Gutenberg: https://github.com/WordPress/gutenberg/pull/
- WPAndroid: https://github.com/wordpress-mobile/WordPress-Android/pull/
- WPiOS: https://github.com/wordpress-mobile/WordPress-iOS/pull/

- Aztec-iOS: https://github.com/wordpress-mobile/AztecEditor-iOS/pull/
- Aztec-Android: https://github.com/wordpress-mobile/AztecEditor-Android/pull

## Extra PRs that Landed After the Release Was Cut

- [ ]  PR 1
- [ ]  PR 2

## Changes
<!-- To determine the changes you can check the RELEASE-NOTES.txt file and cross check with the list of commits that are part of the PR -->

 - Change 1
 - Change 2

## Test plan

- Use the main WP apps to test the changes above. 
- Check WPAndroid and WPiOS PRs if there are specific tests to run.
- Smoke test the main WP apps for [general writing flow](https://github.com/wordpress-mobile/test-cases/tree/master/test-cases/gutenberg/writing-flow).

## Release Submission Checklist

- [ ] Release number was bumped
- [ ] Aztec dependencies are pointing to a stable release
  - iOS: 'grep WordPressAztec-iOS RNTAztecView.podspec'
  - Android: 'grep aztecVersion react-native-aztec/android/build.gradle'
- [ ] Gutenberg 'Podfile' and 'Podfile.lock' inside './ios/' are updated to the release number
- [ ] Bundle package of the release is updated 
- [ ] Check if `RELEASE-NOTES.txt` is updated with all the changes that made it to the release

