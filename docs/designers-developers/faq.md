# Frequently Asked Questions

This initial set of questions were created when the Gutenberg project was relatively new, for a more recent set of questions, please see Matt's November 2018 post [WordPress 5.0: A Gutenberg FAQ](https://ma.tt/2018/11/a-gutenberg-faq/).

## What is Gutenberg?

“Gutenberg” is the name of the project to create a new editor experience for WordPress. The goal is to create a new post and page editing experience that makes it easy for anyone to create rich post layouts. This was the kickoff goal:

> The editor will endeavour to create a new page and post building experience that makes writing rich posts effortless, and has “blocks” to make it easy what today might take shortcodes, custom HTML, or “mystery meat” embed discovery.

Key takeaways include the following points:

- Authoring richly laid-out posts is a key strength of WordPress.
- By embracing blocks as an interaction paradigm, we can unify multiple different interfaces into one. Instead of learning how to write shortcodes and custom HTML, or pasting URLs to embed media, there's a common, reliable flow for inserting any kind of content.
- “Mystery meat” refers to hidden features in software, features that you have to discover. WordPress already supports a large number of blocks and 30+ embeds, so let's surface them.

Gutenberg is being developed on [GitHub](https://github.com/WordPress/gutenberg) under the WordPress organization, and you can use it today — [available in the plugin repository](https://wordpress.org/plugins/gutenberg/).

## When will Gutenberg be merged into WordPress?

Gutenberg will be merged into WordPress 5.0, and will be released at the end of 2018, or early 2019. Please follow [WordPress.org News](https://wordpress.org/news/) for the latest information.

The editor focus started in early 2017 with the first three months spent designing, planning, prototyping, and testing prototypes, to help us inform how to approach this project. The actual plugin, which you can install from the repository, was launched during WordCamp Europe in June.

## What are “blocks” and why are we using them?

The current WordPress editor is an open text window—it’s always been a wonderful blank canvas for writing, but when it comes to building posts and pages with images, multimedia, embedded content from social media, polls, and other elements, it required a mix of different approaches that were not always intuitive:

- Media library/HTML for images, multimedia and approved files.
- Pasted links for embeds.
- `Shortcodes` for specialized assets from plugins.
- Featured images for the image at the top of a post or page.
- Excerpts for subheadings.
- Widgets for content on the side of a page.

As we thought about these uses and how to make them obvious and consistent, we began to embrace the concept of “blocks.” All of the above items could be blocks: easy to search and understand, and easy to dynamically shift around the page. The block concept is very powerful, and if designed thoughtfully, can offer an outstanding editing and publishing experience.

## What is the writing experience like?

Our goal with Gutenberg is not just to create a seamless post- and page-building experience. We also want to ensure that it provides a seamless writing experience. Though individual paragraphs of text will become their own “blocks,” the creation and editing of these blocks are being designed in a way that could be just as simple—if not more so—than the current WordPress editor experience. Here is a brief animation illustrating the Gutenberg writing experience:

![Typing](https://make.wordpress.org/core/files/2017/10/gutenberg-typing-1_6.gif)

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
			<td>Open the block navigation menu.</td>
			<td><kbd>Shift</kbd>+<kbd>Alt</kbd>+<kbd>O</kbd></td>
			<td><kbd>⌃</kbd><kbd>⌥</kbd><kbd>O</kbd></td>
		</tr>
		<tr>
			<td>Navigate to a the next part of the editor.</td>
			<td><kbd>Ctrl</kbd>+<kbd>`</kbd></td>
			<td><kbd>⌃</kbd><kbd>`</kbd></td>
		</tr>
		<tr>
			<td>Navigate to the previous part of the editor.</td>
			<td><kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>`</kbd></td>
			<td><kbd>⌃</kbd><kbd>⇧</kbd><kbd>`</kbd></td>
		</tr>
		<tr>
			<td>Navigate to a the next part of the editor (alternative).</td>
			<td><kbd>Shift</kbd>+<kbd>Alt</kbd>+<kbd>N</kbd></td>
			<td><kbd>⇧</kbd><kbd>⌥</kbd><kbd>N</kbd></td>
		</tr>
		<tr>
			<td>Navigate to the previous part of the editor (alternative).</td>
			<td><kbd>Shift</kbd>+<kbd>Alt</kbd>+<kbd>P</kbd></td>
			<td><kbd>⇧</kbd><kbd>⌥</kbd><kbd>P</kbd></td>
		</tr>
		<tr>
			<td>Navigate to the nearest toolbar.</td>
			<td><kbd>Alt</kbd>+<kbd>F10</kbd></td>
			<td><kbd>⌥</kbd><kbd>F10</kbd></td>
		</tr>
		<tr>
			<td>Switch between Visual Editor and Code Editor.</td>
			<td><kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Alt</kbd>+<kbd>M</kbd></td>
			<td><kbd>⇧</kbd><kbd>⌥</kbd><kbd>⌘</kbd><kbd>M</kbd></td>
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
			<td>Change the block type after adding a new paragraph.</td>
			<td><kbd>/</kbd></td>
			<td><kbd>/</kbd></td>
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

![GIF showing how to access keyboard shortcuts](https://make.wordpress.org/community/files/2018/08/gutenberg-keyboard-shortcuts.gif)

## Is Gutenberg built on top of TinyMCE?

No. [TinyMCE](https://www.tinymce.com/) is only used for the "Classic" block.

## What browsers will Gutenberg support?

Gutenberg will work in modern browsers, and Internet Explorer 11.

Our [list of supported browsers can be found in the Make WordPress handbook](https://make.wordpress.org/core/handbook/best-practices/browser-support/). By “modern browsers” we generally mean the *current and past two versions* of each major browser.

## How do I make my own block?

The API for creating blocks is a crucial aspect of the project. We are working on improved documentation and tutorials. Check out the [Creating Block Types](/docs/tutorials/block-tutorial/readme.md) section to get started.

## Does Gutenberg involve editing posts/pages in the front-end?

No, we are designing Gutenberg primarily as a replacement for the post and page editing screens. That said, front-end editing is often confused with an editor that looks exactly like the front end. And that is something that Gutenberg will allow as themes customize individual blocks and provide those styles to the editor. Since content is designed to be distributed across so many different experiences—from desktop and mobile to full-text feeds and syndicated article platforms—we believe it's not ideal to create or design posts from just one front-end experience.

## Given Gutenberg is built in JavaScript, how will old meta boxes (PHP) work?

We plan to continue supporting existing meta boxes while providing new ways to extend the interface.

*See:* [Pull request #2804](https://github.com/WordPress/gutenberg/pull/2804)

## How can plugins extend the Gutenberg UI?

The main extension point we want to emphasize is creating new blocks. We are still working on how to extend the rest of the UI that is built in JS. We are tracking it here: [Issue #1352](https://github.com/WordPress/gutenberg/issues/1352)

## Will Custom Post Types be supported?

Indeed. There are multiple ways in which custom post types can leverage Gutenberg. The plan is to allow them to specify the blocks they support, as well as defining a default block for the post type. It's not currently the case, but if a post type disables the content field, the “advanced” section at the bottom would fill the page.

## Will there be columns?

Yes, a columns block is available in Gutenberg.

## Will there be nested blocks?

We are currently implementing the infrastructure for nested blocks support. We expect this to open further customization opportunities. Block authors also can nest components and HTML inside of a block during construction. The UI for manipulating nested blocks is still being refined, and depending on the timing, it might not be included in the first version of Gutenberg.

See also [Issue #428](https://github.com/WordPress/gutenberg/issues/428)

## Will drag and drop be used for rearranging blocks?

Yes, you can drag and drop blocks to rearrange their order.

## Can themes _style_ blocks?

Yes. Blocks can provide their own styles, which themes can add to or override, or they can provide no styles at all and rely fully on what the theme provides.

## How will block styles work in both the front-end and back-end?

Blocks will be able to provide base structural CSS styles, and themes can add styles on top of this. Some blocks, like a Separator (`<hr/>`), likely won't need any front-end styles, while others, like a Gallery, need a few.

Other features, like the new _wide_ and _full-wide_ alignment options, will simply be CSS classes applied to blocks that offer this alignment. We are looking at how a theme can opt in to this feature, for example using `add_theme_support`.

*See:* [Theme Support](/docs/designers-developers/developers/themes/theme-support.md)

## How will editor styles work?

Regular editor styles are opt-in and will work as is in most cases. Themes can also load extra stylesheets by using the following hook:

```php
function gutenbergtheme_editor_styles() {
    wp_enqueue_style( 'gutenbergtheme-blocks-style', get_template_directory_uri() . '/blocks.css');
}
add_action( 'enqueue_block_editor_assets', 'gutenbergtheme_editor_styles' );
```

*See:* [Editor Styles](/docs/designers-developers/developers/themes/theme-support.md#editor-styles)

## Should I be concerned that Gutenberg will make my plugin obsolete?

The goal of Gutenberg is not to put anyone out of business. It's to evolve WordPress so there's more business to be had in the future, for everyone.

Aside from enabling a rich post and page building experience, a meta goal is to _move WordPress forward_ as a platform. Not only by modernizing the UI, but by modernizing the foundation.

We realize it's a big change. We also think there will be many new opportunities for plugins. WordPress is likely to ship with a range of basic blocks, but there will be plenty of room for highly tailored premium plugins to augment existing blocks or add new blocks to the mix.

## Will I be able to opt out of Gutenberg for my site?

There is a “Classic” block, which is virtually the same as the current editor, except in block form.

There is also the [Classic Editor plugin](https://wordpress.org/plugins/classic-editor/) which restores the previous editor, see the plugin for more information. The WordPress Core team has committed to supporting the Classic Editor plugin [until December 2021](https://make.wordpress.org/core/2018/11/07/classic-editor-plugin-support-window/).


## How will custom TinyMCE buttons work in Gutenberg?

Custom TinyMCE buttons will still work in the “Classic” block, which is a block version of the classic editor you know today.

(Gutenberg comes with a new universal inserter tool, which gives you access to every block available, searchable, sorted by recency and categories. This inserter tool levels the playing field for every plugin that adds content to the editor, and provides a single interface to learn how to use.)

## How will shortcodes work in Gutenberg?

Shortcodes will continue to work as they do now.

However we see the block as an evolution of the `[shortcode]`. Instead of having to type out code, you can use the universal inserter tray to pick a block and get a richer interface for both configuring the block and previewing it. We would recommend people eventually upgrade their shortcodes to be blocks.

## Should I move shortcodes to content blocks?

We think so. Blocks are designed to be visually representative of the final look, and they will likely become the expected way in which users will discover and insert content in WordPress.

## Will Gutenberg be made properly accessible?

Accessibility is not an afterthought. Not every aspect of Gutenberg is accessible at the moment. You can check logged issues [here](https://github.com/WordPress/gutenberg/labels/Accessibility). We understand that WordPress is for everyone, and that accessibility is about inclusion. This is a key value for us.

If you would like to contribute to the accessibility of Gutenberg, we can always use more people to test and contribute.

## How is data stored? I've seen HTML comments, what is their purpose?

Our approach—as outlined in [the technical overview introduction](https://make.wordpress.org/core/2017/01/17/editor-technical-overview/)—is to augment the existing data format in a way that doesn’t break the decade-and-a-half-fabric of content WordPress provides. In other terms, this optimizes for a format that prioritizes human readability (the HTML document of the web) and easy-to-render-anywhere over a machine convenient file (JSON in post-meta) that benefits the editing context primarily.

This also [gives us the flexibility](https://github.com/WordPress/gutenberg/issues/1516) to store those blocks that are inherently separate from the content stream (reusable pieces like widgets or small post type elements) elsewhere, and just keep token references for their placement.

We suggest you look at the [Gutenberg key concepts](/docs/designers-developers/key-concepts.md) to learn more about how this aspect of the project works.

## How can I parse the post content back out into blocks in PHP or JS?
In JS:

```js
var blocks = wp.blocks.parse( postContent );
```

In PHP:

```php
$blocks = parse_blocks( $post_content );
```

## Why should I start using this once released?
Blocks are likely to become the main way users interact with content. Users are going to be discovering functionality in the new universal inserter tool, with a richer block interface that provides more layout opportunities.

## What features will be available at launch? What does the post-launch roadmap look like?
As part of the focus on the editor in 2017, a focus on customization and sitebuilding is next. From [the kickoff post](https://make.wordpress.org/core/2017/01/04/focus-tech-and-design-leads/):

> The customizer will help out the editor at first, then shift to bring those fundamental building blocks into something that could allow customization “outside of the box” of post_content, including sidebars and possibly even an entire theme.

With the editor, we lay the foundation for bigger things when it comes to page building and customization.

A lot of features are planned, too many to list. But a rough roadmap is: v1) post and page editor v2) page template editor, v3) site builder.

## WordPress is already the world's most popular publishing platform. Why change the editor at all?
As an open-source project, we believe that it is critical for WordPress to continue to innovate and keep working to make the core experience intuitive and enjoyable for all users. As a community project, Gutenberg has the potential to do just that, and we're excited to pursue this goal together. If you'd like to test, contribute, or offer feedback, [we welcome it here](http://wordpressdotorg.polldaddy.com/s/gutenberg-support).
