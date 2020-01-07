=== Gutenberg ===
Contributors: matveb, joen, karmatosed
Requires at least: 5.2.0
Tested up to: 5.3
Stable tag: V.V.V
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

The block editor was introduced in core WordPress with version 5.0. This beta plugin allows you to test bleeding-edge features around editing and customization projects before they land in future WordPress releases.

== Description ==

The block editor was introduced in core WordPress with version 5.0 but the Gutenberg project will ultimately impact the entire publishing experience including customization (the next focus area). This beta plugin allows you to test bleeding-edge features around editing and customization projects before they land in future WordPress releases.

<a href="https://wordpress.org/gutenberg">Discover more about the project</a>.

= Editing focus =

> The editor will create a new page- and post-building experience that makes writing rich posts effortless, and has “blocks” to make it easy what today might take shortcodes, custom HTML, or “mystery meat” embed discovery. — Matt Mullenweg

One thing that sets WordPress apart from other systems is that it allows you to create as rich a post layout as you can imagine -- but only if you know HTML and CSS and build your own custom theme. By thinking of the editor as a tool to let you write rich posts and create beautiful layouts, we can transform WordPress into something users _love_ WordPress, as opposed something they pick it because it's what everyone else uses.

Gutenberg looks at the editor as more than a content field, revisiting a layout that has been largely unchanged for almost a decade.This allows us to holistically design a modern editing experience and build a foundation for things to come.

Here's why we're looking at the whole editing screen, as opposed to just the content field:

1. The block unifies multiple interfaces. If we add that on top of the existing interface, it would _add_ complexity, as opposed to remove it.
2. By revisiting the interface, we can modernize the writing, editing, and publishing experience, with usability and simplicity in mind, benefitting both new and casual users.
3. When singular block interface takes center stage, it demonstrates a clear path forward for developers to create premium blocks, superior to both shortcodes and widgets.
4. Considering the whole interface lays a solid foundation for the next focus, full site customization.
5. Looking at the full editor screen also gives us the opportunity to drastically modernize the foundation, and take steps towards a more fluid and JavaScript powered future that fully leverages the WordPress REST API.

= Blocks =

Blocks are the unifying evolution of what is now covered, in different ways, by shortcodes, embeds, widgets, post formats, custom post types, theme options, meta-boxes, and other formatting elements. They embrace the breadth of functionality WordPress is capable of, with the clarity of a consistent user experience.

Imagine a custom “employee” block that a client can drag to an About page to automatically display a picture, name, and bio. A whole universe of plugins that all extend WordPress in the same way. Simplified menus and widgets. Users who can instantly understand and use WordPress  -- and 90% of plugins. This will allow you to easily compose beautiful posts like <a href="http://moc.co/sandbox/example-post/">this example</a>.

Check out the <a href="https://wordpress.org/gutenberg/handbook/reference/faq/">FAQ</a> for answers to the most common questions about the project.

= Compatibility =

Posts are backwards compatible, and shortcodes will still work. We are continuously exploring how highly-tailored metaboxes can be accommodated, and are looking at solutions ranging from a plugin to disable Gutenberg to automatically detecting whether to load Gutenberg or not. While we want to make sure the new editing experience from writing to publishing is user-friendly, we’re committed to finding  a good solution for highly-tailored existing sites.

= The stages of Gutenberg =

Gutenberg has three planned stages. The first, aimed for inclusion in WordPress 5.0, focuses on the post editing experience and the implementation of blocks. This initial phase focuses on a content-first approach. The use of blocks, as detailed above, allows you to focus on how your content will look without the distraction of other configuration options. This ultimately will help all users present their content in a way that is engaging, direct, and visual.

These foundational elements will pave the way for stages two and three, planned for the next year, to go beyond the post into page templates and ultimately, full site customization.

Gutenberg is a big change, and there will be ways to ensure that existing functionality (like shortcodes and meta-boxes) continue to work while allowing developers the time and paths to transition effectively. Ultimately, it will open new opportunities for plugin and theme developers to better serve users through a more engaging and visual experience that takes advantage of a toolset supported by core.

= Contributors =

Gutenberg is built by many contributors and volunteers. Please see the full list in <a href="https://github.com/WordPress/gutenberg/blob/master/CONTRIBUTORS.md">CONTRIBUTORS.md</a>.

== Frequently Asked Questions ==

= How can I send feedback or get help with a bug? =

We'd love to hear your bug reports, feature suggestions and any other feedback! Please head over to <a href="https://github.com/WordPress/gutenberg/issues">the GitHub issues page</a> to search for existing issues or open a new one. While we'll try to triage issues reported here on the plugin forum, you'll get a faster response (and reduce duplication of effort) by keeping everything centralized in the GitHub repository.

= How can I contribute? =

We’re calling this editor project "Gutenberg" because it's a big undertaking. We are working on it every day in GitHub, and we'd love your help building it.You’re also welcome to give feedback, the easiest is to join us in <a href="https://make.wordpress.org/chat/">our Slack channel</a>, `#core-editor`.

See also <a href="https://github.com/WordPress/gutenberg/blob/master/CONTRIBUTING.md">CONTRIBUTING.md</a>.

= Where can I read more about Gutenberg? =

- <a href="http://matiasventura.com/post/gutenberg-or-the-ship-of-theseus/">Gutenberg, or the Ship of Theseus</a>, with examples of what Gutenberg might do in the future
- <a href="https://make.wordpress.org/core/2017/01/17/editor-technical-overview/">Editor Technical Overview</a>
- <a href="https://wordpress.org/gutenberg/handbook/reference/design-principles/">Design Principles and block design best practices</a>
- <a href="https://github.com/Automattic/wp-post-grammar">WP Post Grammar Parser</a>
- <a href="https://make.wordpress.org/core/tag/gutenberg/">Development updates on make.wordpress.org</a>
- <a href="https://wordpress.org/gutenberg/handbook/">Documentation: Creating Blocks, Reference, and Guidelines</a>
- <a href="https://wordpress.org/gutenberg/handbook/reference/faq/">Additional frequently asked questions</a>


== Changelog ==

### New Features

- Add a new Buttons block. [#17352](https://github.com/wordpress/gutenberg/pull/17352)
- Support adding links to Media & Text block image. [#18139](https://github.com/wordpress/gutenberg/pull/18139)
- Navigation block: Support changing the font size. [#19127](https://github.com/wordpress/gutenberg/pull/19127)
- Gallery block: Add images size selector. [#18581](https://github.com/wordpress/gutenberg/pull/18581)

### Enhancements

- Improve the block inserter search algorithm. [#19122](https://github.com/wordpress/gutenberg/pull/19122)
- Improve the block placeholders design and responsiveness. [#18745](https://github.com/wordpress/gutenberg/pull/18745)
- Navigation mode: Auto-enable when tabbing to the block list with an existing block selection. [#19238](https://github.com/wordpress/gutenberg/pull/19238) [#19298](https://github.com/wordpress/gutenberg/pull/19298)
- Use tabs for gradient and color. [#19133](https://github.com/wordpress/gutenberg/pull/19133)
- Add "download" keyword to the File block. [#18995](https://github.com/wordpress/gutenberg/pull/18995)
- Add "poem" keyword to the Verse block. [#19355](https://github.com/wordpress/gutenberg/pull/19355)
- Convert to blocks: 
    - preserve text alignment. [#19097](https://github.com/wordpress/gutenberg/pull/19097)
    - Skip shortcode if not on its own line. [#19059](https://github.com/wordpress/gutenberg/pull/19059)
- Writing flow: Improve tabbing for Edit mode. [#19235](https://github.com/wordpress/gutenberg/pull/19235)
- Use Popover for the block toolbar. [#18779](https://github.com/wordpress/gutenberg/pull/18779)
- Improve the block multi-selection styles. [#19094](https://github.com/wordpress/gutenberg/pull/19094) [#19121](https://github.com/wordpress/gutenberg/pull/19121)
- Support reduced-motion for Social Links transitions. [#18750](https://github.com/wordpress/gutenberg/pull/18750)
- Use the default cursor for Select Tool [#19157](https://github.com/wordpress/gutenberg/pull/19157)
- Round position attributes on cover focal point save. [#19183](https://github.com/wordpress/gutenberg/pull/19183)
- Remove block inserter shortcuts. [#19045](https://github.com/wordpress/gutenberg/pull/19045)
- Navigation block: 
    - Clarify the placeholder label. [#19105](https://github.com/wordpress/gutenberg/pull/19105)
    - Removes the reusable block option from the items. [#19250](https://github.com/wordpress/gutenberg/pull/19250)
    - Sub-items white background adjustment. [#18976](https://github.com/wordpress/gutenberg/pull/18976)
- Adjustments to the welcome guide. [#19195](https://github.com/wordpress/gutenberg/pull/19195)
- Audio block: Don't render an empty audio tag. [#18850](https://github.com/wordpress/gutenberg/pull/18850)
- Make validation of block html tags and attributes case insensitive [#19207](https://github.com/wordpress/gutenberg/pull/19207)
- Block examples: concatenate strings and add translators notes. [#19048](https://github.com/wordpress/gutenberg/pull/19048)
- Show the trash button as a link. [#19131](https://github.com/wordpress/gutenberg/pull/19131)
- Removed the bottom-margin for the RadioControl component. [#19340](https://github.com/wordpress/gutenberg/pull/19340)
- Copy: 
    - Capitalize "Manager" in Block Manager. [#19375](https://github.com/wordpress/gutenberg/pull/19375)
    - Expand on sentence case usage. [#18758](https://github.com/wordpress/gutenberg/pull/18758) [#19377](https://github.com/wordpress/gutenberg/pull/19377)
    - Update the copy of the Experiments page [#18233](https://github.com/wordpress/gutenberg/pull/18233)
    - Removes title case from alignments for text and image. [#18757](https://github.com/wordpress/gutenberg/pull/18757)
    - Unify not capitalizing the heading for each of the attributes. [#19374](https://github.com/wordpress/gutenberg/pull/19374)
    - Updates description of the navigation block. [#19098](https://github.com/wordpress/gutenberg/pull/19098)

### Performance:

- Remove the BlockAsyncRenderProvider and render parents asynchronously [#19343](https://github.com/wordpress/gutenberg/pull/19343)

###  Bugs:

- A11y: 
    - Make text alignment items radio menu items. [#19233](https://github.com/wordpress/gutenberg/pull/19233)
    - Add group role to the  block wrapper element. [#19213](https://github.com/wordpress/gutenberg/pull/19213)
    - Prevent tabbing to the block drag handle. [#19211](https://github.com/wordpress/gutenberg/pull/19211)
    - Add a label attribute to the Social Icons block. [#18651](https://github.com/wordpress/gutenberg/pull/18651)
    - Improve Welcome guide and modal component. [#19261](https://github.com/wordpress/gutenberg/pull/19261) [#19290](https://github.com/wordpress/gutenberg/pull/19290)
- Pasting:
    - Content that results in a new block shouldn't be treated as inline content. [#19084](https://github.com/wordpress/gutenberg/pull/19084)
    - Preserve inline images. [#19064](https://github.com/wordpress/gutenberg/pull/19064)
    - Remove trailing br elements. [#19035](https://github.com/wordpress/gutenberg/pull/19035)
    - Remove windows paste markers. [#19040](https://github.com/wordpress/gutenberg/pull/19040)
    - Strip HTML formatting space for inline text. [#19043](https://github.com/wordpress/gutenberg/pull/19043)
    - Apply active formats when pasting inline. [#14815](https://github.com/wordpress/gutenberg/pull/14815)
- Rich Text: 
    - Fix applying a format across 2 other formats. [#19053](https://github.com/wordpress/gutenberg/pull/19053)
    - Fix using composed characters on Safari. [#19171](https://github.com/wordpress/gutenberg/pull/19171)
- Fix block navigation using the up arrow key. [#19135](https://github.com/wordpress/gutenberg/pull/19135)
- Fix Welcome Guide modal display for Internet Explorer. [#19201](https://github.com/wordpress/gutenberg/pull/19201)
- Fix Gallery block crashing on the contributor role. [#19060](https://github.com/wordpress/gutenberg/pull/19060)
- Only show available image sizes for Image and Gallery blocks. [#19301](https://github.com/wordpress/gutenberg/pull/19301)
- Remove the circle mask style from the Image block, and add a "rounded" style instead. [#19028](https://github.com/wordpress/gutenberg/pull/19028)
- Fix the Jest Preset Default package: Update preset file extension for inclusion in NPM deployments. [#19306](https://github.com/wordpress/gutenberg/pull/19306)
- Fix the Base Styles package: Import colors into variables. [#19159](https://github.com/wordpress/gutenberg/pull/19159)
- Limit the Next Page (Page Break) block to root level only. [#18260](https://github.com/wordpress/gutenberg/pull/18260)
- Navigation mode: fix reverse tabbing to the post title. [#19305](https://github.com/wordpress/gutenberg/pull/19305)
- Reposition Popovers on click. [#19268](https://github.com/wordpress/gutenberg/pull/19268)
- Fix RangeControl initialPosition prop to accept 0 as a value. [#18611](https://github.com/wordpress/gutenberg/pull/18611) [#19202](https://github.com/wordpress/gutenberg/pull/19202)
- CustomSelectControl: Use items width instead of 100%. [#19150](https://github.com/wordpress/gutenberg/pull/19150)
- Verse block: fix white space. [#19173](https://github.com/wordpress/gutenberg/pull/19173)
- Add missing i18n to the Latest Posts block settings strings [#19032](https://github.com/wordpress/gutenberg/pull/19032)
- Fix ColorPicker alpha value normalization. [#18991](https://github.com/wordpress/gutenberg/pull/18991)
- Fix Post title encoding. [#19187](https://github.com/wordpress/gutenberg/pull/19187)
- Fix dates alignments in the picker. [#19294](https://github.com/wordpress/gutenberg/pull/19294)
- Media Replace Flow: Don't show the URL option unless there is a handler. [#19063](https://github.com/wordpress/gutenberg/pull/19063)
- Popover: don't render fallback anchor if anchorRef is defined. [#19308](https://github.com/wordpress/gutenberg/pull/19308)
- Fix cursor position when splitting blocks with IME keyboard. [#19055](https://github.com/wordpress/gutenberg/pull/19055)
- URLInput: Avoid showing the suggestions loader when disabled. [#18979](https://github.com/wordpress/gutenberg/pull/18979)
- Translate block example strings. [#18162](https://github.com/wordpress/gutenberg/pull/18162)
- Writing flow: simplify & fix tabbing out of block. [#19312](https://github.com/wordpress/gutenberg/pull/19312)

### New APIs: 

- Button component:
    - Support the icon prop and use a consistent button height. [#19193](https://github.com/wordpress/gutenberg/pull/19193) [#19366](https://github.com/wordpress/gutenberg/pull/19366) [#19123](https://github.com/wordpress/gutenberg/pull/19123) [#19058](https://github.com/wordpress/gutenberg/pull/19058)
    - Deprecate IconButton and replace its usage with Button. [#19299](https://github.com/wordpress/gutenberg/pull/19299) [#19241](https://github.com/wordpress/gutenberg/pull/19241)
    - Support isPressed prop in Button and SVG components. [#17748](https://github.com/wordpress/gutenberg/pull/17748)
- New the @wordpress/keyboard-shortcuts package:
    - Add the package. [#19100](https://github.com/wordpress/gutenberg/pull/19100)
    - Optimize useShortcut performance. [#19341](https://github.com/wordpress/gutenberg/pull/19341)
    - Refactor KeyboardShortcuts component to rely on useKeyboardShortcut hook. [#19325](https://github.com/wordpress/gutenberg/pull/19325)
    - Refactor existing editor shortcuts to rely on the package. [#19320](https://github.com/wordpress/gutenberg/pull/19320) [#19327](https://github.com/wordpress/gutenberg/pull/19327) [#19332](https://github.com/wordpress/gutenberg/pull/19332) [#19318](https://github.com/wordpress/gutenberg/pull/19318) [#19334](https://github.com/wordpress/gutenberg/pull/19334) [#19385](https://github.com/wordpress/gutenberg/pull/19385) [#19395](https://github.com/wordpress/gutenberg/pull/19395)
- New React hook: useInstanceId. [#19091](https://github.com/wordpress/gutenberg/pull/19091)
- Support running arbitrary commands on the @wordpress/env containers and use it for linting and server registered fixtures. [#18986](https://github.com/wordpress/gutenberg/pull/18986)
- Font Size Picker: Add default size [#18273](https://github.com/wordpress/gutenberg/pull/18273)


### Experiments

- Full Site Editing:
    - Add package with barebones site editor screen. [#19054](https://github.com/wordpress/gutenberg/pull/19054)
    - Add Multi-Entity Saving flow. [#18029](https://github.com/wordpress/gutenberg/pull/18029) [#19155](https://github.com/wordpress/gutenberg/pull/19155)
- Widgets screen & customizer:
    - Fix Customiser block editor crash. [#19023](https://github.com/wordpress/gutenberg/pull/19023)
    - Fix Drag & Drop not working on the widgets screen. [#19029](https://github.com/wordpress/gutenberg/pull/19029)
- Allow parent Block to consume child Block's toolbar. [#18440](https://github.com/wordpress/gutenberg/pull/18440)
- Allow disabling the Block UI. [#18173](https://github.com/wordpress/gutenberg/pull/18173)
- Block Directory: 
    - Update the regular expression that determines whether the plugin is using an img URL or an icon slug. [#19316](https://github.com/wordpress/gutenberg/pull/19316)
    - Use the block's title for alt text on block directory plugin items. [#19263](https://github.com/wordpress/gutenberg/pull/19263)

### Documentation

- Add types documention:
    - @wordpress/a11y [#19096](https://github.com/wordpress/gutenberg/pull/19096)
    - @wordpress/blob [#19092](https://github.com/wordpress/gutenberg/pull/19092)
    - @wordpress/dom-ready [#19089](https://github.com/wordpress/gutenberg/pull/19089)
    - @wordpress/is-shallow-equal [#19090](https://github.com/wordpress/gutenberg/pull/19090)
    - @wordpress/priority-queue [#18997](https://github.com/wordpress/gutenberg/pull/18997)
    - @wordpress/i18n [#19099](https://github.com/wordpress/gutenberg/pull/19099)
- Document the CustomSelectControl component. [#19026](https://github.com/wordpress/gutenberg/pull/19026)
- Document the WritingFlow component. [#19314](https://github.com/wordpress/gutenberg/pull/19314)
- Link to the User Support Documentation. [#19361](https://github.com/wordpress/gutenberg/pull/19361)
- Add more documentation for @wordpress/env. [#19194](https://github.com/wordpress/gutenberg/pull/19194)
- Add nested block / InnerBlocks tutorial. [#17559](https://github.com/wordpress/gutenberg/pull/17559)
- Add Developer Tools setup in Getting Started. [#19074](https://github.com/wordpress/gutenberg/pull/19074)
- Use ESNext as default code example format. [#17873](https://github.com/wordpress/gutenberg/pull/17873)
- Add standalone npm package release docs [#19381](https://github.com/wordpress/gutenberg/pull/19381)
- Typos and tweaks: [#19280](https://github.com/wordpress/gutenberg/pull/19280) [#19236](https://github.com/wordpress/gutenberg/pull/19236) [#19376](https://github.com/wordpress/gutenberg/pull/19376) [#19146](https://github.com/wordpress/gutenberg/pull/19146) [#19022](https://github.com/wordpress/gutenberg/pull/19022) [#19005](https://github.com/wordpress/gutenberg/pull/19005) [#18423](https://github.com/wordpress/gutenberg/pull/18423) [#19347](https://github.com/wordpress/gutenberg/pull/19347)


### Various

- Block Editor: Remove legacy "editor-" class name compatibility. [#19050](https://github.com/wordpress/gutenberg/pull/19050)(https://github.com/wordpress/gutenberg/pull/19046)
- Block Editor: Test ContrastChecker notices by string comparison. [#19169](https://github.com/wordpress/gutenberg/pull/19169)
- Fix useColors crashes on storybook. [#19046]
- Data: Remove unused forceRender argument [#19206](https://github.com/wordpress/gutenberg/pull/19206)
- Define useSelect dependencies properly. [#19044](https://github.com/wordpress/gutenberg/pull/19044)
- Deprecate @wordpress/nux package. [#18981](https://github.com/wordpress/gutenberg/pull/18981)
- E2E Test Utils: Remove empty, unused KeyboardMode file. [#19166](https://github.com/wordpress/gutenberg/pull/19166)
- Popover: remove buffer options [#19283](https://github.com/wordpress/gutenberg/pull/19283)
- Refactor the MediaReplaceFlow component to use Dropdown. [#19126](https://github.com/wordpress/gutenberg/pull/19126)
- Remove unused is-hovered class from the block wrapper. [#19390](https://github.com/wordpress/gutenberg/pull/19390)
- RichText: 
    - Rewrite withFilters with hooks. [#19117](https://github.com/wordpress/gutenberg/pull/19117)
    - split out boundary style calculation. [#19319](https://github.com/wordpress/gutenberg/pull/19319)
- WritingFlow: rewrite with hooks. [#19393](https://github.com/wordpress/gutenberg/pull/19393)
- Project management: Add prepublish packages command for npm releases. [#19214](https://github.com/wordpress/gutenberg/pull/19214)
- Remove unused blocks-font-size classname. [#19208](https://github.com/wordpress/gutenberg/pull/19208)
- Add a pre-commit hook to check whether API docs are updated. [#18820](https://github.com/wordpress/gutenberg/pull/18820)
- Add mechanism to set a width on withViewportMatch. [#17085](https://github.com/wordpress/gutenberg/pull/17085)
- Add minimum and maximum values to the Gallery columns attribute. [#16314](https://github.com/wordpress/gutenberg/pull/16314)
- Include demo block templates in build ZIP. [#19072](https://github.com/wordpress/gutenberg/pull/19072)
- Fix CSS Coding Standards issue. [#19272](https://github.com/wordpress/gutenberg/pull/19272)
- Resolve WordPress package type imports. [#18927](https://github.com/wordpress/gutenberg/pull/18927)
- Add e2e tests:
    - Splitting and merging text. [#19049](https://github.com/wordpress/gutenberg/pull/19049)
    - InnerBlocks renderAppender. [#14996](https://github.com/wordpress/gutenberg/pull/14996)
    - Navigation block. [#19189](https://github.com/wordpress/gutenberg/pull/19189)
    - Validate embed rendering before proceeding to next [#19042](https://github.com/wordpress/gutenberg/pull/19042)
- Add unit tests to the useViewportMatch and useMediaQuery React hooks. [#19019](https://github.com/wordpress/gutenberg/pull/19019)


