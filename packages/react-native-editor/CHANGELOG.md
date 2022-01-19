<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

<!--
For each user feature we should also add a importance categorization label  to indicate the relevance of the change for end users of GB Mobile. The format is the following:
[***] → Major new features, significant updates to core flows, or impactful fixes (e.g. a crash that impacts a lot of users) — things our users should be aware of.

[**] → Changes our users will probably notice, but doesn’t impact core flows. Most fixes.

[*] → Minor enhancements and fixes that address annoyances — things our users can miss.
-->

## Unreleased

-   [**] Fix content justification attribute in Buttons block [#37887]
-   [*] Hide help button from Unsupported Block Editor. [#37221]
-   [*] Add contrast checker to text-based blocks [#34902]
-   [*] [Image block] Fix missing translations [#37956]
-   [*] Fix cut-off setting labels by properly wrapping the text [#37993]
-   [*] Highlight text: fix applying formatting for non-selected text [#37915]
-   [*] Fix missing translations of color settings [#38026]

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
-   [**] Button block - Add link picker to the block settings [#26206]
-   [**] Support to render background/text colors in Group, Paragraph and Quote blocks [#25994]
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
