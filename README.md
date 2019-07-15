# Gutenberg
[![Build Status](https://img.shields.io/travis/com/WordPress/gutenberg/master.svg)](https://travis-ci.com/WordPress/gutenberg)
[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lernajs.io/)

![Screenshot of the Gutenberg Editor, editing a post in WordPress](https://cldup.com/H0oKBfpidk.png)

This repo is the development hub for the <a href="https://make.wordpress.org/core/2017/01/04/focus-tech-and-design-leads/">editor focus in WordPress Core</a>. `Gutenberg` is the project name.

## Getting started
- **Download:** If you want to use the latest release with your WordPress site, <a href="https://wordpress.org/plugins/gutenberg/">download the latest release from the WordPress.org plugins repository</a>.
- **Discuss:** Conversations and discussions take place in <a href="https://wordpress.slack.com/messages/C02QB2JS7">`#core-editor` channel on the Making WordPress Slack</a>.
- **Contribute:** Development of Gutenberg happens in this GitHub repo. Get started by <a href="https://github.com/WordPress/gutenberg/blob/master/CONTRIBUTING.md">reading the contributing guidelines</a>.
- **Learn:** <a href="https://wordpress.org/gutenberg/">Discover more about the project on WordPress.org</a>.

**Gutenberg is more than an editor.** While the project is currently focused on building the new editor for WordPress, it doesn't end there. This lays the groundwork for a new model for WordPress Core that will ultimately impact the entire publishing experience of the platform.

## Editing focus

> *The editor will create a new page- and post-building experience that makes writing rich posts effortless, and has “blocks” to make it easy what today might take shortcodes, custom HTML, or “mystery meat” embed discovery.*
>
> — Matt Mullenweg

One thing that sets WordPress apart is that it allows you to create a post layout that's as rich as you can imagine—but only if you can build your own custom theme with HTML and CSS. By thinking of the editor as a tool that allows you to write rich posts **and** create beautiful layouts, we can transform WordPress into something users _love_, as opposed to something they choose because it happens to be what everyone else uses.

**Gutenberg is a new way forward.** It looks at the editor as more than a content field, revisiting a layout that has been largely unchanged for almost a decade. This project allows The WordPress Project to holistically design a modern editing experience and build a foundation for things to come.

Here's why we're looking at the whole editing screen, as opposed to just the content field:

1. **The block unifies multiple interfaces.** If Gutenberg added blocks on top of the existing interface, it would _add_ complexity, as opposed to removing it.
2. **Simplified (and enhanced) editing.** By revisiting the interface, Gutenberg can modernize the writing, editing, and publishing experience, with usability and simplicity in mind, benefitting both new and casual users.
3. **Better interface usability.** When singular block interface takes center stage, it demonstrates a clear path forward for developers to create premium blocks, superior to both shortcodes and widgets.
4. **A fresh look at content creation.** Considering the whole interface lays a solid foundation for the next focus: full site customization.
5. **Modern tooling.** Looking at the full editor screen also gives WordPress the opportunity to drastically modernize the foundation, and take steps towards a more fluid and JavaScript-powered future that fully leverages the WordPress REST API.

![Writing in Gutenberg 1.6](https://make.wordpress.org/core/files/2017/10/gutenberg-typing-1_6.gif)

## Blocks

Blocks are the unifying evolution of what is now covered, in different ways, by shortcodes, embeds, widgets, post formats, custom post types, theme options, meta-boxes, and other formatting elements. They embrace the breadth of functionality WordPress is capable of, with the clarity of a consistent user experience.

Imagine a custom `employee` block that a client can drag onto an `About` page to automatically display a picture, name, and bio of all the employees. Imagine a whole universe of plugins just as flexible, all extending WordPress in the same way. Imagine simplified menus and widgets. Users who can instantly understand and use WordPress—and 90% of plugins. This will allow you to easily compose beautiful posts like <a href="http://moc.co/sandbox/example-post/">this example</a>.

Check out the <a href="https://developer.wordpress.org/block-editor/contributors/faq/">FAQ</a> for answers to the most common questions about the project.

## Compatibility

Posts are backward compatible, and shortcodes will still work. We are continuously exploring how highly-tailored meta boxes can be accommodated, and are looking at solutions ranging from a plugin to disable Gutenberg to automatically detecting whether to load Gutenberg or not. While we want to make sure the new editing experience from writing to publishing is user-friendly, we’re committed to finding a good solution for highly-tailored existing sites.

## The stages of Gutenberg

Gutenberg has three planned stages.
1) **The first, aimed for inclusion in WordPress 5.0, focuses on the post editing experience** and the implementation of blocks. This initial phase focuses on a content-first approach. The use of blocks, as detailed above, allows you to focus on how your content will look without the distraction of other configuration options. This ultimately will help all users present their content in a way that is engaging, direct, and visual. These foundational elements will pave the way forward.
2) Planned for 2019, **The second stage focuses on overhauling The Customizer** and page templates.
3) Ultimately, **full site customization** will be possible.

**Gutenberg is a big change.** There will be ways to ensure that existing functionality (like shortcodes and meta-boxes) continue to work while allowing developers the time and paths to transition effectively. Ultimately, it will open new opportunities for plugin and theme developers to better serve users through a more engaging and visual experience that takes advantage of a toolset supported by core.

## Get involved

We’re calling this editor project "Gutenberg" because it's a big undertaking. We are working on it every day in GitHub, and we'd love your help building it. You’re also welcome to give feedback, the easiest is to join us in <a href="https://make.wordpress.org/chat/">our Slack channel</a>, `#core-editor`. A weekly meeting is held in the Slack channel on Wednesdays at 13:00 UTC.

## Contributors

Gutenberg is built by many contributors and volunteers. Please see the full list in <a href="https://github.com/WordPress/gutenberg/blob/master/CONTRIBUTORS.md">CONTRIBUTORS.md</a>.

## How You Can Contribute

Please see <a href="https://github.com/WordPress/gutenberg/blob/master/CONTRIBUTING.md">CONTRIBUTING.md</a>.

## Further Reading

- <a href="http://matiasventura.com/post/gutenberg-or-the-ship-of-theseus/">Gutenberg, or the Ship of Theseus</a>, with examples of what Gutenberg might do in the future
- <a href="https://make.wordpress.org/core/2017/01/17/editor-technical-overview/">Editor Technical Overview</a>
- <a href="https://developer.wordpress.org/block-editor/contributors/design/">Design Principles and block design best practices</a>
- <a href="https://github.com/Automattic/wp-post-grammar">WP Post Grammar Parser</a>
- <a href="https://make.wordpress.org/core/tag/gutenberg/">Development updates on make.wordpress.org</a>
- <a href="https://developer.wordpress.org/block-editor/">Documentation: Creating Blocks, Reference, and Guidelines</a>

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
