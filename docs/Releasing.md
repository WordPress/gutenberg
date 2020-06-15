# Making a release

The `bundle` directory contains the production version of the project's Javascript. This is what the WordPress apps use to avoid having to build Gutenberg.

You can rebuild those files at any time by running

```
yarn bundle
```

This is useful in case you want to use an unreleased version of the bundle in the apps. For instance, on a PR that's a work in progress, you might want to include to a specific gutenberg-mobile branch in the apps with an updated bundle so reviewers can see the latest changes before approving them (and releasing a new version).

# Release Checklist Template

Just copy this checklist and replace all occurrences of `X.XX.X` with the applicable release number, when we are ready to
cut a new release.

```
<!-- wp:heading {"level":1} -->
<h1>Gutenberg Mobile X.XX.X – Release Scenario</h1>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>This checklist is based on the <a href="https://github.com/wordpress-mobile/gutenberg-mobile/blob/develop/docs/Releasing.md#release-checklist">Release Checklist Template</a>. If you need a checklist for a new gutenberg-mobile release, please copy from that template.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>+mobilegutenberg</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>Day 1 - create the release branch, update the version</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>o Visit all opened PR's in gutenberg-mobile repo that are assigned to milestone X.XX.X and leave proper message with options to merge them or to bump them to the next version.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>o In the <code>gutenberg-mobile</code> submodule, branch <code>develop</code> to the release branch (eg. <code>git checkout develop; git pull origin develop; git checkout -b release/X.XX.X</code>).</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>o Update the package.json file with the new version number, run: <code>yarn version</code> and enter the new version name when you get asked: <code>X.XX.X</code> (Changes will be committed automatically).</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>o Push the release branch, <code>git push origin release/X.XX.X</code>.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>o Create the gutenberg submodule branch: <code>cd gutenberg; git checkout -b rnmobile/release-X.XX.X</code>.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>o Push the gutenberg submodule branch: <code>git push origin rnmobile/release-X.XX.X</code>.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>o Make sure we use a released version of Aztec iOS and Aztec Android: <code>grep WordPress-Aztec-iOS RNTAztecView.podspec</code> and <code>grep aztecVersion react-native-aztec/android/build.gradle</code>(should be part of a <code>./release-check.sh</code> script). Also insure that the line for testing non-official versions of Aztec on iOS is commented out (this command should find a match: <code>grep "^s*#pod 'WordPress-Aztec-iOS'" ios/Podfile</code>)</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>o Open a PR based on the release branch in Gutenberg-Mobile and target master. Example PR: https://github.com/wordpress-mobile/gutenberg-mobile/pull/1627. There should not be any conflicts with this PR.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>o Create a new branch in the main WP apps (WordPress-iOS, WordPress-Android) named <code>gutenberg/integrate_release_X.XX.X</code>.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>o Use the commit hash of the head of the release branch in Gutenberg-Mobile as the reference for the main apps.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>o Create a PR in WPAndroid and WPiOS. Example on <a href="https://github.com/wordpress-mobile/WordPress-Android/pull/10863">WPAndroid</a>, <a href="https://github.com/wordpress-mobile/WordPress-iOS/pull/13010">WPiOS</a>. To write the PR description: pull the differences between previous and current releases. Update the RELEASE-NOTES.txt files in each PR (get info from the gutenberg-mobile RELEASE-NOTES.txt).</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>o In iOS update the file <code>Podfile</code> to point to the new hash in GB-Mobile and if needed also update the reference to Aztec to the new release. Then run <code>rake dependencies</code>, commit and push.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>o On Android update the git submodule reference for <code>libs/gutenberg-mobile</code> (<code>cd libs/gutenberg-mobile &amp;&amp; git checkout release/X.XX.X &amp;&amp; git pull origin release/X.XX.X &amp;&amp; cd .. &amp;&amp; git add gutenberg-mobile</code>) and run <code>python tools/merge_strings_xml.py</code> to update the main strings.xml file.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>o Create new branches <code>gutenberg/after_X.XX.X</code> in WPAndroid and WPiOS and keep them up to date with the release branches. These are to be doubles for develop on the main apps for mobile gutenberg dev’s WP app PR’s that didn’t or shouldn’t make it into the X.XX.X editor release.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>New Aztec Release</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>o Make sure there is no pending Aztec PR required for this Gutenberg release. Check the commit hash referred in the gutenberg repo is in the Aztec <code>develop</code> branch. If it's not, make sure pending PRs are merged before next steps.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>o Open a PR on Aztec repo to update the <code>CHANGELOG.md</code> and <code>README.md</code> files with the new version name.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>o Create a new release and name it with the tag name from step 1. For Aztec-iOS, follow <a href="https://github.com/wordpress-mobile/AztecEditor-iOS/blob/develop/Documentation/ReleaseProcess.md">this process</a>. For Aztec-Android, releases are created via the <a href="https://github.com/wordpress-mobile/AztecEditor-Android/releases">GitHub releases page</a> by hitting the “Draft new release” button, put the tag name to be created in the tag version field and release title field, and also add the changelog to the release description. The binary assets (.zip, tar.gz files) are attached automatically after hitting “Publish release”.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>(Optional) Specific tasks after a PR has been merged after the freeze</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>o After a merge happened in gutenberg-mobile <code>release/X.XX.X</code> or in gutenberg <code>rnmobile/release-X.XX.X</code>, make sure the <code>gutenberg</code> submodule points to the right hash (and make sure the <code>rnmobile/release-X.XX.X</code> in the gutenberg repo branch has been updated)</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>o If there were changes in Gutenberg repo, make sure to cherry-pick the changes that landed in the master branch back to the release branch.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>Last Day</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>o Make sure that the bundle files on the Gutenberg-Mobile release branch have been updated to include any changes to the release branch.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>o Merge the Gutenberg-Mobile PR to master. WARNING: Don’t merge the Gutenberg PR to master at this point.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>o Tag the head of Gutenberg release branch that the Gutenberg-Mobile release branch is pointing to with the <code>rnmobile/X.XX.X</code> tag.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>o Create a new GitHub release pointing to the tag: https://github.com/wordpress-mobile/gutenberg-mobile/releases/new?tag=X.XX.X&target=master&title=X.XX.X. Include a list of changes in the release's description</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>o In WPiOS update the reference to point to the <em>tag</em>. For iOS do not forget to remove ‘develop’ branch reference near 3rd party pod specs if any.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>o In WPAndroid, update the submodule to point to the merge commit on master.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>o Main apps PRs should be ready to merge to their develop now. Merge them or get them merged.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>o Once everything is merged, ping our friends in #platform9 and let them know we’ve merged our release so everything is right from our side to cut the main app releases.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>o Open a PR from Gutenberg-Mobile master to bring all the <code>gutenberg/after_X.XX.X</code> changes to <code>develop</code> and point to the Gutenberg side PR (if any changes happened specifically for the release). Merge the PR (or PR domino if Gutenberg changes are there)</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>AFTER the main apps have cut their release branches</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>o Update the <code>gutenberg/after_X.XX.X</code> branches and open a PR against <code>develop</code>. If the branches are empty we’ll just delete them. The PR can actually get created as soon as something gets merged to the after-ooo branches.&nbsp; Merge the <code>gutenberg/after_X.XX.X</code> PR(s) only AFTER the main apps have cut their release branches.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>You're done</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>o Pass the baton. Ping the dev who is responsible for the next release</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>o Celebrate!</p>
<!-- /wp:paragraph -->
```
