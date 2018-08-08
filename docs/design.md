# Gutenberg Design Principles & Vision

This living document serves to describe some of the design principles and patterns that have served in designing the editor interface. The purpose is to explain the background for the design, to help inform future improvements, and to define how a great block should be designed.

## Principles

![Gutenberg Logo](https://cldup.com/J2MgjuShPv-3000x3000.png)

### Goal of Gutenberg

The all-encompassing goal of Gutenberg is to create a post and page building experience that makes it easy to create rich post layouts. 

From the [kickoff post](https://make.wordpress.org/core/2017/01/04/focus-tech-and-design-leads/):

> The editor will endeavour to create a new page and post building experience that makes writing rich posts effortless, and has “blocks” to make it easy what today might take shortcodes, custom HTML, or “mystery meat” embed discovery.

We can extract from this the following:

- **Authoring rich posts is a key strength of WordPress.**
- **The block concept aims to unify multiple different interfaces under a single umbrella.** Users shouldn’t have to write shortcodes, custom HTML or paste URLs to embed. Users should only have to learn how the block works, and then know how to do everything.
- **Gutenberg ams to make core features discoverable.** “Mystery meat” refers to hard to find features in software. WordPress supports a large amount of blocks and 30+ embeds, so let’s increase their visibility.

### Why

One thing that sets WordPress apart from other systems is that it allows users to create as rich a post layout as they can imagine — but only if they know HTML & CSS and build their own custom theme. By thinking of the editor as a tool to let users write rich posts, and in a few clicks create beautiful layouts, hopefully, we can make people start to love WordPress and what it can do for their content, as opposed to pick it because it installed with one click.

### Vision

Gutenberg aims to make it much easier to author rich content. This is achieved by ensuring good defaults, bundling advanced layout options into blocks, and making the most important actions immediately available. Authoring content with WordPress should be accessible to anyone.

**Everything is a block.** Text, images, galleries, widgets, shortcodes, and even chunks of custom HTML, no matter if it’s added by plugins or otherwise. Users should only have to learn a single interface: the block interface. 

**All blocks are created equal.** They all live in the same inserter interface. We use recency, search, tabs, and grouping, to ensure the blocks users use the most are easily within reach.

**Drag and drop is secondary.** For greater accessibility and platform compatibility, drag and drop is used as an additive enhancement on top of more explicit actions (like click, tab, and and space). 

**Placeholders are key.** If a block can have a neutral placeholder state, it should. An image placeholder block shows a button to open the media library, and a text placeholder block shows a writing prompt. By embracing placeholders we can predefine editable layouts, so all users have to do is fill in the blanks.

**Direct manipulation.** The blocks interface allows users to manipulate content directly on the page. Plugin and theme authors will support and extend this experience by creating their own custom blocks.

**Customization.** What previously required using complicated markup and shielding users from breaking it — through shortcodes, meta-fields, etc. — becomes easier and more intuitive. A developer will be able to provide custom blocks that directly render portions of a layout (a three columns grid of features, for instance) and clearly specifies what can be directly edited by the user. That means the user can easily update text, swap images, reduce the number of columns, and more — all without having to ask a developer, or worrying that they will break things.

### Future Opportunities

The initial phase of Gutenberg — as described in the the kickoff goal — is primarily limited to the confines of the content area (specifically `post_content`) of posts and pages. Within those confines, we are embracing the web as a vertical river of content, by appending blocks sequentially, then adding layout options to each block.

That said, there isn’t any fixed limit to the kind of layout Gutenberg will be able to accomplish in the future. It’s very possible for Gutenberg to grow beyond the confines of post and page content, to include the whole page. For instance, one could think of a theme template as a comma separated list of blocks, like this:

```{
	'theme/header',
	'theme/sidebar',
	'core/content' {
		'core/cover-image',
		'theme/author-card',
		'core/text',
	},
	'theme/footer',
}```

Every block nested inside the content block would be _rearrangeable_. Every block would be _editable_. Every block would be built using the same API, and both the editor and the theme would load the same style.css file directly. In the end, both the editor/page builder and theme/front-end would appear near-identical, allowing for a true WYSIWYG experience.

This concept is speculative, but it’s one direction Gutenberg could go in the future.