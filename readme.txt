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

### Features

* Adding a menu to visually [switch between edit and](https://github.com/WordPress/gutenberg/pull/18624) [navigation](https://github.com/WordPress/gutenberg/pull/18829) [modes](https://github.com/WordPress/gutenberg/pull/18805) and announce the mode changes to screen reader users.
* Support adding [a caption to the Table block](https://github.com/WordPress/gutenberg/pull/15554).
* Implement a [Welcome Guide](https://github.com/WordPress/gutenberg/pull/18041) modal.

### Enhancements

* Use a [Fixed Block](https://github.com/WordPress/gutenberg/pull/18686) [Toolbar](https://github.com/WordPress/gutenberg/pull/18945https://github.com/WordPress/gutenberg/pull/18945) [on](https://github.com/WordPress/gutenberg/pull/19014) Mobile Web.
* Block UI:
    * [Remove the parent block from the block title](https://github.com/WordPress/gutenberg/pull/18795) component.
    * [Remove dashed](https://github.com/WordPress/gutenberg/pull/18105) [outlines](https://github.com/WordPress/gutenberg/pull/18865) for child and parent blocks.
    * Remove [hover](https://github.com/WordPress/gutenberg/pull/18862) [styles](https://github.com/WordPress/gutenberg/pull/18904).
* Navigation block:
    * Keep a single place to trigger the “[Open in a new tab](https://github.com/WordPress/gutenberg/pull/18532)” option.
    * Fix overflow by allowing [wrapping of menu items](https://github.com/WordPress/gutenberg/pull/18431).
    * Fix [double click to open the appender](https://github.com/WordPress/gutenberg/pull/18379).
    * Add a **type=submit** to the [search suggestion buttons](https://github.com/WordPress/gutenberg/pull/18933).
    * Support [justifying the menu items](https://github.com/WordPress/gutenberg/pull/18909).
    * Use [correct classnames](https://github.com/WordPress/gutenberg/pull/18926) for navigation link block save output.
    * Remove the [inspector controls](https://github.com/WordPress/gutenberg/pull/18948).
* Improve the block multi-selection:
    * A11y: [Use the browser’s selection](https://github.com/WordPress/gutenberg/pull/16835) default color. 
    * Polish the [styles](https://github.com/WordPress/gutenberg/pull/18867).
    * [Responsive](https://github.com/WordPress/gutenberg/pull/18915) multi-selection.
    * [Allow pasting](https://github.com/WordPress/gutenberg/pull/18746) on multi-selection.
* Improve the [Image blocks replacement flow/UI](https://github.com/WordPress/gutenberg/pull/16200).
* Disable the [HTML mode in the Cover block](https://github.com/WordPress/gutenberg/pull/18730).
* Add [friendly offline error messages](https://github.com/WordPress/gutenberg/pull/17961) on Rest API request failures.
* [Round the focal point](https://github.com/WordPress/gutenberg/pull/18765) coordinates.
* Popover & Dropdowns: Consistently and [smoothly](https://github.com/WordPress/gutenberg/pull/18813) [adjust](https://github.com/WordPress/gutenberg/pull/18936) the [position on scroll](https://github.com/WordPress/gutenberg/pull/17867).
* Remove [clearing the block selection](https://github.com/WordPress/gutenberg/pull/18621) on sidebar tab switch.
* [Separate editor notices](https://github.com/WordPress/gutenberg/pull/18871) by border instead of margin.
* Allow [drag and dropping images into the featured image](https://github.com/WordPress/gutenberg/pull/17486https://github.com/WordPress/gutenberg/pull/17486) box.

### Bug Fixes

* Prevent [resized Image blocks](https://github.com/WordPress/gutenberg/pull/18728) from overlapping the boundaries of the block.
* Fix [wrong link to attachment page](https://github.com/WordPress/gutenberg/pull/18731) after replacing images.
* Fix Media & Text block: "[Crop image to fill entire column](https://github.com/WordPress/gutenberg/pull/18729)" reset on image change.
* Fix the [Snackbar notices position](https://github.com/WordPress/gutenberg/pull/18801).
* Save the [Verse block line breaks](https://github.com/WordPress/gutenberg/pull/18372) as single characters.
* [Remove has-background-dim-NaN classname](https://github.com/WordPress/gutenberg/pull/18011) from the Cover block.
* Normalize the keys of the [apiFetch preloaded data](https://github.com/WordPress/gutenberg/pull/18724) to avoid unnecessary Rest API calls.
* Fix [CSS styles of the ColorPicker](https://github.com/WordPress/gutenberg/pull/18448) component.
* Update the Inspector slots to use the bubblesVirtually slots Fixing [RichText usage in Inspector controls](https://github.com/WordPress/gutenberg/pull/16807).
* Move the [Modals and Popovers](https://github.com/WordPress/gutenberg/pull/18775) to the right position in the DOM.
* Fix [alignment of date picker days](https://github.com/WordPress/gutenberg/pull/18856) when used in block.
* Fix alignment of [ToggleControl label](https://github.com/WordPress/gutenberg/pull/18815).
* Fix [the toggled state](https://github.com/WordPress/gutenberg/pull/18868) in the block toolbar buttons.
* Fix the [multi-select inspector padding](https://github.com/WordPress/gutenberg/pull/18847).
* Fix the behavior that allows writing by [clicking anywhere in the canvas](https://github.com/WordPress/gutenberg/pull/18732).
* Prevent [private posts with a future date](https://github.com/WordPress/gutenberg/pull/18834) from becoming public on update.
* Fix [useColors crashes if contrast checkers](https://github.com/WordPress/gutenberg/pull/18884) are not specified.
* Render [metaboxes as a single seemless unit](https://github.com/WordPress/gutenberg/pull/18873) to fix styling issues for themes with colored backgrounds.
* Fix the [FontSizePicker custom option](https://github.com/WordPress/gutenberg/pull/18842).
* Fix [reusable blocks](https://github.com/WordPress/gutenberg/pull/18902) showing up as too tall.
* Fix [Drop Cap + alignment](https://github.com/WordPress/gutenberg/pull/18831) producing a gap between paragraphs.
* Fix [Cover to Image block transform](https://github.com/WordPress/gutenberg/pull/18023) when no image is used in the Cover block.
* Ensure [empty classname is not output](https://github.com/WordPress/gutenberg/pull/18861) onto table element.
* Fix [scrolling the sidebar on mobile](https://github.com/WordPress/gutenberg/pull/18937).
* I18: Fix the [Code block](https://github.com/WordPress/gutenberg/pull/18964) [example](https://github.com/WordPress/gutenberg/pull/18993) [string](https://github.com/WordPress/gutenberg/pull/18973).

### APIs

* Support a [**disabled** prop in the RichText](https://github.com/WordPress/gutenberg/pull/18792) component.
* Add a [new](https://github.com/WordPress/gutenberg/pull/18827) [CustomSelectControl](https://github.com/WordPress/gutenberg/pull/17926) [component](https://github.com/WordPress/gutenberg/pull/18944).
* Add a new [TextHighlight](https://github.com/WordPress/gutenberg/pull/18609) component.
* Add a new [CustomGradientPicker](https://github.com/WordPress/gutenberg/pull/17603) component.
* Add [useViewportMatch](https://github.com/WordPress/gutenberg/pull/18816) [React hook](https://github.com/WordPress/gutenberg/pull/18950) to the @wordpress/compose package.
* Allowing [changing the aXe config](https://github.com/WordPress/gutenberg/pull/18712) in the @wordpress/just-puppeteer-axe package.

### Experiments

* Block Content Areas:
    * Add a [demo templates](https://github.com/WordPress/gutenberg/pull/18554) directory. 
    * Add the [Template Part](https://github.com/WordPress/gutenberg/pull/18736) block.
    * Add [documentation](https://github.com/WordPress/gutenberg/pull/18890) for the current state of the experiment.
* Widgets screen:
    * Clear the block selection when [clicking outside the widget areas](https://github.com/WordPress/gutenberg/pull/17851).
* APIs:
    * Add a new [\_\_experimentalResolveSelect](https://github.com/WordPress/gutenberg/pull/17558https://github.com/WordPress/gutenberg/pull/17558) API to the data package.
    * Add [color detection and contrast checks support](https://github.com/WordPress/gutenberg/pull/18547) to the useColors hook.

### Documentation

* Improvements to the [Getting Started](https://github.com/WordPress/gutenberg/pull/18769) documentation.
* Include [TypeScript type checking](https://github.com/WordPress/gutenberg/pull/18879) in Testing Overview.
* Add [JSDoc recommendations](https://github.com/WordPress/gutenberg/pull/18920).
* Reintroduce [NodeJS LTS](https://github.com/WordPress/gutenberg/pull/18923) support commitment.
* Typos and tweaks: [1](https://github.com/WordPress/gutenberg/pull/18752), [2](https://github.com/WordPress/gutenberg/pull/18882), [3](https://github.com/WordPress/gutenberg/pull/18882), [4](https://github.com/WordPress/gutenberg/pull/18916), [5](https://github.com/WordPress/gutenberg/pull/18961), [6](https://github.com/WordPress/gutenberg/pull/19012).

### Performance

* Avoid [rerendering the EditorRegions component](https://github.com/WordPress/gutenberg/pull/18776) on each click.
* Flatten and simplify the [align hook](https://github.com/WordPress/gutenberg/pull/18963) [rendering](https://github.com/WordPress/gutenberg/pull/19008).
* Shim the [meta attribute source](https://github.com/WordPress/gutenberg/pull/18960) on block registration.

### Various

* Storybook: Add [StoryShots integration](https://github.com/WordPress/gutenberg/pull/18031) to generate unit tests.
* Work on the stability of e2e tests: [1](https://github.com/WordPress/gutenberg/pull/18662), [2](https://github.com/WordPress/gutenberg/pull/18754), [3](https://github.com/WordPress/gutenberg/pull/18753), [4](https://github.com/WordPress/gutenberg/pull/18773), [5](https://github.com/WordPress/gutenberg/pull/18771).
* Use [consistent theme colors and font sizes](https://github.com/WordPress/gutenberg/pull/18761) in e2e tests.
* Travis: [Skip the deploy stage](https://github.com/WordPress/gutenberg/pull/18788) on PRs.
* And a Travis job to check the [IE11 compatibility of the produced JavaScript builds](https://github.com/WordPress/gutenberg/pull/18774).
* Avoid usage of [editor store on block editor](https://github.com/WordPress/gutenberg/pull/18784) reusable blocks inserter.
* Replace the [fs-extra dependency with rimraf](https://github.com/WordPress/gutenberg/pull/18790).
* RSS block: Remove [PHP 5.2 compatibility code](https://github.com/WordPress/gutenberg/pull/15806).
* Update the [Columns block to use the Patterns API](https://github.com/WordPress/gutenberg/pull/18283).
* Refactor the [BlockToolbar component](https://github.com/WordPress/gutenberg/pull/18843) to use React hooks.
* Refactor the [BlockDraggable](https://github.com/WordPress/gutenberg/pull/18756) component for a simpler React tree.
* Refactor the [BlockHTML](https://github.com/WordPress/gutenberg/pull/18968) component to use React hooks.
* Refactor the [BlockList](https://github.com/WordPress/gutenberg/pull/18821) component to use React hooks.
* Refactor the [BlockInsertionPoint](https://github.com/WordPress/gutenberg/pull/18821) component to use React hooks.
* [Split @wordpress/urls into multiple modules](https://github.com/WordPress/gutenberg/pull/18689https://github.com/WordPress/gutenberg/pull/18689)/files to allow better tree-shaking.
* Improve the Storybook setup to allow [updates on style changes](https://github.com/WordPress/gutenberg/pull/18676).
* Enforce consistent usage of [Button and ToolbarGroup](https://github.com/WordPress/gutenberg/pull/18817) components.
* Use the [colors hook in the Paragraph block](https://github.com/WordPress/gutenberg/pull/18148).
* Add missing actions and tests for [lockPostAutosaving, unlockPostAutosaving](https://github.com/WordPress/gutenberg/pull/18854).
* [Collapse passed](https://github.com/WordPress/gutenberg/pull/16755) [tests](https://github.com/WordPress/gutenberg/pull/18896) in Travis jobs.
* Add [side effects property to the @wordpress/components package](https://github.com/WordPress/gutenberg/pull/18911) to allow tree-shaking.
* Add a [script to perform patch releases](https://github.com/WordPress/gutenberg/pull/18938) for old npm package versions.
* Reuse the [URLInput component in the Social Links](https://github.com/WordPress/gutenberg/pull/18905) block and [disable suggestions](https://github.com/WordPress/gutenberg/pull/18946).
* Improve and simplify [reusable block](https://github.com/WordPress/gutenberg/pull/18903) [styles](https://github.com/WordPress/gutenberg/pull/18958).
* Refactor the [Gallery edit component](https://github.com/WordPress/gutenberg/pull/18265) to be semi-cross-platform.
* Run tests using the same [environment](https://github.com/WordPress/gutenberg/pull/18703) version used for development.
* Add [CPU/Network slowdown configuration](https://github.com/WordPress/gutenberg/pull/18770) options to the e2e tests setup.
* Enable [Type checking for the @wordpress/token-list](https://github.com/WordPress/gutenberg/pull/18839) package.
* Move the [changelog.txt and readme.txt files](https://github.com/WordPress/gutenberg/pull/18828) to the Github repository.
