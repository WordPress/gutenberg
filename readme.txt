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

*   Add a new Navigation block (previously available as an experiment)
    *   [Highlight menu items](https://github.com/WordPress/gutenberg/pull/18435) without defined URL.
    *   Prevent [error in Firefox](https://github.com/WordPress/gutenberg/pull/18455) when removing the block.
    *   [Remove background color](https://github.com/WordPress/gutenberg/pull/18407) from the Navigation block and rely on the Group block.
    *   Remove the [background shadow](https://github.com/WordPress/gutenberg/pull/18485) for the submenus dropdown.
    *   [Rename "Navigation Menu Item"](https://github.com/WordPress/gutenberg/pull/18422https://github.com/WordPress/gutenberg/pull/18422) block to "Link".
    *   Remove [unnecessary color attributes](https://github.com/WordPress/gutenberg/pull/18540).
    *   Allow [addition CSS](https://github.com/WordPress/gutenberg/pull/18466) [classes](https://github.com/WordPress/gutenberg/pull/18629).
    *   Drop the [“menu” suffix from the block name](https://github.com/WordPress/gutenberg/pull/18551).
    *   [Escape special](https://github.com/WordPress/gutenberg/pull/18607) [characters](https://github.com/WordPress/gutenberg/pull/18617) in the frontend.
    *   Remove from [experimental features](https://github.com/WordPress/gutenberg/pull/18594).
    *   Add [style variations](https://github.com/WordPress/gutenberg/pull/18553).

### Enhancements

*   Use [gradient classnames](https://github.com/WordPress/gutenberg/pull/18590) instead of inline styles for the Cover block.
*   Inserter: Add [keyboard shortcut styling](https://github.com/WordPress/gutenberg/pull/18623) to "/" in the default tip.
*   [Restore the caret position](https://github.com/WordPress/gutenberg/pull/17824) properly on undo.
*   Add keywords to improve the [discoverability of the Audio block](https://github.com/WordPress/gutenberg/pull/18673).
*   Show [video preview on Cover block](https://github.com/WordPress/gutenberg/pull/18009) inspector panel.

### Bug Fixes

*   Fix [hidden nested images](https://github.com/WordPress/gutenberg/pull/18347) in the content column.
*   Fix [double border issue](https://github.com/WordPress/gutenberg/pull/18358) in the keyboard shortcuts modal.
*   Fix [off-centered publish button](https://github.com/WordPress/gutenberg/pull/17726).
*   Fix [error when isRTL config is not provided](https://github.com/WordPress/gutenberg/pull/18526) in the block editor settings.
*   Fix [full width Table block](https://github.com/WordPress/gutenberg/pull/18469) mobile regression.
*   A11y: Add a screen reader text [label for the Search block](https://github.com/WordPress/gutenberg/pull/17983).
*   Fix [text patterns undo](https://github.com/WordPress/gutenberg/pull/18533) after mouse move.
*   Fix block [drag and drop for the  contributor role](https://github.com/WordPress/gutenberg/pull/15054).
*   [Update the link when switching the image used](https://github.com/WordPress/gutenberg/pull/17226) in the Image block.
*   Fix php [error triggered when **gutenberg_register_packages_scripts**](https://github.com/WordPress/gutenberg/pull/18599) is run more than once.
*   Fix special characters [escaping for the post title](https://github.com/WordPress/gutenberg/pull/18616).
*   Fix [JavaScript errors triggered when selectors are called](https://github.com/WordPress/gutenberg/pull/18559) before the editor being initialized.
*   Fix [BaseControl component label](https://github.com/WordPress/gutenberg/pull/18646) when no id is passed.
*   [Preserve whitespace](https://github.com/WordPress/gutenberg/pull/18656) when converting blocks Preformatted and Paragraph blocks.
*   Fix [multiple paste issues](https://github.com/WordPress/gutenberg/pull/17470) creating unnecessary empty spaces.

### New APIs

*   Add a new [Card component](https://github.com/WordPress/gutenberg/pull/17963) [to](https://github.com/WordPress/gutenberg/pull/18681) @wordpress/components.
*   Add [label support for the URLInput](https://github.com/WordPress/gutenberg/pull/15669) [component](https://github.com/WordPress/gutenberg/pull/18488).
*   Support the [isMatch option for the shorcode transforms](https://github.com/WordPress/gutenberg/pull/18459).

### Experiments

*   Block Content areas:
    *   Add [Post Title and Post Content](https://github.com/WordPress/gutenberg/pull/18461) [blocks](https://github.com/WordPress/gutenberg/pull/18543).
    *   Add [template parts](https://github.com/WordPress/gutenberg/pull/18339) CPT and the theme resolution logic.
*   Widgets Screen:
    *   [Refactor the legacy widgets block](https://github.com/WordPress/gutenberg/pull/15801) to support all blocks.
    *   Fix [widget areas margins](https://github.com/WordPress/gutenberg/pull/18528).
    *   Add [isRTL setting](https://github.com/WordPress/gutenberg/pull/18545).
*   APIs
    *   **useColors** hook: Enhance the [contrast checking API](https://github.com/WordPress/gutenberg/pull/18237) and provide [access to the color value](https://github.com/WordPress/gutenberg/pull/18544).
    *   Introduce [createInterpolateElement](https://github.com/WordPress/gutenberg/pull/17376) to allow translation of complex strings with HTML content.
    *   A11y: Refactor the [accessibility behavior of the Toolbar](https://github.com/WordPress/gutenberg/pull/18534) component.
*   Social Links:
    *   [Capitalize LinkedIn](https://github.com/WordPress/gutenberg/pull/18638) and [GitHub](https://github.com/WordPress/gutenberg/pull/18714) properly.
    *   Fix frontend [styling](https://github.com/WordPress/gutenberg/pull/18410).

### Documentation

*   Add a [Backward Compatibility policy](https://github.com/WordPress/gutenberg/pull/18499) document.
*   Clarify the [npm packages release](https://github.com/WordPress/gutenberg/pull/18516) documentation.
*   Add documentation for the [@wordpress/env wp-env.json config file](https://github.com/WordPress/gutenberg/pull/18643).
*   Typos and tweaks: [1](https://github.com/WordPress/gutenberg/pull/18400), [2](https://github.com/WordPress/gutenberg/pull/18404), [3](https://github.com/WordPress/gutenberg/pull/18449), [4](https://github.com/WordPress/gutenberg/pull/18403), [5](https://github.com/WordPress/gutenberg/pull/18452), [6](https://github.com/WordPress/gutenberg/pull/18460), [7](https://github.com/WordPress/gutenberg/pull/18475), [8](https://github.com/WordPress/gutenberg/pull/18507), [9](https://github.com/WordPress/gutenberg/pull/18059), [10](https://github.com/WordPress/gutenberg/pull/17911), [11](https://github.com/WordPress/gutenberg/pull/18558), [12](https://github.com/WordPress/gutenberg/pull/18277), [13](https://github.com/WordPress/gutenberg/pull/18572), [14](https://github.com/WordPress/gutenberg/pull/18587), [15](https://github.com/WordPress/gutenberg/pull/18592), [16](https://github.com/WordPress/gutenberg/pull/18436), [17](https://github.com/WordPress/gutenberg/pull/18446), [18](https://github.com/WordPress/gutenberg/pull/18707), [19](https://github.com/WordPress/gutenberg/pull/18450), [20](https://github.com/WordPress/gutenberg/pull/18713).

### Various

*   Refactor the [RichText component](https://github.com/WordPress/gutenberg/pull/17779): Remove the inner Editable component.
*   Integrate [the](https://github.com/WordPress/gutenberg/pull/18514) [Gutenberg Playground](https://github.com/WordPress/gutenberg/pull/18191) into Storybook.
*   Increase [WordPress minimum supported](https://github.com/WordPress/gutenberg/pull/15809) by the plugin to 5.2.0.
*   Refactor the [Paragraph block edit function](https://github.com/WordPress/gutenberg/pull/18125) as a functional component.
*   Refactor the [Cover block edit function](https://github.com/WordPress/gutenberg/pull/18116) as a functional component.
*   Add new components to Storybook.
    *   [RadioControl](https://github.com/WordPress/gutenberg/pull/18474) component.
    *   [TabPanel](https://github.com/WordPress/gutenberg/pull/18402) component.
    *   [Popover](https://github.com/WordPress/gutenberg/pull/18096) component.
    *   [BaseControl](https://github.com/WordPress/gutenberg/pull/18648) component.
    *   [Tip](https://github.com/WordPress/gutenberg/pull/18542) component.
*   Include [WordPress eslint plugin](https://github.com/WordPress/gutenberg/pull/18457) in React eslint ruleset in @wordpress/eslint-plugin.
*   [Block PRs  on mobile unit test failures](https://github.com/WordPress/gutenberg/pull/18454) in Travis.
*   Polish the [PostSchedule popover styling](https://github.com/WordPress/gutenberg/pull/18235).
*   Fix the [API documentation generation tool](https://github.com/WordPress/gutenberg/pull/18253) when spaces are used in folder names.
*   Add [missing @babel/runtime dependency](https://github.com/WordPress/gutenberg/pull/18626) to the @wordpress/jest-puppeteer-axe.
*   [Refactor the Layout component](https://github.com/WordPress/gutenberg/pull/18044) [to](https://github.com/WordPress/gutenberg/pull/18658) [separate](https://github.com/WordPress/gutenberg/pull/18683) the UI from the content.
*   Align [Dropdown and DropdownMenu](https://github.com/WordPress/gutenberg/pull/18631) components styling.
*   Remove [max-width style from the Image block](https://github.com/WordPress/gutenberg/pull/14911).
*   Remove the [CollegeHumor embed](https://github.com/WordPress/gutenberg/pull/18591) block.
*   Add unit tests: 
    *   Ensure [consecutive edits](https://github.com/WordPress/gutenberg/pull/17917) to the same attribute are considered persistent.
    *   Test the [core-data undo reducer](https://github.com/WordPress/gutenberg/pull/18642).

