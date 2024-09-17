<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

<!--
For each user feature we should also add a importance categorization label  to indicate the relevance of the change for end users of GB Mobile. The format is the following:
[***] → Major new features, significant updates to core flows, or impactful fixes (e.g. a crash that impacts a lot of users) — things our users should be aware of.

[**] → Changes our users will probably notice, but doesn’t impact core flows. Most fixes.

[*] → Minor enhancements and fixes that address annoyances — things our users can miss.
-->

## Unreleased


## 1.121.0
-   [internal] Fix Inserter items list filtering [#62334]
-   [*] Prevent hiding the keyboard when creating new list items [#62446]
-   [*] Fix issue when pasting HTML content [#62588]
-   [**] Add support prefix transforms [#62576]
-   [*] Remove themes from supported endpoints [#63183]

## 1.120.1

-   [*] RichText - Fix undefined onDelete callback [#62486]

## 1.120.0

-   [*] Prevent deleting content when backspacing in the first Paragraph block [#62069]
-   [internal] Adds new bridge functionality for updating content [#61796]

## 1.119.1

-   [*] Image corrector - Check the path extension is a valid one [#62190]
-   [*] Unsupported block - UI improvements [#62240]

## 1.119.0

-   [internal] Remove circular dependencies within the components package [#61102]
-   [internal] Upgrade target sdk version to Android API 34 [#61727]

## 1.118.0

-   [*] Fix a crash when pasting file images and special comment markup [#60476]
-   [*] Update Aztec to v2.1.2 [#61007]
-   [*] KeyboardAwareFlatList - Enable FlatList virtualization for iOS [#59833]

## 1.117.0

-   [*] Add empty fallback option for the BottomSheetSelectControl component [#60333]
-   [*] Fix Quote Block styles [#60476]
-   [*] Prevent passing potential false values to the onPress prop [#60595]
-   [*] ColorPalette - Check for ScrollView reference [#60562]
-   [*] Raw Handling - msListIgnore - Check attributes are valid [#60375]

## 1.116.0

-   [**] Highlight color formatting style improvements [#57650]

## 1.115.0

-   [*] Improve consistency of the block outline indicating the currently selected block [#59415]
-   [*] Gallery block items with in-progress, paused, or failed media uploads correctly display an highlight outline when selected [#59423]
-   [**] [internal] Upgrade React Native to version 0.73.3 [#58475]
-   [**] Add error boundary components and exception logging [#59221]
-   [**] Fix crash occurring when the URL associated with a Video block is changed too quickly [#59841]
-   [**] Enable setting HTML anchor IDs for all supported block types [#59802]

## 1.114.1

-   [**] Fix a crash produced when the content of a synced pattern is updated [#59632]

## 1.114.0

-   [*] Prevent crash when autoscrolling to blocks [#59110]
-   [*] Remove opacity change when images are being uploaded [#59264]
-   [*] Media & Text blocks correctly show an error message when the attached video upload fails [#59288]

## 1.112.0

-   [*] [internal] Upgrade React Native to version 0.71.15 [#57667]
-   [**] Prevent images from temporarily disappearing when uploading media [#57869]
-   [**] Fix crash occurring on large post on Android [#58266]

## 1.111.2

-   [*] [internal] Remove `mediaFilesCollectionBlock` initial prop [#58140]

## 1.111.1

-   [**] Video block: Fix logic for displaying empty state based on source presence [#58015]
-   [**] Fix crash when RichText values are not defined [#58088]

## 1.111.0

-   [**] Image block media uploads display a custom error message when there is no internet connection [#56937]
-   [*] Fix missing custom color indicator for custom gradients [#57605]
-   [**] Display a notice when a network connection unavailable [#56934]

## 1.110.1

-   [**] Fix crash when RichText values are not defined [#58088]

## 1.110.0

-   [*] [internal] Move InserterButton from components package to block-editor package [#56494]
-   [*] [internal] Move ImageLinkDestinationsScreen from components package to block-editor package [#56775]
-   [*] Fix crash when blockType wrapperProps are not defined [#56846]
-   [*] Guard against an Image block styles crash due to null block values [#56903]
-   [**] Fix crash when sharing unsupported media types on Android [#56791]
-   [**] Fix regressions with wrapper props and font size customization [#56985]
-   [***] Avoid keyboard dismiss when interacting with text blocks [#57070]
-   [**] Auto-scroll upon block insertion [#57273]
-   [*] Unselect blocks using the hardware back button (Android) [#57279]

## 1.109.3

-   [**] Fix duplicate/unresponsive options in font size settings. [#56985]

## 1.109.2

-   [**] Fix issue related to text color format and receiving in rare cases an undefined ref from `RichText` component [#56686]
-   [**] Fixes a crash on pasting MS Word list markup [#56653]
-   [**] Address rare cases where a null value is passed to a heading block, causing a crash [#56757]
-   [**] Fixes a crash related to HTML to blocks conversion when no transformations are available [#56723]
-   [**] Fixes a crash related to undefined attributes in `getFormatColors` function of `RichText` component [#56684]
-   [**] Fixes an issue with custom color variables not being parsed when using global styles [#56752]

## 1.109.1

-   [***] Fix issue when backspacing in an empty Paragraph block [#56496]

## 1.109.0

-   [*] Audio block: Improve legibility of audio file details on various background colors [#55627]
-   [*] In the deeply nested block warning, only display the ungroup option for blocks that support it [#56445]

## 1.108.0

-   [*] Fix error when pasting deeply nested structure content [#55613]
-   [*] Fix crash related to accessing undefined value in `TextColorEdit` [#55664]

## 1.107.0

-   [*] Social Icons: Fix visibility of inactive icons when used with block based themes in dark mode [#55398]
-   [*] Synced Patterns: Fix visibility of heading section when used with block based themes in dark mode [#55399]
-   [*] Classic block: Add option to convert to blocks [#55461]

## 1.106.0

-   [*] Exit Preformatted and Verse blocks by triple pressing the Return key [#53354]
-   [*] Fix quote block border visibility when used with block based themes in dark mode [#54964]

## 1.105.0

-   [*] Limit inner blocks nesting depth to avoid call stack size exceeded crash [#54382]
-   [*] Prevent crashes when setting an invalid media URL for Video or Audio blocks [#54834]
-   [**] Fallback to Twitter provider when embedding X URLs [#54876]
-   [*] [internal] Update Ruby version from 2.7.4 to 3.2.2 [#54897]

## 1.104.0

-   [*] Fix the obscurred "Insert from URL" input for media blocks when using a device in landscape orientation. [#54096]
-   [**] RichText - Update logic for the placeholder text color [#54259]

## 1.103.3

-   [*] Bump `WordPress-Aztec-iOS` version to `1.19.9` [#54456]

## 1.103.2

-   [*] Fix issue with missing characters in Add Media placeholder button [#54281]

## 1.103.1

-   [**] Fix long-press gestures not working in RichText component [Android] [#54213]

## 1.103.0

-   [**] Replace third-party dependency react-native-hsv-color-picker with first-party code [#53329]
-   [*] Search Control - Prevent calling TextInput's methods when undefined [#53745]
-   [*] Improve horizontal rule styles to avoid invisible lines [#53883]
-   [*] Fix horizontal rule style extensions [#53917]
-   [*] Add block outline to all Social Link blocks when selected [#54011]
-   [*] Columns block - Fix transforming into a Group block crash [#54035]
-   [*] Fix Social Icons block alignment [#54100]

## 1.102.1

-   [**] Fix Voice Over and assistive keyboards [#53895]

## 1.102.0

-   [*] Display custom color value in mobile Cover Block color picker [#51414]
-   [**] Display outline around selected Social Link block [#53377]
-   [**] Fixes font customization not getting updated on iOS [#53391]

## 1.101.2

-   [**] Fix Voice Over and assistive keyboards [#53895]

## 1.101.1

-   [**] Fix the dynamic height when opening/closing navigation screens within the bottom sheet. [https://github.com/WordPress/gutenberg/pull/53608]

## 1.101.0

-   [*] Remove visual gap in mobile toolbar when a Gallery block is selected [#52966]
-   [*] Remove Gallery caption button on mobile [#53010]
-   [**] Upgrade React Native to 0.71.11 [#51303]
-   [*] Upgrade Gradle to 8.2.1 & AGP to 8.1.0 [#52872]
-   [*] Fix Gallery block selection when adding media [#53127]

## 1.100.2

-   [**] Fix iOS Focus loop for RichText components [#53217]

## 1.100.1

-   [**] Add WP hook for registering non-core blocks [#52791]

## 1.100.0

-   [**] Add media inserter buttons to editor toolbar [#51827]
-   [**] Update native BlockOutline component styles to remove blue border from blocks [#51222]
-   [**] Move the undo/redo buttons to the navigation bar [#51766]
-   [**] Update Editor block inserter button styles and default text input placeholder/selection styles [#52269]
-   [**] Update Editor toolbar icons and colors [#52336]
-   [*] Update Block Settings button border [#52715]

## 1.99.1

-   [**] Fix crash related to removing a block under certain conditions [#52595]

## 1.99.0

-   [*] Rename "Reusable blocks" to "Synced patterns", aligning with the web editor. [#51704]
-   [**] Fix a crash related to Reanimated when closing the editor [#52320]

## 1.98.1

-   [*] fix: Display heading level dropdown icons and labels [#52004]

## 1.98.0

-   [*] Image block - Fix issue where in some cases the image doesn't display the right aspect ratio [#51463]
-   [*] Fix cursor positioning when dictating text on iOS [#51227]

## 1.97.1

-   [**] Fix crash when using the delete key to remove a single button [#51435]
-   [*] Ensure text input field is not editable when Bottom sheet cell is disabled [#51567]

## 1.97.0

-   [**] [iOS] Fix dictation regression, in which typing/dictating at the same time caused content loss. [#49452]
-   [*] [internal] Upgrade compile and target sdk version to Android API 33 [#50731]
-   [*] Display lock icon in disabled state of `Cell` component [#50907]

## 1.96.1

-   [**] Fix Android-only issue related to block toolbar not being displayed on some blocks in UBE [#51131]

## 1.96.0

-   [**] Tapping on all nested blocks gets focus directly instead of having to tap multiple times depending on the nesting levels. [#50672]
-   [*] Add disabled style to `Cell` component [#50665]
-   [**] Fix undo/redo history when inserting a link configured to open in a new tab [#50460]
-   [*] [List block] Fix an issue when merging a list item into a Paragraph would remove its nested list items. [#50701]

## 1.95.0

-   [*] Fix crash when trying to convert to regular blocks an undefined/deleted reusable block [#50475]
-   [**] Tapping on nested text blocks gets focus directly instead of having to tap multiple times depeding on the nesting levels. [#50108]
-   [*] Use host app namespace in reusable block message [#50478]
-   [**] Configuring a link to open in a new tab no longer results in a partial loss of edit history (undo and redo) [#50460]

## 1.94.0

-   [*] Split pasted content between title and body. [#37169]

## 1.93.1

-   [**] Fix regression with the Color hook and ColorPanel. [#49917]

## 1.93.0

-   [***] [iOS] Fixed iOS scroll jumping issue by refactoring KeyboardAwareFlatList improving writing flow and caret focus handling. [#48791]

## 1.92.1

-   [*] Avoid empty Gallery block error [#49557]

## 1.92.0

-   No user facing changes.

## 1.91.0

-   [*] Allow new block transformations for most blocks. [#48792]

## 1.90.0

-   [*] Fix parsing of css units for null matched values [#48484]
-   [*] Spacer block - Add initial support for spacing presets [#47258]
-   [*] Support Visual Regression testing [#47845]
-   [*] Add metadata parameter to media upload events [#48103]

## 1.89.1

-   [*] Fix inaccessible block settings within the unsupported block editor [#48435]

## 1.89.0

-   No user facing changes.

## 1.88.0

-   [*] Bump Android `minSdkVersion` to 24 [#47604]
-   [*] Update React Native Reanimated to 2.9.1-wp-3 [#47574]
-   [*] Bump Aztec version to `1.6.3` [#47610]

## 1.87.3

-   [*] Fix insert blocks not handling raw string properly in unsupported block editor [#47472]

## 1.87.2

-   [*] Add boolean contentStyle and clientId check to Column Edit InnerBlocks [#47234]
-   [*] Line-height and font-size regression fixes [#47284]

## 1.87.1

-   [**] Gallery block: Address styling regression, in which negative margin was added [#47086]
-   [*] RichText - Parse CSS values and avoid setting undefined ones [#47080]

## 1.87.0

-   [*] Add capabilities to force only Core blocks and control Support section [#46215]

## 1.86.1

-   [*] Block Actions Menu - Fix block title regression and adds integration tests [#46699]

## 1.86.0

-   [**] Upgrade React Native to 0.69.4 [#43485]
-   [**] Prevent error message from unneccesarily firing when uploading to Gallery block [#46175]

## 1.85.1

-   [**] Prevent error message from unneccesarily firing when uploading to Gallery block [#46175]

## 1.85.0

-   [*] [iOS] Fixed iOS Voice Control support within Image block captions. [#44850]

## 1.84.1

-   [**] Native inner blocks merge where appropriate [#45048]

## 1.84.0

-   [*] Upgrade compile and target sdk version to Android API 31 [#44610]
-   [*] [iOS] Fixed iOS Voice Control support within Image block captions. [#44850]

## 1.83.0

-   No user facing changes.

## 1.82.1

-   [**] List block v2: Fix issues splitting or merging paragraphs into the block [#43949]

## 1.82.0

-   [*] [iOS] Explicitly set tint color for action sheets to always be blue [#43759]

## 1.81.2

-   [**] List V2 - Prevent error when list is empty [#43861]

## 1.81.1

-   [*] List block v2: Fix text color inconsistencies with list items [#43244]
-   [*] Use default placeholder text color for native List Item [#43353]
-   [**] Add BlockListCompact [#43431]
-   [*] Fix dynamic React Native version [#43058]
-   [**] Disable FastImage on Android [#43322]

## 1.81.0

-   [***] List block V2 [#42702]

## 1.80.1

-   [*] Image - Workaround for Android and orientation changes [#42900]

## 1.80.0

-   [*] Add React Native FastImage [#42009]
-   [*] Block inserter displays block collections [#42405]
-   [*] Fix incorrect spacing within Image alt text footnote [#42504]
-   [***] Gallery and Image block - Performance improvements [#42178]

## 1.79.1

-   [**] Fix a crash when scrolling posts containing Embed blocks (Android 12 only) [#42514]

## 1.79.0

-   [*] Add 'Insert from URL' option to Video block [#41493]
-   [*] Image block copies the alt text from the media library when selecting an item [#41839]
-   [*] Introduce "block recovery" option for invalid blocks [#41988]

## 1.78.1

-   [**] Re-introduce support for v1 of the Gallery block to the native version of the editor [#41533]
-   [**] Fix missing translations for locales that include region (only on Android) [#41685]

## 1.78.0

-   [*] Bump react-native-gesture-handler to version 2.3.2 [#41337]

## 1.77.1

-   [***] Fix crash on iOS related to JSI and Reanimated [#41482]

## 1.77.0

-   [*] [a11y] Improve text read by screen readers for BottomSheetSelectControl [#41036]
-   [*] Add 'Insert from URL' option to Image block [#40334]

## 1.76.3

-   [***] Fix crash on iOS related to JSI and Reanimated [#41482]

## 1.76.2

-   [*] Ensure post title gets focused when is notified from native side [#41371]

## 1.76.1

-   [*] BlockList - Add internal onLayout from CellRendererComponent to BlockListItemCell [#41105]
-   [*] Fix Drag & Drop Chip positioning issue with RTL languages [#41053]
-   [*] Add drag & drop help guide in Help & Support screen [#40961]
-   [**] Fix drag mode not being enabled when long-pressing over Shortcode block [#41155]

## 1.76.0

-   [**] [Buttons block] Fix Android-only issue related to displaying formatting buttons after closing the block settings [#40725]
-   [**] [Cover block] Improve color contrast between background and text [#40691]
-   [*] [Gallery block] Fix broken "Link To" settings and add "Image Size" settings [#40947]
-   [***] Add drag & drop blocks feature [#40424]

## 1.75.0

-   [*] [Latest Posts block] Add featured image settings [#39257]
-   [*] Prevent incorrect notices displaying when switching between HTML-Visual mode quickly [#40415]
-   [*] [Embed block] Fix inline preview cut-off when editing URL [#35326]
-   [*] [iOS] Prevent gaps shown around floating toolbar when using external keyboard [#40266]

## 1.74.1

-   [**] RichText - Set a default value for selection values [#40581]

## 1.74.0

-   [**] [Quote block] Adds support for V2 behind a feature flag [#40133]
-   [**] Update "add block" button's style in default editor view. [#39726]
-   [*] Remove banner error notification on upload failure [#39694]

## 1.73.1

-   [*] [Spacer block] Fix crash when changing the height value using the text input [#40053]

## 1.73.0

-   [*] Update react-native-reanimated version to 2.4.1 [#39430]
-   [*] Upgrade Gradle to 7.4 & AGP to 7.1.1 [#39508]
-   [*] Add waits to fix editor test flakiness [#39668]

## 1.72.1

-   [*] Detect GIF badge during render [#39882]

## 1.72.0

-   [*] Add GIF badge for animated GIFs uploaded to Image blocks [#38996]
-   [*] Small refinement to media upload errors, including centring and tweaking copy. [#38951]
-   [*] Update gesture handler and reanimated libraries [#39098]
-   [*] Fix issue with list's starting index and the order [#39354]

## 1.71.3

-   [*] Fix autocorrected Headings applying bold formatting on iOS [#38633]
-   [***] Support for multiple color palettes [#38417]

## 1.71.1

-   [*] Highlight text: Check if style attribute value is defined during filtering [#38670]

## 1.71.0

-   [*] Image block: Replacing the media for an image set as featured prompts to update the featured image [#34666]
-   [***] Font size and line-height support for text-based blocks used in block-based themes [#38205]

## 1.70.3

-   [*] Highlight text: Check if style attribute value is defined during filtering [#38670]

## 1.70.2

-   [**] Rich Text - Validate link colors [#38474]

## 1.70.1

-   [**] [Gallery block] Fix crash when adding images and selecting a gallery item [#38238]

## 1.70.0

-   [**] Fix content justification attribute in Buttons block [#37887]
-   [*] Hide help button from Unsupported Block Editor. [#37221]
-   [*] Add contrast checker to text-based blocks [#34902]
-   [*] [Image block] Fix missing translations [#37956]
-   [*] Fix cut-off setting labels by properly wrapping the text [#37993]
-   [*] Highlight text: fix applying formatting for non-selected text [#37915]
-   [*] Fix missing translations of color settings [#38026]

## 1.69.1

-   [*] Fix app freeze when closing link picker while virtual keyboard is hidden [#37782]
-   [*] Gallery block - Fix bug when migrating from old galleries format [#37889]
-   [*] RichText - Use parsed font size values when comparing new changes [#37951]

## 1.69.0

-   [*] Give multi-line block names central alignment in inserter [#37185]
-   [**] Fix empty line apperaing when splitting heading blocks on Android 12 [#37279]
-   [**] Fix missing translations by refactoring the editor initialization code [#37073]
-   [**] Fix text formatting mode lost after backspace is used [#37676]
-   [*] Fix app freeze when closing link picker while virtual keyboard is hidden [#37782]

## 1.68.0

-   [**] Fix undo/redo functionality in links when applying text format [#36861]
-   [**] [iOS] Fix scroll update when typing in RichText component [#36914]
-   [*] [Preformatted block] Fix an issue where the background color is not showing up for standard themes [#36883]
-   [**] Update Gallery Block to default to the new format and auto-convert old galleries to the new format [#36191]
-   [***] Highlight text - enables color customization for specific text within a Paragraph block [#36028]

## 1.67.0

-   [**] Adds Clipboard Link Suggestion to Image block and Button block [#35972]
-   [*] [Embed block] Included Link in Block Settings [#36099]
-   [**] Fix tab titles translation of inserter menu [#36534]
-   [*] [Media & Text block] Fix an issue where the text font size would be bigger than expected in some cases [#36570]
-   [**] [Gallery block] When a gallery block is added, the media options are auto opened for v2 of the Gallery block. [#36757]

## 1.66.0

-   [**] [Image block] Add ability to quickly link images to Media Files and Attachment Pages [#34846]
-   [*] Fixed a race condition when autosaving content (Android) [#36072]

## 1.65.1

-   [**] Fixed a crash that could occur when copying lists from Microsoft Word. [https://github.com/WordPress/gutenberg/pull/36019]

## 1.65.0

-   [**] Search block - Text and background color support [#35511]
-   [*] [Embed Block] Fix loading glitch with resolver resolution approach [#35798]
-   [*] Fixed an issue where the Help screens may not respect an iOS device's notch. [#35570]
-   [**] Block inserter indicates newly available block types [#35201]
-   [*] Add support for the Mark HTML tag [#35956]

## 1.64.1

-   [**] Fix updating the block list after block removal [#35721]
-   [**] Cover block: Change dimRatio to 50 if media added and dimRatio is set to 100 [#35792]

## 1.64.0

-   [*] [Embed block] Fix inline preview cut-off when editing URL [#35321]
-   [**] [Embed block] Detect when an embeddable URL is pasted into an empty paragraph. [#35204]
-   [*] [Unsupported Block Editor] Fix text selection bug for Android [#34668]
-   [*] [Embed block] Fix URL not editable after dismissing the edit URL bottom sheet with empty value [#35460]
-   [**] Pullquote block - Added support for text and background color customization [#34451]
-   [**] Preformatted block - Added support for text and background color customization [#35314]

## 1.63.1

-   [*] Fixed missing modal backdrop for Android help section [#35557]
-   [*] Fixed erroneous overflow within editor Help screens. [#35552]

## 1.63.0

-   [**] [Embed block] Add the top 5 specific embed blocks to the Block inserter list [#34967]
-   [*] Embed block: Fix URL update when edited after setting a bad URL of a provider [#35013]
-   [**] Users can now contact support from inside the block editor screen. [#34890]

## 1.62.2

-   Same as 1.62.1 but with the changelog.

## 1.62.1

-   [**] Image block: fix height and border regression. [#34957]
-   [**] Column block: fix width attribute float cut off. [#34604]

## 1.62.0

-   [**] [Embed block] Implement WP embed preview component [#34004]
-   [*] [Embed block] Fix content disappearing on Android when switching light/dark mode [#34207]
-   [*] Embed block: Add device's locale to preview content [#33858]
-   [**] Fix Android-only issue of main toolbar initial position being wrong when RTL [#34617]
-   [**] Embed block: Implemented the No Preview UI when an embed is successful, but we're unable to show an inline preview [#34626]
-   [*] Column block: Translate column width's control labels [#34777]
-   [**] Enable embed preview for Instagram and Vimeo providers. [#34563]
-   [**] Embed block: Add error bottom sheet with retry and convert to link actions. [#34604]

## 1.61.2

-   [*] Image block - Fix height and border regression. [#34957]

## 1.61.1

-   [*] Fix crash related to reusable blocks in the block picker. [#34873]

## 1.61.0

-   [**] Enable embed preview for a list of providers (for now only YouTube and Twitter) [#34446]
-   [***] Inserter: Add Inserter Block Search [https://github.com/WordPress/gutenberg/pull/33237]

## 1.60.1

-   [*] RNmobile: Fix the cancel button on Block Variation Picker / Columns Block. [#34249]
-   [*] Column block: Fix Android close button alignment. [#34332]

## 1.60.0

-   [**] Embed block: Add "Resize for smaller devices" setting. [#33654]

## 1.59.2

-   [*] Inserter: Prevent non-deterministic order of inserter items [#34078]
-   [*] Fix missing block title of core/latest-posts block [#34116]

## 1.59.1

-   [*] Global styles - Add color to the block styles filter list [#34000]
-   [*] Rich text - toTree - Add check in replacements before accessing its type [#34020]

## 1.59.0

-   [*] [Android] Fix UBE's inaccessible "more" toolbar item. [#33740]
-   [*] Image block: Add a "featured" banner and ability to set or remove an image as featured. (iOS only) [#31345]

## 1.58.3

-   [*] Rich text - toTree - Add check in replacements before accessing its type [#34020]

## 1.58.2

-   [*] Fix issue with text input in alt text settings [#33845]

## 1.58.1

-   [*] Global styles: Check for undefined values and merge user colors [#33707]
-   [*] [Embed block] Disable paragraph transform [#33745]

## 1.58.0

-   [***] New Block: Embed block. [#33452]

## 1.57.0

-   [*] Update loading and failed screens for web version of the editor [#32395]
-   [*] Handle floating keyboard case - Fix issue with the block selector on iPad. [#33089]
-   [**] Added color/background customization for text blocks. [#33250]

## 1.56.0

-   [*] Tweaks to the badge component's styling, including change of background color and reduced padding. [#32865]

## 1.55.2

-   [**] Fix incorrect block insertion point after blurring the post title field. [#32831]

## 1.55.1

-   [*] Fix: RNMobile borderRadius value setting [#32717]
-   [*] Improve unsupported block message for reusable block [#32618]

## 1.55.0

-   [*] Gallery block - Fix gallery images caption text formatting [#32351]
-   [*] Image block: "Set as featured" button within image block settings. (Android only) [#31705]
-   [***] Audio block now available on WP.com sites on the free plan. [#31966]

## 1.54.0

-   [***] Slash inserter [#29772]
-   [*] Audio block: Add Insert from URL functionality. [#27817]
-   [*] The BottomSheet Cell component now supports the help prop so that a hint can be supplied to all Cell based components. [#30885]
-   [***] Enable reusable block only in WP.com sites [#31744]

## 1.53.1

-   [*] Fix missing title for some unsupported blocks [#31743]

## 1.53.0

-   [*] Bottom-sheet: Add custom header [#30291]
-   [*] Fixes color picker rendering bug when scrolling [#30994]
-   [*] Add enableCaching param to fetch request on Android [#31186]
-   [***] Add reusable blocks to the inserter menu. [#28495]

## 1.52.2

-   [*] Disabled featured image banner on iOS. [#31681]

## 1.52.1

-   [*] Fixes for the generated localized strings files.

## 1.52.0

-   [***] Search block now available on mobile! [https://github.com/WordPress/gutenberg/pull/30783]
-   [*] Image block: Add a "featured" banner. (Android only) [#30806]
-   [**] The media upload options of the Image, Video and Gallery block automatically opens when the respective block is inserted. [#29546]
-   [**] The media upload options of the File and Audio block automatically opens when the respective block is inserted. [#31025]
-   [*] Fixed a bug where the Search block was stealing focus from the Image block upon updating image asset [#31393]

## 1.51.1

-   [*] Updates relative block-support asset path [#31184]

## 1.51.0

-   [*] Image block: Improve text entry for long alt text. [#29670]
-   [*] a11y: Bug fix: Allow stepper cell to be selected by screenreader [#30694]

## 1.50.1

-   [*] Truncate rangecell screenreader decimals] [#30678]
-   [*] Fix Quote block citation [#30548]
-   [**] Fix crash from non-adjustable unit RangeCell a11y activation [#30636]
-   [**] Fix Unsupported Block Editor on Android [#30650]

## 1.50.0

-   [***] a11y: Screenreader improvements for the UnitControl component [#29741]

## 1.49.0

-   [*] Remove the cancel button from settings options (Android only) [https://github.com/WordPress/gutenberg/pull/29599]

## 1.48.0

-   [**] Buttons block: added width setting. [#28543]

## 1.47.2

-   [**] Adds a `replaceBlock` method to iOS bridge delegate with a string to match the clientID and the contents to replace with. [#29734]

## 1.47.1

-   [**] Reduce the number of items per page when fetching reusable blocks to prevent a crash. [#29626]

## 1.47.0

-   [**] Add support for setting Cover block focal point. [#25810]

## 1.46.1

-   [**] Make inserter long-press options "add to beginning" and "add to end" always available. [#28610]
-   [*] Fix crash when Column block width attribute was empty. [#29015]

## 1.46.0

-   [***] New Block: Audio [#27401, #27467, #28594]
-   [**] Add support for setting heading anchors [#27935]
-   [**] Disable Unsupported Block Editor for Reusable blocks [#28552]
-   [**] Add proper handling for single use blocks such as the more block [#28339]

## 1.45.0

-   [*] Use react-native-url-polyfill in globals - [https://github.com/WordPress/gutenberg/pull/27867]
-   [*] Remove Old Layout Picker - [https://github.com/WordPress/gutenberg/pull/27640]

## 1.44.1

-   [**] Fix crash in mobile paragraph blocks with custom font size [#28121]
-   [**] Add move to top bottom when long pressing block movers [#27554]

## 1.44.0

-   [***] Add support for cross-posting between sites
-   [***] Full-width and wide alignment support for Columns

## 1.43.0

-   [***] New Block: File [#27228]
-   [**] Fix issue where a blocks would disappear when deleting all of the text inside without requiring the extra backspace to remove the block. [#27583]

## 1.42.0

-   [***] Adding support for selecting different unit of value in Cover and Columns blocks [#26161]
-   [**] Button block - Add link picker to the block settings [#26206]
-   [**] Support to render background/text colors in Group, Paragraph and Quote blocks [#25994]
-   [*] Fix theme colors syncing with the editor [#26821]
-   [**] Fix issue where a blocks would disappear when deleting all of the text inside without requiring the extra backspace to remove the block. [#27583]

## 1.41.0

-   [***] Faster editor start and overall operation on Android [#26732]
-   [*] [Android] Enable multiple upload support for Image block

## 1.40.0

## 1.39.1

-   [*] Heading block - Disable full-width/wide alignment [#26308]

## 1.39.0

-   [***] Full-width and wide alignment support for Video, Latest-posts, Gallery, Media & text, and Pullquote block
-   [***] Fix unsupported block bottom sheet is triggered when device is rotated
-   [***] Unsupported Block Editor: Fixed issue when cannot view or interact with the classic block on Jetpack site

## 1.38.0

[***] Add support for selecting user's post when configuring the link

## 1.37.0

-   [**] Add support for rounded style in Image block
-   [***] Full-width and wide alignment support for Group, Cover and Image block

## 1.36.1

-   [**] [iOS] Fixed Dark Mode transition for editor menus.

## 1.36.0

-   [**] [Android] Removed pullquote dev only restriction in Android
-   [**] Reflect changes of slider in block settings immediately.

## 1.35.0

-   [***] Fixed empty text fields on RTL layout. Now they are selectable and placeholders are visible.
-   [**] Add settings to allow changing column widths
-   [**] Media editing support in Gallery block.

## 1.34.0

-   [***] Media editing support in Cover block.
-   [*] Fixed a bug on the Heading block, where a heading with a link and string formatting showed a white shadow in dark mode.

## 1.33.1

-   Fixed a bug in the @-mentions feature where dismissing the @-mentions UI removed the @ character from the post.

## 1.33.0

-   [***] Media editing support in Media & Text block.
-   [***] New block: Social Icons
-   [*] Cover block placeholder is updated to allow users start the block with a background color

## 1.32.0

-   [***] Adds Copy, Cut, Paste, and Duplicate functionality to blocks
-   [***] Add support for mentions.
-   [***] Users can now individually edit unsupported blocks found in posts or pages.
-   [*] [iOS] Improved editor loading experience with Ghost Effect.

## 1.31.1

-   Fix for pullquote stylying in dark mode.
-   Fix for button style.

## 1.31.0

-   [**] Add support for customizing gradient type and angle in Buttons and Cover blocks.
-   [*] Show content information (block, word and characters counts).
-   [*] [Android] Fix handling of upload completion while re-opening the editor

## 1.30.0

-   [**] Adds editor support for theme defined colors and theme defined gradients on cover and button blocks.
-   [*] Support for breaking out of captions/citation authors by pressing enter on the following blocks: image, video, gallery, quote, and pullquote.

## 1.29.1

-   Revert Creating undo levels less frequently

## 1.29.0

-   [**] Add support for changing overlay color settings in Cover block
-   Add enter/exit animation in FloatingToolbar
-   [***] New block: Verse
-   [*] Fix merging of text blocks when text had active formatting (bold, italic, strike, link)
-   [***] Trash icon that is used to remove blocks is moved to the new menu reachable via ellipsis button in the block toolbar
-   [**] Block toolbar can now collapse when the block width is smaller than the toolbar content
-   [**] Creating undo levels less frequently
-   [**] Tooltip for page template selection buttons
-   [*] Fix button alignment in page templates and make strings consistent
-   [*] Add support for displaying radial gradients in Buttons and Cover blocks

## 1.28.2

-   [***] Disable Pullquote Block on Android

## 1.28.1

-   [**] Avoid crash when editor selection state becomes invalid

## 1.28.0

-   [***] New block: Pullquote
-   [**] Add support for changing background and text color in Buttons block
-   [*] Fix the icons and buttons in Gallery, Paragraph, List and MediaText block on RTL mode
-   [**] Remove Subscription Button from the Blog template since it didn't have an initial functionality and it is hard to configure for users.
-   [**] [iOS] Add support for the subscript `<sub>` and superscript `<sup>`HTML elements in text blocks
-   [**] Update page templates to use recently added blocks

## 1.27.1

-   Remove Subscription Button from the Blog template since it didn't have an initial functionality and it is hard to configure for users.

## 1.27.0

-   Block Editor: Add dialog for mentioning other users in your post
-   Prefill caption for image blocks when available on the Media library
-   New block: Buttons. From now you’ll be able to add the individual Button block only inside the Buttons block
-   Fix bug where whitespaces at start of text blocks were being removed
-   Add support for upload options in Cover block
-   [Android] Floating toolbar, previously located above nested blocks, is now placed at the top of the screen
-   [iOS] Floating toolbar, previously located above nested blocks, is now placed at the bottom of the screen
-   Fix the icons in FloatingToolbar on RTL mode
-   [Android] Add alignment options for heading block
-   Fix Quote block so it visually reflects selected alignment
-   Fix bug where buttons in page templates were not rendering correctly on web

## 1.26.0

-   [iOS] Disable ripple effect in all BottomSheet's controls.
-   [Android] Disable ripple effect for Slider control
-   New block: Columns
-   New starter page template: Blog
-   Make Starter Page Template picker buttons visible only when the screen height is enough
-   Fix a bug which caused to show URL settings modal randomly when changing the device orientation multiple times during the time Starter Page Template Preview is open

## 1.25.0

-   New block: Cover
-   [Android] Dark Mode
-   [Android] Improve icon on the "Take a Video" media option
-   Removed the dimming effect on unselected blocks
-   [iOS] Add alignment options for heading block
-   Implemented dropdown toolbar for alignment toolbar in Heading, Paragraph, Image, MediaText blocks
-   Block Editor: When editing link settings, tapping the keyboard return button now closes the settings panel as well as closing the keyboard.
-   [Android] Show an "Edit" button overlay on selected image blocks

## 1.24.0

-   New block: Latest Posts
-   Fix Quote block's left border not being visible in Dark Mode
-   Added Starter Page Templates: when you create a new page, we now show you a few templates to get started more quickly.
-   Fix crash when pasting HTML content with embeded images on paragraphs

## 1.23.0

-   New block: Group
-   Add support for upload options in Gallery block
-   Add support for size options in the Image block
-   New block: Button
-   Add scroll support inside block picker and block settings
-   [Android] Fix issue preventing correct placeholder image from displaying during image upload
-   [iOS] Fix diplay of large numbers on ordered lists
-   Fix issue where adding emojis to the post title add strong HTML elements to the title of the post
-   [iOS] Fix issue where alignment of paragraph blocks was not always being respected when splitting the paragraph or reading the post's html content.
-   We’ve introduced a new toolbar that floats above the block you’re editing, which makes navigating your blocks easier — especially complex ones.

## 1.22.0

-   Make inserter to show options on long-press to add before/after
-   Retry displaying image when connectivity restores
-   [iOS] Show an "Edit" button overlay on selected image blocks
-   [Android] Fix blank post when sharing media from another app
-   Add support for image size options in the gallery block
-   Fix issue that sometimes prevented merging paragraph blocks

## 1.21.0

-   Reduced padding around text on Rich Text based blocks.
-   [Android] Improved stability on very long posts.

## 1.20.0

-   Fix bug where image placeholders would sometimes not be shown
-   Fix crash on undo
-   Style fixes on the navigation UI
-   [iOS] Fix focus issue
-   New block: Shortcode. You can now create and edit Shortcode blocks in the editor.

## 1.19.0

-   Add support for changing Settings in List Block.
-   [iOS] Fix crash dismissing bottom-sheet after device rotation.
-   [Android] Add support for Preformatted block.
-   New block: Gallery. You can now create image galleries using WordPress Media library. Upload feature is coming soon.
-   Add support for Video block settings

## 1.18.0

-   [iOS] Added native fullscreen preview when clicking image from Image Block
-   New block: Spacer

## 1.17.0

-   Include block title in Unsupported block's UI
-   Show new-block-indicator when no blocks at all and when at the last block
-   Use existing links in the clipboard to prefill url field when inserting new link.
-   Media & Text block alignment options
-   Add alignment controls for paragraph blocks
-   [iOS] Fix issue where the keyboard would not capitalize sentences correctly on some cases.
-   [iOS] Support for Pexels image library
-   [Android] Added native fullscreen preview when clicking image from Image Block
-   [iOS] Add support for Preformatted block.
-   [Android] Fix issue when removing image/page break block crashes the app

## 1.16.1

-   [iOS] Fix tap on links bug that reappear on iOS 13.2

## 1.16.0

-   [Android] Add support for pexels images
-   Add left, center, and right image alignment controls

## 1.15.3

-   [iOS] Fix a layout bug in RCTAztecView in iOS 13.2

## 1.15.2

-   Fix issue when copy/paste photos from other apps, was not inserting an image on the post.
-   Fix issue where the block inserter layout wasn't correct after device rotation.

## 1.15.0

-   Fix issue when multiple media selection adds only one image or video block on Android
-   Fix issue when force Touch app shortcut doesn't work properly selecting "New Photo Post" on iOS
-   Add Link Target (Open in new tab) to Image Block.
-   [iOS] DarkMode improvements.
-   [iOS] Update to iOS 11 and Swift 5
-   New block: Media & Text

## 1.14.0

-   Fix a bug on iOS 13.0 were tapping on a link opens Safari
-   Fix a link editing issue, where trying to add a empty link at the start of another link would remove the existing link.
-   Fix missing content on long posts in html mode on Android

## 1.12.0

-   Add rich text styling to video captions
-   Prevent keyboard dismissal when switching between caption and text block on Android
-   Blocks that would be replaced are now hidden when add block bottom sheet displays
-   Tapping on empty editor area now always inserts new block at end of post

## 1.11.0

-   Toolbar scroll position now resets when its content changes.
-   Dark Mode for iOS.

## 1.10.0

-   Adding a block from the post title now shows the add block here indicator.
-   Deselect post title any time a block is added
-   Fix loss of center alignment in image captions on Android

## 1.9.0

-   Enable video block on Android platform
-   Tapping on an empty editor area will create a new paragraph block
-   Fix content loss issue when loading unsupported blocks containing inner blocks.
-   Adding a block from the Post Title now inserts the block at the top of the Post.

## 1.8.0

-   Fix pasting simple text on Post Title
-   Remove editable empty line after list on the List block
-   Performance improvements on rich text editing

## 1.7.0

-   Fixed keyboard flickering issue after pressing Enter repeatedly on the Post Title.
-   New blocks are available: video/quote/more

## 1.6.0

-   Fixed issue with link settings where “Open in New Tab” was always OFF on open.
-   Added UI to display a warning when a block has invalid content.
