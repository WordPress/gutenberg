# Key Concepts

## Blocks

Blocks are an abstract unit for organizing and composing content, strung together to create content for a webpage.

Blocks are hierarchical in that a block can be a child of or parent to another block. For example, a two-column Columns block can be the parent block to multiple child blocks in each of its columns.

If it helps, you can think of blocks as a more graceful shortcode, with rich formatting tools for users to compose content. To this point, there is a new Block Grammar. Distilled, the block grammar is an HTML comment, either a self-closing tag or with a beginning tag and ending tag. In the main tag, depending on the block type and user customizations, there can be a JSON object. This raw form of the block is referred to as serialized.

```html
<!-- wp:paragraph {"key": "value"} -->
<p>Welcome to the world of blocks.</p>
<!-- /wp:paragraph -->
```

Blocks can be static or dynamic. Static blocks contain rendered content and an object of Attributes used to re-render based on changes. Dynamic blocks require server-side data and rendering while the post content is being generated (rendering).

Each block contains Attributes or configuration settings, which can be sourced from raw HTML in the content via meta or other customizable origins.

The Paragraph is the default block. Instead of a new line upon typing `return` on a keyboard, try to think of it as an empty Paragraph block (type "/" to trigger an autocompleting Slash Inserter -- "/image" will pull up Images as well as Instagram embeds).

Users insert new blocks by clicking the plus button for the Block Inserter, typing "/" for the Slash Inserter, or typing `return` for a blank Paragraph block.

Blocks can be duplicated within content using the menu from the block's toolbar or via keyboard shortcut.

Blocks can also be made repeatable, allowing them to be shared across posts and post types and/or used multiple times in the same post. If a reusable block is edited in one place, those changes are reflected everywhere that that block is used.

Blocks can be limited or locked-in-place by Templates and custom code.

#### More on Blocks

- **Block API**
- **Block Styles**
- **Tutorial: Building A Custom Block**

## Block Categories

In the Block Inserter (the accordion-sorted, popup modal that shows a site's available blocks to users) each accordion title is a Block Category, which are either the defaults or customized by developers through Plugins or code.

## Reusable blocks

Reusable blocks are a way to share a block (or multiple blocks) as a reusable, repeatable piece of content.

Any edits to a reusable block are made to every usage of that repeatable block.

Reusable blocks are stored as a hidden post type and are dynamic blocks that "ref" or reference the post_id and return the post_content for that wp_block.

## Templates

At the core of Gutenberg lies the concept of the block. From a technical point of view, blocks both raise the level of abstraction from a single document to a collection of meaningful elements, and they replace ambiguity—inherent in HTML—with explicit structure. A post in Gutenberg is then a _collection of blocks_.

To understand how blocks operate at a data-structure level, let's take a small detour to the simile of the printing press of Johannes Gutenberg. In letterpress, a finished page was assembled from individual characters, and then a test print was made in a [galley](https://en.wikipedia.org/wiki/Galley_proof) and then locked into a [chase](https://en.wikipedia.org/wiki/Chase_(printing)) to create a fully formed page. Once printed, there was no need to know whether it was set via individual letters, type slugs from a [linotype machine](https://en.wikipedia.org/wiki/Linotype_machine), or even one giant plate.

The same is true with content blocks. Blocks are the way in which users create content, but they no longer matter once the content is finished. That is, until it needs to be edited. Imagine if the printing press were able to print a page _while_ also including in that page the instructions to generate the set of movable type required to print it again. What we are doing with blocks could be compared to printing invisible marks in the margins so that the printer can make adjustments to an already printed page without needing to set the page again from scratch.

Content in WordPress is stored as HTML-like text in `post_content`. HTML is a robust document markup format and has been used to describe content as simple as unformatted paragraphs of text and as complex as entire application interfaces. Understanding HTML is not trivial; a significant number of existing documents and tools deal with technically invalid or ambiguous code. This code, even when valid, can be incredibly tricky and complicated to parse – and to understand.

The main point of blocks is to let the machines work at what they are good at and optimize for the user and the document. The analogy with the printing press can be taken further in that what matters is the printed page, not the arrangement of metal type that produced it. As a matter of fact, the arrangement of type is a pretty inconvenient storage mechanism. The page is both the result _and_ a better way to store the data. The metal type is just an instrument for publication and editing (but more ephemeral in nature), just like our use of an object tree (e.g. JSON) in the editor. We have the ability to rebuild this structure from the printed page, as if we had printed notations in the margins to allow a machine to know which [sorts](<https://en.wikipedia.org/wiki/Sort_(typesetting)>) (metal type) to assemble to recreate the page.

## Blocks are higher-level than HTML

Blocks are a helpful tool to describe how to edit content that goes beyond simple text, but they don't carry much meaning _once_ the final page has been generated and is consumed as an HTML document. Even though the end result is HTML in a browser, a "block" connotes more meaning than the HTML it generates. That extra meaning is what enables the rich editing experience, as it allows the application to include tools to help the user craft the content they want. The HTML is augmented with the editing tools. For many blocks, the HTML produced is incidental and subject to change. Blocks can be powerful and significantly more complex than the HTML they produce.

The problem an editor like Gutenberg faces is that once things have been transformed into HTML, there's no inherent meaning in the HTML markup anymore from which to construct a specific block interface back, which means that the HTML content can be ambiguous: the _same_ markup can correspond to entirely _different_ blocks. One consequence of this fact is that it demonstrates how we lose meaning when we move down to HTML alone. So, there needs to be a reliable way to know a block type without having to understand HTML.

Additionally, how do we even know this came from our editor? Maybe someone snuck it in by hand when trying to quickly jump in and change the page. When entered manually, the structure of the higher-level meaning is implicit and indistinguishable from the same markup. When Gutenberg operates on a block, it knows the block's type and attributes without inspecting the HTML source.

## The post dichotomy

A Gutenberg post is the proper block-aware representation of a post: a collection of semantically consistent descriptions of what each block is and what its essential data is. This representation only ever exists in memory. It is the [chase](<https://en.wikipedia.org/wiki/Chase_(printing)>) in the typesetter's workshop, ever-shifting as [sorts](<https://en.wikipedia.org/wiki/Sort_(typesetting)>) are attached and repositioned.

A Gutenberg post is not the artifact it produces, namely the `post_content`. The latter is the printed page, optimized for the reader but retaining its invisible markings for later editing.

Later sections of this document will refer to _Gutenberg post_ and to _blocks_. These are to be assumed not to be the `post_content` or the invisible markings.

## A Tree of Blocks

During runtime, blocks are kept in memory, Thus, a Gutenberg post isn't HTML, but a tree of objects and associated attributes. Gutenberg relies on a structure-preserving data model so that the editors and views for specific block types can remain independent from the final rendered HTML. It's a tree similar to how HTML is a tree, though at the top-level it's just a list of nodes—it needs no "root node".

The tree of objects describes the list of blocks that compose a post.

```js
[
	{
		type: "core/cover-image",
		attributes: {
			url: "my-hero.jpg",
			align: "full",
			hasParallax: false,
			hasBackgroundDim: true
		},
		children: ["Gutenberg posts aren't HTML"]
	},
	{
		type: "core/paragraph",
		children: ["Lately I've been hearing plen…"]
	}
];
```

## Serialization and the Purpose of HTML Comments

Gutenberg's data model, however, is something that lives in memory while editing a post. It's not visible to the page viewer when rendered, just like a printed page has no trace of the structure of the letters that produced it in the press.

Since the whole WordPress ecosystem has an expectation for receiving HTML when rendering or editing a post, Gutenberg transforms its data model into something that can be saved in `post_content` through serialization. This assures that there's a single source of truth for the content, and that this source remains readable and compatible with all the tools that interact with WordPress content at the present. Were we to store the object tree separately, we would face the risk of `post_content` and the tree getting out of sync and the problem of data duplication in both places.

Thus, the serialization process converts the tree into HTML using HTML comments as explicit block delimiters—which can contain the attributes in non-HTML form. This is the act of printing invisible marks on the printed page that leave a trace of the original structured intention.

This is one end of the process. The other is how to recreate the internal data tree of the collection of blocks whenever a post is to be edited again. A formal grammar defines how the serialized representation of a Gutenberg post should be loaded, just as some basic rules define how to turn the tree into an HTML-like string. Gutenberg posts aren't designed to be edited by hand; they aren't designed to be edited as HTML documents because Gutenberg posts aren't HTML in essence.

They just happen, incidentally, to be stored inside of `post_content` in a way in which they require no transformation in order to be viewable by any legacy system. It's true that loading the stored HTML into a browser without the corresponding machinery might degrade the experience, and if it included dynamic blocks of content, the dynamic elements may not load, server-generated content may not appear, and interactive content may remain static. However, it at least protects against not being able to view Gutenberg posts on themes and installations that are Gutenberg-unaware, and it provides the most accessible way to the content. In other words, the post remains mostly intact even if Gutenberg is not supported on the installation.

## Delimiters and Parsing Expression Grammar

We chose instead to try to find a way to keep the formality, explicitness, and unambiguity in the existing HTML syntax. Within the HTML there were a number of options.

Of these options, a novel approach was suggested: by storing data in HTML comments, we would know that we wouldn't break the rest of the HTML in the document, that browsers should ignore it, and that we could simplify our approach to parsing the document.

Unique to HTML comments is the fact that they cannot legitimately exist in ambiguous places, such as inside of HTML attributes like `<img alt='data-id="14"'>`. Comments are also quite permissive. Whereas HTML attributes are complicated to parse properly, comments are quite easily described by a leading `<!--` followed by anything except `--` until the first `-->`. This simplicity and permissiveness means that the parser can be implemented in several ways without needing to understand HTML properly, and we have the liberty to use more convenient syntax inside of the comment—we only need to escape double-hyphen sequences. We take advantage of this in how we store block attributes: as JSON literals inside the comment.

After running this through the parser, we're left with a simple object we can manipulate idiomatically, and we don't have to worry about escaping or unescaping the data. It's handled for us through the serialization process. Because the comments are so different from other HTML tags and because we can perform a first-pass to extract the top-level blocks, we don't actually depend on having fully valid HTML!

This has dramatic implications for how simple and performant we can make our parser. These explicit boundaries also protect damage in a single block from bleeding into other blocks or tarnishing the entire document. It also allows the system to identify unrecognized blocks before rendering them.

_N.B.:_ The defining aspects of blocks are their semantics and the isolation mechanism they provide: in other words, their identity. On the other hand, where their data is stored is a more liberal aspect. Blocks support more than just static local data (via JSON literals inside the HTML comment or within the block's HTML), and more mechanisms (_e.g._, global blocks or otherwise resorting to storage in complementary `WP_Post` objects) are expected. See [attributes](/docs/designers-developers/developers/block-api/block-attributes.md) for details.

## The Anatomy of a Serialized Block

When blocks are saved to the content after the editing session, its attributes—depending on the nature of the block—are serialized to these explicit comment delimiters.

```html
<!-- wp:image -->
<figure class="wp-block-image"><img src="source.jpg" alt="" /></figure>
<!-- /wp:image -->
```

A purely dynamic block that is to be server-rendered before display could look like this:

```html
<!-- wp:latest-posts {"postsToShow":4,"displayPostDate":true} /-->
```

## The Gutenberg Lifecycle

In summary, the Gutenberg workflow parses the saved document to an in-memory tree of blocks, using token delimiters to help. During editing, all manipulations happen within the block tree. The process ends by serializing the blocks back to the `post_content`.

The workflow process relies on a serialization/parser pair to persist posts. Hypothetically, the post data structure could be stored using a plugin or retrieved from a remote JSON file to be converted to the block tree.
