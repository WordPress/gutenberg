# Data Flow and Data Format

## The format

A block editor post is the proper block-aware representation of a post: a collection of semantically consistent descriptions of what each block is and what its essential data is. This representation only ever exists in memory. It is the [chase](<https://en.wikipedia.org/wiki/Chase_(printing)>) in the typesetter's workshop, ever-shifting as [sorts](<https://en.wikipedia.org/wiki/Sort_(typesetting)>) are attached and repositioned.

A block editor post is not the artifact it produces, namely the `post_content`. The latter is the printed page, optimized for the reader but retaining its invisible markings for later editing.

The input and output of the block editor is a tree of block objects with the current format:

```js
const value = [ block1, block2, block3 ];
```

### The block object

Each block object has an id, a set of attributes and potentially a list of child blocks.

```js
const block = {
	clientId, // unique string identifier.
	type, // The block type (paragraph, image...)
	attributes, // (key, value) set of attributes representing the direct properties/content of the current block.
	innerBlocks, // An array of child blocks or inner blocks.
};
```

Note the attributes keys and types, the allowed inner blocks are defined by the block type. For example, the core quote block has a `cite` string attribute representing the cite content while a heading block has a numeric `level` attribute, representing the level of the heading (1 to 6).

During the lifecycle of the block in the editor, the block object can receive extra metadata:

-   `isValid`: A boolean representing whether the block is valid or not;
-   `originalContent`: The original HTML serialization of the block.

**Examples**

```js
// A simple paragraph block.
const paragraphBlock1 = {
	clientId: '51828be1-5f0d-4a6b-8099-f4c6f897e0a3',
	type: 'core/paragraph',
	attributes: {
		content: 'This is the <strong>content</strong> of the paragraph block',
		dropCap: true,
	},
};

// A separator block.
const separatorBlock = {
	clientId: '51828be1-5f0d-4a6b-8099-f4c6f897e0a4',
	type: 'core/separator',
	attributes: {},
};

// A columns block with a paragraph block on each column.
const columnsBlock = {
	clientId: '51828be1-5f0d-4a6b-8099-f4c6f897e0a7',
	type: 'core/columns',
	attributes: {},
	innerBlocks: [
		{
			clientId: '51828be1-5f0d-4a6b-8099-f4c6f897e0a5',
			type: 'core/column',
			attributes: {},
			innerBlocks: [ paragraphBlock1 ],
		},
		{
			clientId: '51828be1-5f0d-4a6b-8099-f4c6f897e0a6',
			type: 'core/column',
			attributes: {},
			innerBlocks: [ paragraphBlock2 ],
		},
	],
};
```

## Serialization and Parsing

![Diagram](https://docs.google.com/drawings/d/1iuownt5etcih7rMMvPvh0Mny8zUA1Z28saxjxaWmfJ0/pub?w=1234&h=453)

This data model, however, is something that lives in memory while editing a post. It's not visible to the page viewer when rendered, just like a printed page has no trace of the structure of the letters that produced it in the press.

Since the whole WordPress ecosystem has an expectation for receiving HTML when rendering or editing a post, the block editor transforms its data into something that can be saved in `post_content` through serialization. This assures that there's a single source of truth for the content, and that this source remains readable and compatible with all the tools that interact with WordPress content at the present. Were we to store the object tree separately, we would face the risk of `post_content` and the tree getting out of sync and the problem of data duplication in both places.

Thus, the serialization process converts the block tree into HTML using HTML comments as explicit block delimiters—which can contain the attributes in non-HTML form. This is the act of printing invisible marks on the printed page that leave a trace of the original structured intention.

This is one end of the process. The other is how to recreate the collection of blocks whenever a post is to be edited again. A formal grammar defines how the serialized representation of a block editor post should be loaded, just as some basic rules define how to turn the tree into an HTML-like string. The block editor's posts aren't designed to be edited by hand; they aren't designed to be edited as HTML documents because the block editor posts aren't HTML in essence.

They just happen, incidentally, to be stored inside of `post_content` in a way in which they require no transformation in order to be viewable by any legacy system. It's true that loading the stored HTML into a browser without the corresponding machinery might degrade the experience, and if it included dynamic blocks of content, the dynamic elements may not load, server-generated content may not appear, and interactive content may remain static. However, it at least protects against not being able to view block editor posts on themes and installations that are blocks-unaware, and it provides the most accessible way to the content. In other words, the post remains mostly intact even if the saved HTML is rendered as is.

### Delimiters and Parsing Expression Grammar

We chose instead to try to find a way to keep the formality, explicitness, and unambiguity in the existing HTML syntax. Within the HTML there were a number of options.

Of these options, a novel approach was suggested: by storing data in HTML comments, we would know that we wouldn't break the rest of the HTML in the document, that browsers should ignore it, and that we could simplify our approach to parsing the document.

Unique to HTML comments is the fact that they cannot legitimately exist in ambiguous places, such as inside of HTML attributes like `<img alt='data-id="14"'>`. Comments are also quite permissive. Whereas HTML attributes are complicated to parse properly, comments are quite easily described by a leading `<!--` followed by anything except `--` until the first `-->`. This simplicity and permissiveness means that the parser can be implemented in several ways without needing to understand HTML properly, and we have the liberty to use more convenient syntax inside of the comment—we only need to escape double-hyphen sequences. We take advantage of this in how we store block attributes: as JSON literals inside the comment.

After running this through the parser, we're left with a simple object we can manipulate idiomatically, and we don't have to worry about escaping or unescaping the data. It's handled for us through the serialization process. Because the comments are so different from other HTML tags and because we can perform a first-pass to extract the top-level blocks, we don't actually depend on having fully valid HTML!

This has dramatic implications for how simple and performant we can make our parser. These explicit boundaries also protect damage in a single block from bleeding into other blocks or tarnishing the entire document. It also allows the system to identify unrecognized blocks before rendering them.

_N.B.:_ The defining aspects of blocks are their semantics and the isolation mechanism they provide: in other words, their identity. On the other hand, where their data is stored is a more liberal aspect. Blocks support more than just static local data (via JSON literals inside the HTML comment or within the block's HTML), and more mechanisms (_e.g._, global blocks or otherwise resorting to storage in complementary `WP_Post` objects) are expected. See [attributes](/docs/reference-guides/block-api/block-attributes.md) for details.

### The Anatomy of a Serialized Block

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

## The Data Lifecycle

In summary, the block editor workflow parses the saved document to an in-memory tree of blocks, using token delimiters to help. During editing, all manipulations happen within the block tree. The process ends by serializing the blocks back to the `post_content`.

The workflow process relies on a serialization/parser pair to persist posts. Hypothetically, the post data structure could be stored using a plugin or retrieved from a remote JSON file to be converted to the block tree.
