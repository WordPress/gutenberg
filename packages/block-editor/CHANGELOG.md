<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### Internal

-   Remove unused dependencies `@wordpress/escape-html`, `@wordpress/wordcount` and `deepmerge` ([#82103](https://github.com/WordPress/gutenberg/pull/82103)).
-   Remove tsconfig project references to packages that are not dependencies ([#82106](https://github.com/WordPress/gutenberg/pull/82106)).

### Bug Fixes

-   Block List Appender: Show the appender button as a drop target when dragging a block over an empty container such as a Column, restoring the reveal that the `visibility`-to-`opacity` migration left behind ([#77852](https://github.com/WordPress/gutenberg/pull/77852)).
-   Inserter: Keep the hovered block preview inside the viewport, so a tall preview in a short window is no longer clipped ([#82060](https://github.com/WordPress/gutenberg/pull/82060)).
-   Element styles: Register each block's element-style CSS override with the block's `clientId`, so the editor orders them by block position instead of registration order. A parent's link color re-registered after a child's (e.g. by resetting and re-picking it) no longer overrides the child's own link color in the canvas ([#77833](https://github.com/WordPress/gutenberg/pull/77833)).
-   Client-side media processing: Refuse a batch of more than one file when the caller only takes one, such as a Cover block placeholder, matching what the server-side upload path already did. Every dropped file was uploaded instead, and the block kept whichever one finished last ([#82041](https://github.com/WordPress/gutenberg/issues/82041)).
-   `BlockVariationPicker`: Set icon colors with `color` so stroke-based variation icons retain their intended unfilled appearance, while keeping a non-important `fill` fallback for third-party icons that do not use `currentColor`. ([#78808](https://github.com/WordPress/gutenberg/pull/78808))

### Internal

-   Use the `.jsx` extension for JavaScript source files that contain JSX ([#80990](https://github.com/WordPress/gutenberg/pull/80990)).

## 17.0.0 (2026-08-26)

### Breaking Changes

-   Remove `src/default-editor-styles.scss`. Consumers importing it should supply their own ([#81793](https://github.com/WordPress/gutenberg/pull/81793)).

### New Features

-   Register and handle the keyboard shortcuts that blocks declare on their variations and transforms, so that any block can contribute a shortcut without the editor knowing about it. Shortcuts apply to the selected block, and are listed under "Block shortcuts" in the keyboard shortcuts help modal ([#81588](https://github.com/WordPress/gutenberg/pull/81588)).

### Enhancements

-   Allow blocks to provide inspector controls for viewport style states.
-   `BlockStyles`: Use `Button` from `@wordpress/ui`, truncate long labels after three lines, and navigate the variations as a radio group ([#40331](https://github.com/WordPress/gutenberg/issues/40331)).
-   Patterns explorer: Refactor the category sidebar to use `Tabs` ([#81807](https://github.com/WordPress/gutenberg/pull/81807)).
-   `PublishDateTimePicker`: Add a `showPopoverHeader` prop so the picker can be rendered inline, without the popover title and close button. Rename the header's reset action from "Now" to "Reset", which reads as an action rather than a status ([#81806](https://github.com/WordPress/gutenberg/pull/81806)).
-   Show separate horizontal and vertical block spacing controls in the block inspector only for Flex and Grid layouts, while retaining axial gap support in Global Styles. Responsive Grid column calculations use the horizontal gap, while Flow and Constrained layouts use the vertical gap when receiving an axial value ([#81476](https://github.com/WordPress/gutenberg/pull/81476)).

### Bug Fixes

-   Retain focus and caret position when undoing a prefix transform (e.g. `## `, `- `, `> `) with Backspace or Escape ([#82116](https://github.com/WordPress/gutenberg/pull/82116)).
-   Hide the Layout panel when a block has layout editing enabled but all controls for its layout type are disabled ([#81968](https://github.com/WordPress/gutenberg/pull/81968)).
-   `DuotoneControl`: Keep the picked preset's identity when applying a duotone to a block. Two presets can hold the same pair of colors, and the applied preset was resolved by matching colors, so the first of any duplicate pair was saved and both appeared selected ([#81605](https://github.com/WordPress/gutenberg/pull/81605)).
-   `InnerBlocks`: Resolve the `default` of a block's `layout` support before providing it to inner blocks. A block that declared its layout only as a support default, such as the Gallery, previously handed its children the raw support config, which has no `type`, so the children resolved to the flow layout instead. As a result an Image nested in a Gallery offered left/center/right alignment, which the flex layout does not permit ([#81606](https://github.com/WordPress/gutenberg/pull/81606)).
-   Never apply Spotlight mode in a preview canvas, which cannot be edited and so rendered most of its content faded ([#81615](https://github.com/WordPress/gutenberg/pull/81615)).
-   Grid: Keep child layout changes made with the resizer scoped to the selected viewport.
-   `DimensionsTool`: Reflect aspect ratio and scale values that are updated from outside the component, such as by undo or `updateBlockAttributes`. The scale control no longer displays a stale value, and an aspect ratio that is written differently to its preset, e.g. `1/1` rather than `1`, is displayed as that preset instead of as "Original" ([#80747](https://github.com/WordPress/gutenberg/pull/80747)).
-   `ListView`: Only move focus into the list when the new `focusOnMount` prop is set, so that a list mounted as a side effect of a selection no longer pulls focus out of the editor canvas ([#81659](https://github.com/WordPress/gutenberg/pull/81659)).
-   `RichText`: Handle Enter using the current record, so pressing it right after moving the caret splits at the caret's new position instead of the previous one ([#81696](https://github.com/WordPress/gutenberg/pull/81696)).
-   `useInnerBlocksProps`: Resolve the manual grid placement check that disables the standard drop zone against a layout passed through the options, when provided, instead of always using the block edit context layout ([#81120](https://github.com/WordPress/gutenberg/pull/81120)).
-   `useInsertionPoint`: Leave the insertion cue alone when it belongs to the in-between inserter. The cue is shared state and the in-between inserter mounts inside its popover, so the sidebar inserter hiding it tore down the inline inserter that had just been opened ([#76241](https://github.com/WordPress/gutenberg/pull/76241)).
-   `BorderPanel`: Match a chosen drop shadow against the presets from every origin rather than the first origin that defines any, so theme and default presets keep being stored as `var:preset|shadow|<slug>` once a custom preset exists ([#81346](https://github.com/WordPress/gutenberg/pull/81346)).
-   `InserterMenu`: Cancel the animation frame that focuses the active tab when the menu unmounts before it runs, so an unmount right after mount no longer throws [#81918](https://github.com/WordPress/gutenberg/pull/81918).
-   `ListView`: On keyboard activation, focus the start of the first field instead of the end of the last. A Table no longer focuses its last cell. Clicking a List View item still keeps focus in the list ([#81964](https://github.com/WordPress/gutenberg/pull/81964)).

### Internal

-   Split tsconfig into a build project and a default dev project so dev files are type checked without publishing their declarations. ([#81516](https://github.com/WordPress/gutenberg/pull/81516))
-   Expose `isElementVisible` via private APIs so `@wordpress/editor`'s collaboration overlay can detect content hidden by a collapsed container (e.g. a closed `core/details` panel) without duplicating the visibility check ([#81322](https://github.com/WordPress/gutenberg/pull/81322)).

## 16.2.0 (2026-08-12)

### Internal

-   Use the new `@wordpress/kebab-case` package instead of unlocking the `kebabCase` utility from the `@wordpress/components` private APIs ([#81294](https://github.com/WordPress/gutenberg/pull/81294)).

### Enhancements

-   Allow Global Styles to supply additional element color controls to the shared Colors panel ([#80852](https://github.com/WordPress/gutenberg/pull/80852)).
-   Creating a new block next to a sibling of the same type now inherits the sibling's attributes consistently, whether it is created by the appender, the inserter, or Enter at the edge of the text. Everything except the sibling's content (attributes with the `content` role) and its `metadata` is copied. The `attributesToCopy` list of a default block is removed: the copied attributes derive from the block's attribute roles.

### Enhancements

-   Add support for the `blockStatesEditingEnabled` editor setting, which hides state controls for blocks when set to `false` ([#80956](https://github.com/WordPress/gutenberg/pull/80956), [#81058](https://github.com/WordPress/gutenberg/pull/81058)).

### Performance

-   `hasSelectedInnerBlock`: Answer the deep check from a set of the selection's ancestors, built once per selection, instead of walking the parents of every selected block on each call. `BlockListBlock` asks once per rendered block, so the old cost was the block count multiplied by the selection size ([#81210](https://github.com/WordPress/gutenberg/pull/81210)).
-   `BlockListBlock`: Skip that deep check behind `isSelectionWithinCurrentSection` when the block is not within a section block, where it was passed an `undefined` client ID that never matches. Together the two changes take selecting all blocks on a 1000 paragraph post from 16.8s to 0.4s ([#81210](https://github.com/WordPress/gutenberg/pull/81210)).
-   `ListView`: Drop the `useBlockDisplayInformation` and `useBlockLock` calls from the row, select button and branch components, reading the few fields they were used for from the `useSelect` each component already has. Store subscriptions go from seven to four per rendered row, and from two to one per branch ([#81136](https://github.com/WordPress/gutenberg/pull/81136)).
-   `ListView`: Collapse the placeholder rows that stand in for blocks outside of the render window into a single spacer row per run, instead of rendering a `<tr>`/`<td>` pair for every block. On a post with 1000 top-level blocks this removes ~1900 elements (about 60% of the List View's DOM and nearly half of the document's elements), which cuts the style recalculation and layout work done when the List View opens ([#80953](https://github.com/WordPress/gutenberg/pull/80953)).
-   `hasSelectedInnerBlock`: Return `false` up front when called without a client ID, instead of reading the selection and walking it for a check that can never match. The root client ID (`''`) is covered by the same bail out, so the shallow check no longer reports `true` when a top level block is selected, matching the deep check ([#81315](https://github.com/WordPress/gutenberg/pull/81315)).

### Internal

-   `ListView`: Reimplement the Firefox description-recomputation workaround in `AriaReferencedText` by keying the element on its text, so React replaces it instead of updating the existing text node in place ([#80929](https://github.com/WordPress/gutenberg/pull/80929).

### Bug Fixes

-   `MediaPlaceholder`: Stop the drop zone activating for canvas block-reorder drags. Dragging an inner block within a block that renders a media placeholder (e.g. reordering a Playlist Track) no longer shows a media drop zone and blocks the reorder.
-   `isBlockSelected`: Return `false` when called without a client ID, instead of matching the `undefined` client ID of an empty selection ([#81212](https://github.com/WordPress/gutenberg/pull/81212)).
-   `URLInput`: Collapse a text selection reaching the start of the field before letting an up arrow press through to the editor, so selecting to the start and pressing up no longer navigates out of the field instead of collapsing the caret ([#80780](https://github.com/WordPress/gutenberg/pull/80780)).
-   `URLInput`: Leave Shift-modified arrow keys to the browser, so extending a selection with Shift+Up or Shift+Down no longer collapses it to the start or end of the field ([#80780](https://github.com/WordPress/gutenberg/pull/80780)).
-   `RichText`: Skip the block input transforms in fields that are not passed an `onReplace` ([#80978](https://github.com/WordPress/gutenberg/pull/80978)).
-   `RichText`: Ignore pasted files, which carry no text to paste inline ([#81010](https://github.com/WordPress/gutenberg/pull/81010)).
-   Background block support: Fix gradients not being applied to a block when a theme opts out of `settings.background.gradient` in `theme.json` ([#81056](https://github.com/WordPress/gutenberg/pull/81056)).
-   `LinkControl`: Restore the preview title underline by slightly increasing the title's line height, which was too tight for the underline to be visible ([#81083](https://github.com/WordPress/gutenberg/pull/81083)).
-   `URLInput`: Skip link search requests while an IME composition is in progress; the search now fires once with the confirmed value on `compositionend` ([#80602](https://github.com/WordPress/gutenberg/pull/80602)).
-   `SpacingSizesControl`: Give the control's visible label its own translation context instead of sharing an entry with the side input's aria label, which feeds the same placeholders in the opposite order — a single shared translation could not be correct for both ([#81240](https://github.com/WordPress/gutenberg/pull/81240)).

## 16.1.0 (2026-07-29)

### Enhancements

-   Inspector controls in the standard block-supports panels (Typography, Dimensions, Border, Color, Background, Filters) now reflect the value a block inherits from Global Styles when no local override is set. Inherited controls show that value at rest (as a placeholder, preselected option, or resolved value) and mark the label with a dotted underline; setting a local override reveals a reset affordance that clears the override back to the inherited value ([#77894](https://github.com/WordPress/gutenberg/pull/77894)).
-   Inherited Global Styles now resolve per-level heading element styles for the heading-family blocks (`core/heading`, `core/site-title`, `core/post-title`, `core/query-title`, `core/comments-title`, `core/term-name`, `core/site-tagline`, `core/accordion-heading`), so inspector controls reflect values set on a specific heading level (`styles.elements.h1`–`h6`) in addition to the shared `heading` element. A block rendered at level 0 (a paragraph) folds no heading element styles; `core/accordion-heading` has no level-0 state and takes its level from the parent Accordion's block context ([#80495](https://github.com/WordPress/gutenberg/pull/80495)).
-   Inherited Global Styles now resolve the `link` element (`styles.elements.link`) for whole-block link blocks — those that render as a link — so their inspector controls reflect inherited link styles, mirroring the `button` element treatment for `core/button`. Covers `core/read-more`, `core/loginout`, `core/post-navigation-link`, `core/query-pagination-next`, `core/query-pagination-previous`, `core/query-pagination-numbers`, `core/comments-pagination-next`, `core/comments-pagination-previous`, `core/comments-pagination-numbers`, `core/comment-edit-link`, `core/comment-reply-link`, and `core/post-comments-link` [#80607](https://github.com/WordPress/gutenberg/pull/80607)).

### Internal

-   Gate the inherited Global Styles treatment in the block inspector on the `gutenberg-global-styles-inheritance-ui` Gutenberg experiment, so `useResolvedStyle` resolves nothing and the block-supports panels render without the inheritance affordances until the experiment is turned on ([#80555](https://github.com/WordPress/gutenberg/pull/80555), [#80815](https://github.com/WordPress/gutenberg/pull/80815)).
-   `URLInput`: Convert the class component to a function component with hooks, replacing the `compose( withSafeTimeout, withSpokenMessages, withInstanceId, withSelect )` wrapper. The unused `setTimeout` prop injected by `withSafeTimeout` is dropped, and the block editor settings are now read on demand rather than subscribed to ([#80721](https://github.com/WordPress/gutenberg/pull/80721)).

### Bug Fixes

-   Gate the HEIC canvas conversion fallback on `window.__clientSideMediaProcessing` instead of the redundant `window.__heicUploadSupport` flag, fixing client-side HEIC conversion in Safari on core WordPress installs ([#80452](https://github.com/WordPress/gutenberg/pull/80452)).
-   `URLInput`: Request suggestions for a value the field is mounted with, instead of waiting for the input to be focused, and stop requesting initial suggestions on mount when `disableSuggestions` is set ([#80721](https://github.com/WordPress/gutenberg/pull/80721)).
-   The multi-selection inspector card and the spoken selection announcement now disclose the total number of blocks a selection contains when the selected blocks have nested content, e.g. "2 blocks selected, 4 including nested blocks." ([#80745](https://github.com/WordPress/gutenberg/pull/80745)).

## 16.0.0 (2026-07-14)

### Internal

-   Extract a shared `getBlockBindingsContext` helper for assembling the context handed to block-bindings sources; only entries present in the surrounding block context are copied ([#79855](https://github.com/WordPress/gutenberg/pull/79855)).

### Bug Fixes

-   Writing flow: Only pull a forward selection ending at the next element's offset 0 back into the previous block for triple clicks, and clamp the dispatched selection end offset to the rich text content length so an overshooting selection no longer collapses to its start ([#80126](https://github.com/WordPress/gutenberg/pull/80126)).
-   `ListView`: Use the DS focus color token for the row focus ring so it adapts to themed surfaces such as the site editor navigation sidebar, and remove the duplicate focus ring on the row's Options (three-dot) button, which already draws the standard `Button` focus ring. ([#80087](https://github.com/WordPress/gutenberg/pull/80087)).
-   `DimensionControl`: Include component styles in the block editor stylesheet so the fieldset reset is applied in Storybook and other contexts without WordPress core styles ([#79916](https://github.com/WordPress/gutenberg/pull/79916)).
-   `InnerContent`: Render the selected inner block synchronously so its rich text selection stays current while typing; otherwise a stale selection offset could place a typed character at the wrong position in editable static inner blocks ([#79726](https://github.com/WordPress/gutenberg/pull/79726)).
-   `useTypingObserver`: Capture the window reference at mount and reuse it during cleanup so the ref cleanup no longer reads `node.ownerDocument.defaultView` (which is `null` once the iframe-hosted editor has been detached from its window) and throws, which was also leaking the `removeEventListener` calls that follow it ([#78772](https://github.com/WordPress/gutenberg/pull/78772)).

### Breaking Changes

-   The `__next40pxDefaultSize` prop is now true by default. The prop can be safely removed from the following:
    -   `FontAppearanceControl` ([#79635](https://github.com/WordPress/gutenberg/pull/79635)).
    -   `FontFamilyControl` ([#79593](https://github.com/WordPress/gutenberg/pull/79593)).
    -   `LetterSpacingControl` ([#79533](https://github.com/WordPress/gutenberg/pull/79533)).
    -   `LineHeightControl` ([#79589](https://github.com/WordPress/gutenberg/pull/79589)).

### Deprecations

-   Soft-deprecate the `__experimentalImageEditor` component. The Media Editor modal is now the default crop experience for core blocks ([#78654](https://github.com/WordPress/gutenberg/pull/78654)).

### Enhancements

-   Use the emphasis font-weight token for UI emphasis ([#80093](https://github.com/WordPress/gutenberg/pull/80093)).
-   Widen React peer dependency ranges to `^18 || ^19` to support both React 18 and React 19 environments ([#80024](https://github.com/WordPress/gutenberg/pull/80024)).
-   Inserter media categories support an optional `emptyMessage`, shown in place of the generic "No results found" notice, that also keeps a source listed when it has no items. The media panel additionally renders attach/detach affordances for attached images ([#79336](https://github.com/WordPress/gutenberg/pull/79336)).

## 15.23.0 (2026-07-01)

## 15.22.0 (2026-06-24)

### Enhancements

-   Grid: Add a "Fill available space" option to the grid layout that switches the auto-placement keyword from `auto-fill` to `auto-fit`, so columns stretch to fill the row instead of leaving empty tracks. ([#79356](https://github.com/WordPress/gutenberg/pull/79356))
-   List View: a block that supports `listView` is now excluded from the List View when it has no inner blocks and disallows insertion (`allowedBlocks` is `[]` or `false`), since there is nothing to show, rearrange, or add. ([#78932](https://github.com/WordPress/gutenberg/pull/78932))

## 15.21.1 (2026-06-16)

## 15.21.0 (2026-06-10)

### Code Quality

-   Add missing `@types/react` dependency. [#78882](https://github.com/WordPress/gutenberg/pull/78882).

### Documentation

-   Fix documentation typos and grammar ([#78686](https://github.com/WordPress/gutenberg/pull/78686)).

### Internal

-   `ListView`: Compute the block visibility label once in `ListViewBlock` and pass it down to `ListViewBlockSelectButton`, removing a duplicated `useSelect`/`getBlockVisibilityLabel` call and clarifying that the label is exposed to assistive technology through the row's `aria-describedby` ([#78640](https://github.com/WordPress/gutenberg/pull/78640)).
-   Dependency updates ([#77954](https://github.com/WordPress/gutenberg/pull/77954)).

## 15.20.0 (2026-05-27)

### Bug Fixes

-   `ColorPanel`: Theme CSS custom-property gradients are now decoded to their preset slug and persisted as a `gradient` block attribute rather than as a raw `style.color.gradient` value ([#78328](https://github.com/WordPress/gutenberg/pull/78328)).

### Internal

-   Remove legacy `Notice` overrides in block placeholder notices and media replace flow error UI ([#78231](https://github.com/WordPress/gutenberg/pull/78231)).
-   Updated `diff` dependency from `^4.0.2` to `^8.0.3` ([#77992](https://github.com/WordPress/gutenberg/pull/77992)).

## 15.19.0 (2026-05-14)

### Enhancements

-   `BlockManager`: Add stacking context isolation to category list ([#77759](https://github.com/WordPress/gutenberg/pull/77759)).

### Bug Fixes

-   `ColorPanel`: Fix incorrect color selection and text↔link sync with duplicate-value palette entries. Slug-based selection is now threaded through the color panel so that two palette entries sharing the same hex value but different slugs are treated as distinct choices. The text↔link sync condition now compares raw stored references instead of decoded hex values; the previous decoded comparison incorrectly conflated entries that shared a hex value ([#78048](https://github.com/WordPress/gutenberg/pull/78048)).

## 15.18.0 (2026-04-29)

### Enhancements

-   Use `--wpds-cursor-control` for interactive cursor styling and replace all instances ([#77354](https://github.com/WordPress/gutenberg/pull/77354)).

## 15.17.0 (2026-04-15)

## 15.16.0 (2026-04-01)

## 15.15.0 (2026-03-18)

## 15.14.0 (2026-03-04)

## 15.13.0 (2026-02-18)

### Bug Fixes

-   Store: `insertBlock` - the meta argument is now the 6th argument of the action, the 5th argument is `initialPosition` ([#75197](https://github.com/WordPress/gutenberg/pull/75197)).

## 15.12.0 (2026-01-29)

## 15.11.0 (2026-01-16)

## 15.9.0 (2025-11-26)

## 15.8.0 (2025-11-12)

## 15.7.0 (2025-10-29)

## 15.6.0 (2025-10-17)

## 15.5.0 (2025-10-01)

## 15.4.0 (2025-09-17)

## 15.3.0 (2025-09-03)

## 15.2.0 (2025-08-20)

## 15.1.0 (2025-08-07)

## 15.0.0 (2025-07-23)

### Breaking Changes

-   Store: Deprecate the block hovered global state and related action/selector ([#70731](https://github.com/WordPress/gutenberg/pull/70731))

## 14.21.0 (2025-06-25)

## 14.20.0 (2025-06-04)

## 14.19.0 (2025-05-22)

## 14.18.0 (2025-05-07)

## 14.17.0 (2025-04-11)

## 14.16.0 (2025-03-27)

## 14.15.0 (2025-03-13)

## 14.14.0 (2025-02-28)

## 14.13.0 (2025-02-12)

## 14.12.0 (2025-01-29)

## 14.11.0 (2025-01-15)

## 14.10.0 (2025-01-02)

## 14.9.0 (2024-12-11)

## 14.8.0 (2024-11-27)

## 14.7.0 (2024-11-16)

## 14.6.0 (2024-10-30)

## 14.5.0 (2024-10-16)

## 14.4.0 (2024-10-03)

## 14.3.0 (2024-09-19)

## 14.2.0 (2024-09-05)

## 14.1.0 (2024-08-21)

## 14.0.0 (2024-08-07)

### Breaking Changes

-   `URLInput`: Remove deprecated `__nextHasNoMarginBottom` prop and promote to default behavior ([#64282](https://github.com/WordPress/gutenberg/pull/64282)).
-   `LineHeightControl`: Remove deprecated `__nextHasNoMarginBottom` prop and promote to default behavior ([#64281](https://github.com/WordPress/gutenberg/pull/64281)).

### Enhancements

-   `FontFamilyControl`: Add `__nextHasNoMarginBottom` prop for opting into the new margin-free styles ([#64280](https://github.com/WordPress/gutenberg/pull/64280)).

## 13.4.0 (2024-07-24)

## 13.3.0 (2024-07-10)

## 13.2.0 (2024-06-26)

## 13.1.0 (2024-06-15)

## 13.0.0 (2024-05-31)

### Breaking Changes

-   Increase the minimum required Node.js version to v18.12.0 matching long-term support releases ([#31270](https://github.com/WordPress/gutenberg/pull/61930)). Learn more about [Node.js releases](https://nodejs.org/en/about/previous-releases).

## 12.26.0 (2024-05-16)

### Internal

-   Replaced `classnames` package with the faster and smaller `clsx` package ([#61138](https://github.com/WordPress/gutenberg/pull/61138)).

## 12.25.0 (2024-05-02)

## 12.24.0 (2024-04-19)

## 12.23.0 (2024-04-03)

## 12.22.0 (2024-03-21)

## 12.21.0 (2024-03-06)

## 12.20.0 (2024-02-21)

## 12.19.0 (2024-02-09)

-   `FontSizePicker`: Remove deprecated `__nextHasNoMarginBottom` prop and promote to default behavior ([#58702](https://github.com/WordPress/gutenberg/pull/58702)).

## 12.18.0 (2024-01-24)

-   Deprecated `__experimentalRecursionProvider` and `__experimentalUseHasRecursion` in favor of their new stable counterparts `RecursionProvider` and `useHasRecursion`.

## 12.17.0 (2024-01-10)

## 12.16.0 (2023-12-13)

## 12.15.0 (2023-11-29)

## 12.14.0 (2023-11-16)

## 12.13.0 (2023-11-02)

-   Deprecated the `useSetting` function in favor of new `useSettings` one that can retrieve multiple settings at once ([#55337](https://github.com/WordPress/gutenberg/pull/55337)).

## 12.12.0 (2023-10-18)

## 12.11.0 (2023-10-05)

-   Deprecated `CopyHandler`, absorbed into `WritingFlow`.

## 12.10.0 (2023-09-20)

-   The Deprecated multiline prop on RichText will now fall back to using multiple
    rich text instances instead of a single multiline instance. The prop remains
    deprecated.

## 12.9.0 (2023-08-31)

### Enhancements

-   Embed the `ObserveTyping` behavior within the `BlockList` component making to simplify instantiations of third-party block editors.

## 12.8.0 (2023-08-16)

## 12.7.0 (2023-08-10)

## 12.6.0 (2023-07-20)

## 12.5.0 (2023-07-05)

## 12.4.0 (2023-06-23)

### Enhancements

-   Add `HeadingLevelDropdown` component for selecting H1-H6 and paragraph HTML tags from the block toolbar.

### Bug Fixes

-   Fluid typography: custom font-sizes should use max viewport width ([#51516](https://github.com/WordPress/gutenberg/pull/51516)).

## 12.3.0 (2023-06-07)

## 12.2.0 (2023-05-24)

## 12.1.0 (2023-05-10)

-   `MediaPlaceholder`: Remove the undocumented `onHTMLDrop` prop ([#49673](https://github.com/WordPress/gutenberg/pull/49673)).

## 12.0.0 (2023-04-26)

### Breaking Changes

-   Renamed utility function `immutableSet` to `setImmutably` ([#50040](https://github.com/WordPress/gutenberg/pull/50040)).

## 11.8.0 (2023-04-12)

## 11.7.0 (2023-03-29)

-   `ImageSizeControl`: Update image size label ([#49112](https://github.com/WordPress/gutenberg/pull/49112)).

## 11.6.0 (2023-03-15)

## 11.5.0 (2023-03-01)

### Bug Fixes

-   `SpacingSizesControl`: fix white dot on thumb ([#48574](https://github.com/WordPress/gutenberg/pull/48574)).

## 11.4.0 (2023-02-15)

### Bug Fixes

-   `LinkControl`: fix scrollbar displayed on toggle link settings ([#47986](https://github.com/WordPress/gutenberg/pull/47986)).

## 11.3.0 (2023-02-01)

## 11.2.0 (2023-01-11)

### Bug Fixes

-   `BlockInspector`: Fix browser warning error when block is not selected ([#46875](https://github.com/WordPress/gutenberg/pull/46875)).
-   Move component styles needed for iframes to content styles ([#47103](https://github.com/WordPress/gutenberg/pull/47103)).
-   Block Inserter: Correctly apply style to the default inserter ([#47166](https://github.com/WordPress/gutenberg/pull/47166)).
-   List View: Fix crash when the first template-parts is deleted width del key ([#47227](https://github.com/WordPress/gutenberg/pull/47227)).

## 11.1.0 (2023-01-02)

## 11.0.0 (2022-12-14)

### Breaking Changes

-   Updated dependencies to require React 18 ([45235](https://github.com/WordPress/gutenberg/pull/45235))

### Enhancements

-   `URLInput`: the `renderSuggestions` callback prop now receives `currentInputValue` as a new parameter ([45806](https://github.com/WordPress/gutenberg/pull/45806)).
-   Fluid typography: add configurable fluid typography settings for minimum font size to theme.json ([#42489](https://github.com/WordPress/gutenberg/pull/42489)).
-   `URLInput`: Add `__nextHasNoMarginBottom` prop for opting into the new margin-free styles ([46692](https://github.com/WordPress/gutenberg/pull/46692)).

### Bug Fixes

-   `SpacingSizesControl`: Change ARIA role from `region` to `group` to avoid unwanted ARIA landmark regions ([#46530](https://github.com/WordPress/gutenberg/pull/46530)).
-   `FocalPointPicker`: Fix layout misalignment when placed in the `BlockInspector` ([#46631](https://github.com/WordPress/gutenberg/pull/46631)).

## 10.5.0 (2022-11-16)

### Enhancements

-   `BlockLockModal`: Move Icon component out of CheckboxControl label ([#45535](https://github.com/WordPress/gutenberg/pull/45535))
-   Fluid typography: adjust font size min and max rules ([#45536](https://github.com/WordPress/gutenberg/pull/45536)).

## 10.4.0 (2022-11-02)

### Bug Fixes

-   `InserterListItem`: Fix dragging and dropping in Firefox. ([#44631](https://github.com/WordPress/gutenberg/pull/44631))

## 10.3.0 (2022-10-19)

### Bug Fixes

-   `FontSizePicker`: Update fluid utils so that only string, floats and integers are treated as valid font sizes for the purposes of fluid typography ([#44847](https://github.com/WordPress/gutenberg/pull/44847))
-   `getTypographyClassesAndStyles()`: Ensure that font sizes are transformed into fluid values if fluid typography is activated ([#44852](https://github.com/WordPress/gutenberg/pull/44852))
-   `BlockPopover`: Ensure that padding and margin visualizers display in correct position even when scrolling past block. ([#44998](https://github.com/WordPress/gutenberg/pull/44998))

### New Features

-   You can now drop files/blocks/HTML on unmodified default blocks to transform them into corresponding blocks ([#44647](https://github.com/WordPress/gutenberg/pull/44647)).

## 10.2.0 (2022-10-05)

## 10.1.0 (2022-09-21)

## 10.0.0 (2022-09-13)

### Breaking Changes

-   `FontSizePicker`: Deprecate bottom margin style. Add a `__nextHasNoMarginBottom` prop to start opting into the margin-free styles that will become the default in a future version, currently scheduled to be WordPress 6.4 ([#43870](https://github.com/WordPress/gutenberg/pull/43870)).

## 9.8.0 (2022-08-24)

## 9.7.0 (2022-08-10)

## 9.6.0 (2022-07-27)

## 9.5.0 (2022-07-13)

## 9.4.0 (2022-06-29)

## 9.3.0 (2022-06-15)

### Bug Fixes

-   Fix focus trap on certain `input` elements when navigating within a block with the left/right arrow keys ([#41538](https://github.com/WordPress/gutenberg/pull/41538)).

## 9.2.0 (2022-06-01)

## 9.1.0 (2022-05-18)

## 9.0.0 (2022-05-04)

### Breaking Changes

-   `BlockNavigationDropdown` is now deprecated. Use the `Dropdown` component from the `@wordpress/components` package and the `ListView` component from this package ([#40777](https://github.com/WordPress/gutenberg/pull/40777)).
-   `ListView` no longer accepts the `__experimentalFeatures`, `__experimentalPersistentListViewFeatures`, `__experimentalHideContainerBlockActions`, and `showNestedBlocks` props. Passing additional undocumented props through to `ListView` is also now disallowed. ([#40777](https://github.com/WordPress/gutenberg/pull/40777)).

## 8.6.0 (2022-04-21)

## 8.5.0 (2022-04-08)

## 8.4.0 (2022-03-23)

## 8.3.0 (2022-03-11)

## 8.2.0 (2022-02-23)

### New Features

-   `LineHeightControl`: Changes internal implementation to use `NumberControl`, which allows enhanced interactions such as dragging to change the value. To improve consistency with other control components, the bottom margin styles on the component has been deprecated, and will be removed in a future version. To opt into this simplified margin style, set the `__nextHasNoMarginBottom` prop to `true`.

## 8.1.1 (2022-02-10)

### Bug Fixes

-   Removed unused `@wordpress/block-serialization-default-parser`, `css-mediaquery`, `memize` and `redux-multi` dependencies ([#38388](https://github.com/WordPress/gutenberg/pull/38388)).

### New Features

-   List View now supports selecting and dragging multiple blocks via `SHIFT` clicking items in the list [#38314](https://github.com/WordPress/gutenberg/pull/38314).

## 8.1.0 (2022-01-27)

## 8.0.0 (2021-11-07)

### Performance

-   Avoid re-rendering all List View items on block focus [#35706](https://github.com/WordPress/gutenberg/pull/35706). When List View is open Block focus time is 4 times faster in large posts.
-   Render fixed number of items in List View [#35706](https://github.com/WordPress/gutenberg/pull/35230). Opening List View is 13 times faster in large posts.

### Breaking Changes

-   List View no longer supports the `showOnlyCurrentHierarchy` flag [#35706](https://github.com/WordPress/gutenberg/pull/35706). To display a subset of blocks, use the `blocks` parameter instead.

## 7.0.0 (2021-07-29)

### Breaking Changes

-   Upgraded React components to work with v17.0 ([#29118](https://github.com/WordPress/gutenberg/pull/29118)). There are no new features in React v17.0 as explained in the [blog post](https://reactjs.org/blog/2020/10/20/react-v17.html).

## 6.2.0 (2021-07-21)

### New Features

-   `ButtonBlockerAppender` is now `ButtonBlockAppender`, the original name was a typo, but is still being exported for backward compatibility.

## 6.1.0 (2021-05-20)

## 6.0.0 (2021-05-14)

### Breaking Changes

-   Drop support for Internet Explorer 11 ([#31110](https://github.com/WordPress/gutenberg/pull/31110)). Learn more at <https://make.wordpress.org/core/2021/04/22/ie-11-support-phase-out-plan/>.
-   Increase the minimum Node.js version to v12 matching Long Term Support releases ([#31270](https://github.com/WordPress/gutenberg/pull/31270)). Learn more at <https://nodejs.org/en/about/releases/>.

## 5.3.0 (2021-03-17)

-   Add `JustifyToolbar` component abstracted out of the Navigation block so can be used elsewhere.

## 5.2.0 (2020-12-17)

### New Features

-   Added a store definition `store` for the block editor namespace to use with `@wordpress/data` API ([#26655](https://github.com/WordPress/gutenberg/pull/26655)).

## 5.0.0 (2020-10-06)

### Breaking Changes

-   The block editor does not contain default colors, gradients, and font sizes anymore. If one wants to take advantage of these features, please explicitly pass colors, gradients, and/or settings or use the new \_\_experimentalFeatures setting that is available.

## 4.0.0 (2020-05-28)

### Breaking Changes

-   The block control value for `InnerBlocks` has been changed from `__experimentalBlocks` to `value` and is now considered a stable API.
-   Removed the `utility` property from the objects returned by the `getInserterItems` selector.

## 3.7.0 (2020-02-10)

### New Features

-   Add new `__experimentalEditorSkeleton` component. This has been moved over from the `@wordpress/edit-post` package, where it was an internal component called `EditorRegions`. Its class names have thus been renamed from `edit-post-editor-regions` to `block-editor-editor-skeleton`.

## 3.3.0 (2019-11-14)

### New Features

-   Added a `label` prop to `URLInput`. This allows the label to be set without needing to wrap the `URLInput` in a `BaseControl`.

### Deprecations

-   `dropZoneUIOnly` prop in `MediaPlaceholder` component has been deprecated in favor of `disableMediaButtons` prop.

## 3.0.0 (2019-08-05)

### New Features

-   Added a new `allowedFormats` prop to `RichText` to fine tune allowed formats. Deprecated the `formattingControls` prop in favour of this. Also added a `withoutInteractiveFormatting` to specifically disable format types that would insert interactive elements, which can not be nested.

### Breaking Changes

-   `BlockEditorProvider` no longer renders a wrapping `SlotFillProvider` or `DropZoneProvider` (from `@wordpress/components`). For custom block editors, you should render your own as wrapping the `BlockEditorProvider`. A future release will include a new `BlockEditor` component for simple, standard usage. `BlockEditorProvider` will serve the simple purpose of establishing its own context for block editors.

## 2.2.0 (2019-06-12)

### Internal

-   Refactored `BlockSettingsMenu` to use `DropdownMenu` from `@wordpress/components`.

## 2.0.0 (2019-04-16)

### New Features

-   Added the `addToGallery` property to the `MediaUpload` interface. The property allows users to open the media modal in the `gallery-library`instead of `gallery-edit` state.
-   Added the `addToGallery` property to the `MediaPlaceholder` component. The component passes the property to the `MediaUpload` component used inside the placeholder.
-   Added the `isAppender` property to the `MediaPlaceholder` component. The property changes the look of the placeholder to be adequate to scenarios where new files are added to an already existing set of files, e.g., adding files to a gallery.
-   Added the `dropZoneUIOnly` property to the `MediaPlaceholder` component. The property makes the `MediaPlaceholder` only render a dropzone without any other additional UI.
-   Added a cancel link to the list of buttons in the `MediaPlaceholder` component which appears if an `onCancel` handler exists.
-   Added the usage of `mediaPreview` for the `Placeholder` component to the `MediaPlaceholder` component.
-   Added a an `onDoubleClick` event handler to the `MediaPlaceholder` component.
-   Added a way to pass special `ref` property to the `PlainText` component.
-   The `URLPopover` component now passes through all unhandled props to the underlying Popover component.

### Breaking Changes

-   `CopyHandler` will now only catch cut/copy events coming from its `props.children`, instead of from anywhere in the `document`.

### Internal

-   Improved handling of blocks state references for unchanging states.
-   Updated handling of blocks state to effectively ignored programmatically-received blocks data (e.g. reusable blocks received from editor).

## 1.0.0 (2019-03-06)

### New Features

-   Initial version.
