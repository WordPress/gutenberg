---
sidebar_position: 2
---

# Data Format

A block editor document is a collection of semantically consistent descriptions of what each block is and what its essential data is.

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

## HTML serialization and parsing

While block editors powered by Gutenberg manipulate and edit the content as a JavaScript array of blocks, the Gutenberg framework also offers a way to serialize the blocks into HTML and parse them back.

```js
import { serialize, parse } from '@wordpress/blocks';

const value = [ block1, block2, block3 ];

const html = serialize( value );

const parsedValue = parse( html ); // This should be equivalent to value.
```

### Delimiters and Parsing Expression Grammar

In order to keep the metadata of the blocks within the serialized HTML, we chose to use HTML comments in order to keep the formality, explicitness, and unambiguity in the existing HTML syntax.

By storing data in HTML comments, we would know that we wouldn't break the rest of the HTML in the document, that browsers should ignore it, and that we could simplify our approach to parsing the document.

Unique to HTML comments is the fact that they cannot legitimately exist in ambiguous places, such as inside of HTML attributes like `<img alt='data-id="14"'>`. Comments are also quite permissive. Whereas HTML attributes are complicated to parse properly, comments are quite easily described by a leading `<!--` followed by anything except `--` until the first `-->`. This simplicity and permissiveness means that the parser can be implemented in several ways without needing to understand HTML properly, and we have the liberty to use more convenient syntax inside of the comment: we only need to escape double-hyphen sequences. We take advantage of this in how we store block attributes: as JSON literals inside the comment.

After running this through the parser, we're left with a simple object we can manipulate idiomatically, and we don't have to worry about escaping or unescaping the data. It's handled for us through the serialization process. Because the comments are so different from other HTML tags and because we can perform a first-pass to extract the top-level blocks, we don't actually depend on having fully valid HTML!

This has dramatic implications for how simple and performant we can make our parser. These explicit boundaries also protect damage to a single block from bleeding into other blocks or tarnishing the entire document. It also allows the system to identify unrecognized blocks before rendering them.

_N.B.:_ The defining aspects of blocks are their semantics and the isolation mechanism they provide: in other words, their identity. On the other hand, where their data is stored is a more liberal aspect. Blocks support more than just static local data (via JSON literals inside the HTML comment or within the block's HTML), and more mechanisms (_e.g._, global blocks or otherwise resorting to storage in complementary `WP_Post` objects) are expected.

### The Anatomy of a Serialized Block

When blocks are serialized as HTML, their attributes—depending on the nature of the block—are serialized to these explicit comment delimiters.

```html
<!-- wp:image -->
<figure class="wp-block-image"><img src="source.jpg" alt="" /></figure>
<!-- /wp:image -->
```

A purely dynamic block that is to be server-rendered before display could look like this:

```html
<!-- wp:latest-posts {"postsToShow":4,"displayPostDate":true} /-->
```
