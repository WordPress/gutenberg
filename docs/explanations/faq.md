# Frequently Asked Questions

What follows is a set of questions that have come up from the last few years of Gutenberg development. If you have any questions you’d like to have answered and included here, [just open up a GitHub issue](https://github.com/WordPress/gutenberg/issues) with your question. We’d love the chance to answer and provide clarity to questions we might not have thought to answer. For a look back historically, please see Matt's November 2018 post [WordPress 5.0: A Gutenberg FAQ](https://ma.tt/2018/11/a-gutenberg-faq/).


## Table of Contents

### The Gutenberg Project
- [What is Gutenberg?](#what-is-gutenberg)
- [What’s on the roadmap long term?](#whats-on-the-roadmap-long-term)
- [When was Gutenberg started?](#when-was-gutenberg-started)
- [When was Gutenberg merged into WordPress?](#when-was-gutenberg-merged-into-wordpress)
- [WordPress is already the world's most popular publishing platform. Why change the editor at all?](#wordpress-is-already-the-worlds-most-popular-publishing-platform-why-change-the-editor-at-all)


### The Editing Experience
- [What are “blocks” and why are we using them?](#what-are-blocks-and-why-are-we-using-them)
- [What is the writing experience like?](#what-is-the-writing-experience-like)
- [Is Gutenberg built on top of TinyMCE?](#is-gutenberg-built-on-top-of-tinymce)
- [Are there Keyboard Shortcuts for Gutenberg?](#are-there-keyboard-shortcuts-for-gutenberg)
  * [Editor shortcuts](#editor-shortcuts)
  * [Selection shortcuts](#selection-shortcuts)
  * [Block shortcuts](#block-shortcuts)
  * [Text formatting](#text-formatting)
- [Does Gutenberg support columns?](#does-gutenberg-support-columns)
- [Does Gutenberg support nested blocks?](#does-gutenberg-support-nested-blocks)
- [Does drag and drop work for rearranging blocks?](#does-drag-and-drop-work-for-rearranging-blocks)

### The Development Experience
- [How do I make my own block?](#how-do-i-make-my-own-block)
- [Does Gutenberg involve editing posts/pages in the front-end?](#does-gutenberg-involve-editing-postspages-in-the-front-end)
- [Given Gutenberg is built in JavaScript, how do old meta boxes (PHP) work?](#given-gutenberg-is-built-in-javascript-how-do-old-meta-boxes-php-work)
- [How can plugins extend the Gutenberg UI?](#how-can-plugins-extend-the-gutenberg-ui)
- [Are Custom Post Types still supported?](#are-custom-post-types-still-supported)

### Styles
- [Can themes _style_ blocks?](#can-themes-_style_-blocks)
- [How do block styles work in both the front-end and back-end?](#how-do-block-styles-work-in-both-the-front-end-and-back-end)
- [What are block variations? Are they the same as block styles?](#what-are-block-variations-are-they-the-same-as-block-styles)
- [How do editor styles work?](#how-do-editor-styles-work)

### Compatibility
- [What browsers does Gutenberg support?](#what-browsers-does-gutenberg-support)
- [Should I be concerned that Gutenberg will make my plugin obsolete?](#should-i-be-concerned-that-gutenberg-will-make-my-plugin-obsolete)
- [Is it possible to opt out of Gutenberg for my site?](#is-it-possible-to-opt-out-of-gutenberg-for-my-site)
- [How do custom TinyMCE buttons work in Gutenberg?](#how-do-custom-tinymce-buttons-work-in-gutenberg)
- [How do shortcodes work in Gutenberg?](#how-do-shortcodes-work-in-gutenberg)
- [Should I move shortcodes to content blocks?](#should-i-move-shortcodes-to-content-blocks)

### Miscellaneous
- [Is Gutenberg made to be properly accessible?](#is-gutenberg-made-to-be-properly-accessible)
- [How is data stored? I've seen HTML comments, what is their purpose?](#how-is-data-stored-ive-seen-html-comments-what-is-their-purpose)
- [How can I parse the post content back out into blocks in PHP or JS?](#how-can-i-parse-the-post-content-back-out-into-blocks-in-php-or-js)

----

## What is Gutenberg?


“Gutenberg” is the name of the project to create a new editor experience for WordPress — contributors have been working on it since January 2017 and it’s one of the most significant changes to WordPress in years. It’s built on the idea of using “blocks” to write and design posts and pages. This will serve as the foundation for future improvements to WordPress, including blocks as a way not just to design posts and pages, but also entire sites. The overall goal is to simplify the first-time user experience of WordPress — for those who are writing, editing, publishing, and designing web pages. The editing experience is intended to give users a better visual representation of what their post or page will look like when they hit publish. Originally, this was the kickoff goal:

> The editor will endeavour to create a new page and post building experience that makes writing rich posts effortless, and has “blocks” to make it easy what today might take shortcodes, custom HTML, or “mystery meat” embed discovery.

Key takeaways include the following points:

-   Authoring richly laid-out posts is a key strength of WordPress.
-   By embracing blocks as an interaction paradigm, we can unify multiple different interfaces into one. Instead of learning how to write shortcodes and custom HTML, or pasting URLs to embed media, there's a common, reliable flow for inserting any kind of content.
-   “Mystery meat” refers to hidden features in software, features that you have to discover. WordPress already supports a large number of blocks and 30+ embeds, so let's surface them.

Gutenberg is developed on [GitHub](https://github.com/WordPress/gutenberg) under the WordPress organization. The block editor has been available in core WordPress since 5.0. If you want to test upcoming features from Gutenberg project, it is [available in the plugin repository](https://wordpress.org/plugins/gutenberg/).

## What’s on the roadmap long term?

There are four phases of Gutenberg which you can see on the [official WordPress roadmap](https://wordpress.org/about/roadmap/). As of writing this, we’re currently in phase 2:

1. Easier Editing — Already available in WordPress since 5.0, with ongoing improvements.
2. Customization — Full Site editing, Block Patterns, Block Directory, Block based themes.
3. Collaboration — A more intuitive way to co-author content
4. Multi-lingual — Core implementation for Multi-lingual sites

## When was Gutenberg started?

The editor focus started in early 2017 with the first three months spent designing, planning, prototyping, and testing prototypes, to help us inform how to approach this project. The first plugin was launched during WordCamp Europe in June 2017.

## When was Gutenberg merged into WordPress?

Gutenberg was first merged into [WordPress 5.0](https://wordpress.org/news/2018/12/bebo/) in December 2018. See [the versions in WordPress page](https://developer.wordpress.org/block-editor/principles/versions-in-wordpress/) for a complete list of Gutenberg plugin versions merged into WordPress core releases.

## WordPress is already the world's most popular publishing platform. Why change the editor at all?

The Editor is where most of the action happens in WordPress’s daily use, and it was a place where we could polish and perfect the block experience in a contained environment. Further, as an open-source project, we believe that it is critical for WordPress to continue to innovate and keep working to make the core experience intuitive and enjoyable for all users. As a community project, Gutenberg has the potential to do just that, and we’re excited to pursue this goal together. If you’d like to test, contribute, or offer feedback, we welcome you to [share what you find on GitHub](https://github.com/WordPress/gutenberg/issues).

## What are “blocks” and why are we using them?

The classic WordPress editor is an open text window—it’s always been a wonderful blank canvas for writing, but when it comes to building posts and pages with images, multimedia, embedded content from social media, polls, and other elements, it required a mix of different approaches that were not always intuitive:

-   Media library/HTML for images, multimedia and approved files.
-   Pasted links for embeds.
-   Shortcodes for specialized assets from plugins.
-   Featured images for the image at the top of a post or page.
-   Excerpts for subheadings.
-   Widgets for content on the side of a page.

As we thought about these uses and how to make them obvious and consistent, we began to embrace the concept of “blocks.” All of the above items could be blocks: easy to search and understand, and easy to dynamically shift around the page. The block concept is very powerful, and when designed thoughtfully, can offer an outstanding editing and publishing experience. Ultimately, the idea with blocks is to create a new common language across WordPress, a new way to connect users to plugins, and replace a number of older content types — things like shortcodes and widgets — that one usually has to be well-versed in the idiosyncrasies of WordPress to understand.

## What is the writing experience like?

Our goal with Gutenberg is not just to create a seamless post- and page-building experience. We also want to ensure that it provides a seamless writing experience. To test this out yourself, [head to this demo and give it a try](https://wordpress.org/gutenberg/)!

## Is Gutenberg built on top of TinyMCE?

No. [TinyMCE](https://www.tinymce.com/) is only used for the "Classic" block.

## Are there Keyboard Shortcuts for Gutenberg?

Yes. There are a lot! There is a help modal showing all available keyboard shortcuts.

You can see the whole list going to the top right corner menu of the new editor and clicking on “Keyboard Shortcuts” (or by using the keyboard shortcut <kbd>Shift</kbd>+<kbd>Alt</kbd>+<kbd>H</kbd> on Linux/Windows and <kbd>⌃</kbd><kbd>⌥</kbd><kbd>H</kbd> on macOS).

This is the canonical list of keyboard shortcuts:

### Editor shortcuts

<table>
	<thead>
		<tr>
			<th>Shortcut description</th>
			<th>Linux/Windows shortcut</th>
			<th>macOS shortcut</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td>Display keyboard shortcuts.</td>
			<td><kbd>Shift</kbd>+<kbd>Alt</kbd>+<kbd>H</kbd></td>
			<td><kbd>⌃</kbd><kbd>⌥</kbd><kbd>H</kbd></td>
		</tr>
		<tr>
			<td>Save your changes.</td>
			<td><kbd>Ctrl</kbd>+<kbd>S</kbd></td>
			<td><kbd>⌘</kbd><kbd>S</kbd></td>
		</tr>
		<tr>
			<td>Undo your last changes.</td>
			<td><kbd>Ctrl</kbd>+<kbd>Z</kbd></td>
			<td><kbd>⌘</kbd><kbd>Z</kbd></td>
		</tr>
		<tr>
			<td>Redo your last undo.</td>
			<td><kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Z</kbd></td>
			<td><kbd>⇧</kbd><kbd>⌘</kbd><kbd>Z</kbd></td>
		</tr>
		<tr>
			<td>Show or hide the settings sidebar.</td>
			<td><kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>,</kbd></td>
			<td><kbd>⇧</kbd><kbd>⌘</kbd><kbd>,</kbd></td>
		</tr>
		<tr>
			<td>Open the list view menu.</td>
			<td><kbd>Shift</kbd>+<kbd>Alt</kbd>+<kbd>O</kbd></td>
			<td><kbd>⌃</kbd><kbd>⌥</kbd><kbd>O</kbd></td>
		</tr>
		<tr>
			<td>Navigate to the next part of the editor.</td>
			<td><kbd>Ctrl</kbd>+<kbd>`</kbd></td>
			<td><kbd>⌃</kbd><kbd>`</kbd></td>
		</tr>
		<tr>
			<td>Navigate to the previous part of the editor.</td>
			<td><kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>`</kbd></td>
			<td><kbd>⌃</kbd><kbd>⇧</kbd><kbd>`</kbd></td>
		</tr>
		<tr>
			<td>Navigate to the next part of the editor (alternative).</td>
			<td><kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>N</kbd></td>
			<td><kbd>⌃</kbd><kbd>⌥</kbd><kbd>N</kbd></td>
		</tr>
		<tr>
			<td>Navigate to the previous part of the editor (alternative).</td>
			<td><kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>P</kbd></td>
			<td><kbd>⌃</kbd><kbd>⌥</kbd><kbd>P</kbd></td>
		</tr>
		<tr>
			<td>Navigate to the nearest toolbar.</td>
			<td><kbd>Alt</kbd>+<kbd>F10</kbd></td>
			<td><kbd>⌥</kbd><kbd>F10</kbd></td>
		</tr>
		<tr>
			<td>Switch between visual editor and code editor.</td>
			<td><kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Alt</kbd>+<kbd>M</kbd></td>
			<td><kbd>⇧</kbd><kbd>⌥</kbd><kbd>⌘</kbd><kbd>M</kbd></td>
		</tr>
		<tr>
			<td>Toggle fullscreen mode.</td>
			<td><kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>F</kbd></td>
			<td><kbd>⇧</kbd><kbd>⌥</kbd><kbd>⌘</kbd><kbd>F</kbd></td>
		</tr>
	</tbody>
</table>

### Selection shortcuts

<table>
	<thead>
		<tr>
			<th>Shortcut description</th>
			<th>Linux/Windows shortcut</th>
			<th>macOS shortcut</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td>Select all text when typing. Press again to select all blocks.</td>
			<td><kbd>Ctrl</kbd>+<kbd>A</kbd></td>
			<td><kbd>⌘</kbd><kbd>A</kbd></td>
		</tr>
		<tr>
			<td>Clear selection.</td>
			<td><kbd>Esc</kbd></td>
			<td><kbd>Esc</kbd></td>
		</tr>
	</tbody>
</table>

### Block shortcuts

<table>
	<thead>
		<tr>
			<th>Shortcut description</th>
			<th>Linux/Windows shortcut</th>
			<th>macOS shortcut</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td>Duplicate the selected block(s).</td>
			<td><kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>D</kbd></td>
			<td><kbd>⇧</kbd><kbd>⌘</kbd><kbd>D</kbd></td>
		</tr>
		<tr>
			<td>Remove the selected block(s).</td>
			<td><kbd>Shift</kbd>+<kbd>Alt</kbd>+<kbd>Z</kbd></td>
			<td><kbd>⌃</kbd><kbd>⌥</kbd><kbd>Z</kbd></td>
		</tr>
		<tr>
			<td>Insert a new block before the selected block(s).</td>
			<td><kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>T</kbd></td>
			<td><kbd>⌥</kbd><kbd>⌘</kbd><kbd>T</kbd></td>
		</tr>
		<tr>
			<td>Insert a new block after the selected block(s).</td>
			<td><kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>Y</kbd></td>
			<td><kbd>⌥</kbd><kbd>⌘</kbd><kbd>Y</kbd></td>
		</tr>
		<tr>
			<td>Move the selected block(s) up.</td>
			<td><kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>T</kbd></td>
			<td><kbd>⌥</kbd><kbd>⌘</kbd><kbd>⇧</kbd><kbd>T</kbd></td>
		</tr>
		<tr>
			<td>Move the selected block(s) down.</td>
			<td><kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>Y</kbd></td>
			<td><kbd>⌥</kbd><kbd>⌘</kbd><kbd>⇧</kbd><kbd>Y</kbd></td>
		</tr>
		<tr>
			<td>Change the block type after adding a new paragraph.</td>
			<td><kbd>/</kbd></td>
			<td><kbd>/</kbd></td>
		</tr>
		<tr>
			<td>Remove multiple selected blocks.</td>
			<td></td>
			<td><kbd>del</kbd><kbd>backspace</kbd></td>
		</tr>
	</tbody>
</table>

### Text formatting

<table>
	<thead>
		<tr>
			<th>Shortcut description</th>
			<th>Linux/Windows shortcut</th>
			<th>macOS shortcut</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td>Make the selected text bold.</td>
			<td><kbd>Ctrl</kbd>+<kbd>B</kbd></td>
			<td><kbd>⌘</kbd><kbd>B</kbd></td>
		</tr>
		<tr>
			<td>Make the selected text italic.</td>
			<td><kbd>Ctrl</kbd>+<kbd>I</kbd></td>
			<td><kbd>⌘</kbd><kbd>I</kbd></td>
		</tr>
		<tr>
			<td>Underline the selected text.</td>
			<td><kbd>Ctrl</kbd>+<kbd>U</kbd></td>
			<td><kbd>⌘</kbd><kbd>U</kbd></td>
		</tr>
		<tr>
			<td>Convert the selected text into a link.</td>
			<td><kbd>Ctrl</kbd>+<kbd>K</kbd></td>
			<td><kbd>⌘</kbd><kbd>K</kbd></td>
		</tr>
		<tr>
			<td>Remove a link.</td>
			<td><kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>K</kbd></td>
			<td><kbd>⇧</kbd><kbd>⌘</kbd><kbd>K</kbd></td>
		</tr>
		<tr>
			<td>Add a strikethrough to the selected text.</td>
			<td><kbd>Shift</kbd>+<kbd>Alt</kbd>+<kbd>D</kbd></td>
			<td><kbd>⌃</kbd><kbd>⌥</kbd><kbd>D</kbd></td>
		</tr>
		<tr>
			<td>Display the selected text in a monospaced font.</td>
			<td><kbd>Shift</kbd>+<kbd>Alt</kbd>+<kbd>X</kbd></td>
			<td><kbd>⌃</kbd><kbd>⌥</kbd><kbd>X</kbd></td>
		</tr>
	</tbody>
</table>

Here is a brief animation illustrating how to find and use the keyboard shortcuts:

![GIF showing how to access keyboard shortcuts](https://make.wordpress.org/core/files/2020/07/keyboard-shortcuts.gif)

## Does Gutenberg support columns?

Yes, a columns block is available in Gutenberg.

## Does Gutenberg support nested blocks?

Yes, it is supported. You can have multiple levels of nesting – blocks within blocks within blocks. See the [Nested Block Tutorial](https://developer.wordpress.org/block-editor/tutorials/block-tutorial/nested-blocks-inner-blocks/) for more information.

## Does drag and drop work for rearranging blocks?

Yes, you can drag and drop blocks to rearrange their order.


## How do I make my own block?

The best place to start is the [Create a Block Tutorial](https://developer.wordpress.org/block-editor/getting-started/create-block/).

## Does Gutenberg involve editing posts/pages in the front-end?

No, we are designing Gutenberg primarily as a replacement for the post and page editing screens. That said, front-end editing is often confused with an editor that looks exactly like the front end. And that is something that Gutenberg will allow as themes customize individual blocks and provide those styles to the editor. Since content is designed to be distributed across so many different experiences—from desktop and mobile to full-text feeds and syndicated article platforms—we believe it's not ideal to create or design posts from just one front-end experience.

## Given Gutenberg is built in JavaScript, how do old meta boxes (PHP) work?

See the [Meta Box Tutorial](https://developer.wordpress.org/block-editor/how-to-guides/metabox/) for more information on using Meta boxes with the new block editor.

## How can plugins extend the Gutenberg UI?

The main extension point we want to emphasize is creating new blocks. Blocks are added to the block editor using plugins, see the [Create a Block Tutorial](https://developer.wordpress.org/block-editor/getting-stared/create-block/) to get started.

## Are Custom Post Types still supported?

Indeed. There are multiple ways in which custom post types can leverage Gutenberg. The plan is to allow them to specify the blocks they support, as well as defining a default block for the post type. It's not currently the case, but if a post type disables the content field, the “advanced” section at the bottom would fill the page.

## Does Gutenberg support columns?

Yes, a columns block is available in Gutenberg.

## Does Gutenberg support nested blocks?

Yes, it is supported. You can have multiple levels of nesting – blocks within blocks within blocks. See the [Nested Block Tutorial](/docs/how-to-guides/block-tutorial/nested-blocks-inner-blocks.md) for more information.

## Does drag and drop work for rearranging blocks?

Yes, you can drag and drop blocks to rearrange their order.


## Can themes _style_ blocks?

Yes. Blocks can provide their own styles, which themes can add to or override, or they can provide no styles at all and rely fully on what the theme provides.

## How do block styles work in both the front-end and back-end?

Blocks are able to provide base structural CSS styles, and themes can add styles on top of this. Some blocks, like a Separator (`<hr/>`), likely don't need any front-end styles, while others, like a Gallery, need a few.

Other features, like the new _wide_ and _full-wide_ alignment options, are simply CSS classes applied to blocks that offer this alignment. We are looking at how a theme can opt in to this feature, for example using `add_theme_support`.

This is currently a work in progress and we recommend reviewing the [block based theme documentation](/docs/how-to-guides/themes/block-theme-overview.md) to learn more.

## What are block variations? Are they the same as block styles?

No, [block variations](/docs/reference-guides/block-api/block-variations.md) are different versions of a single base block, sharing a similar functionality, but with slight differences in their implementation, or settings (attributes, InnerBlocks,etc). Block variations are transparent for users, and once there is a registered block variation, it will appear as a new block. For example, the `embed` block registers different block variations to embed content from specific providers.

Meanwhile, [block styles](/docs/reference-guides/filters/block-filters.md#block-style-variations) allow you to provide alternative styles to existing blocks, and they work by adding a className to the block’s wrapper. Once a block has registered block styles, a block style selector will appear in its sidebar so that users can choose among the different registered styles.

## How do editor styles work?

Regular editor styles are opt-in and work as is in most cases. Themes can also load extra stylesheets by using the following hook:

```php
function gutenbergtheme_editor_styles() {
    wp_enqueue_style( 'gutenbergtheme-blocks-style', get_template_directory_uri() . '/blocks.css');
}
add_action( 'enqueue_block_editor_assets', 'gutenbergtheme_editor_styles' );
```

_See:_ [Editor Styles](/docs/how-to-guides/themes/theme-support.md#editor-styles)

## What browsers does Gutenberg support?

Gutenberg works in modern browsers, and Internet Explorer 11.

Our [list of supported browsers can be found in the Make WordPress handbook](https://make.wordpress.org/core/handbook/best-practices/browser-support/). By “modern browsers” we generally mean the _current and past two versions_ of each major browser.

## Should I be concerned that Gutenberg will make my plugin obsolete?

The goal of Gutenberg is not to put anyone out of business. It's to evolve WordPress so there's more business to be had in the future, for everyone.

Aside from enabling a rich post and page building experience, a meta goal is to _move WordPress forward_ as a platform. Not only by modernizing the UI, but by modernizing the foundation.

We realize it's a big change. We also think there will be many new opportunities for plugins. WordPress is likely to ship with a range of basic blocks, but there will be plenty of room for highly tailored premium plugins to augment existing blocks or add new blocks to the mix.

## Is it possible to opt out of Gutenberg for my site?

There is a “Classic” block, which is virtually the same as the current editor, except in block form.

There is also the [Classic Editor plugin](https://wordpress.org/plugins/classic-editor/) which restores the previous editor, see the plugin for more information. The WordPress Core team has committed to supporting the Classic Editor plugin [until December 2021](https://make.wordpress.org/core/2018/11/07/classic-editor-plugin-support-window/).

## How do custom TinyMCE buttons work in Gutenberg?

Custom TinyMCE buttons still work in the “Classic” block, which is a block version of the classic editor you know today.

Gutenberg comes with a new universal inserter tool, which gives you access to every block available, searchable, sorted by recency and categories. This inserter tool levels the playing field for every plugin that adds content to the editor, and provides a single interface to learn how to use.

## How do shortcodes work in Gutenberg?

Shortcodes continue to work as they do now.

However we see the block as an evolution of the `[shortcode]`. Instead of having to type out code, you can use the universal inserter tray to pick a block and get a richer interface for both configuring the block and previewing it. We would recommend people eventually upgrade their shortcodes to be blocks.

## Should I move shortcodes to content blocks?

We think so for a variety of reasons including but not limited to:

-   Blocks have visual editing built-in which creates a more rich, dynamic experience for building your site.
-   Blocks are simply html and don’t persist things the browser doesn't understand on the frontend. In comparison, if you disable a plugin that powers a shortcode, you end up with strange visuals on the frontend (often just showing the shortcode in plain text).
-   Blocks will be discovered more readily with the launch of the block directory in a way shortcodes never could be allowing for more people to get more functionality.

Ultimately, Blocks are designed to be visually representative of the final look, and, with the launch of the Block Directory in 5.5, they will become the expected way in which users will discover and insert content in WordPress.

## Is Gutenberg made to be properly accessible?

Accessibility is not an afterthought. Not every aspect of Gutenberg is accessible at the moment. You can check logged issues [here](https://github.com/WordPress/gutenberg/labels/Accessibility%20%28a11y%29). We understand that WordPress is for everyone, and that accessibility is about inclusion. This is a key value for us.

If you would like to contribute to the accessibility of Gutenberg, we can always use more people to test and contribute.

## How is data stored? I've seen HTML comments, what is their purpose?

Our approach—as outlined in [the technical overview introduction](https://make.wordpress.org/core/2017/01/17/editor-technical-overview/)—is to augment the existing data format in a way that doesn’t break the decade-and-a-half-fabric of content WordPress provides. In other terms, this optimizes for a format that prioritizes human readability (the HTML document of the web) and easy-to-render-anywhere over a machine convenient file (JSON in post-meta) that benefits the editing context primarily.

This also [gives us the flexibility](https://github.com/WordPress/gutenberg/issues/1516) to store those blocks that are inherently separate from the content stream (reusable pieces like widgets or small post type elements) elsewhere, and just keep token references for their placement.

We suggest you look at the [Gutenberg key concepts](/docs/getting-started/architecture/key-concepts.md) to learn more about how this aspect of the project works.

## How can I parse the post content back out into blocks in PHP or JS?

In JS:

```js
var blocks = wp.blocks.parse( postContent );
```

In PHP:

```php
$blocks = parse_blocks( $post_content );
```


