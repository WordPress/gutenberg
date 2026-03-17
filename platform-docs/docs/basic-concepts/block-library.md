---
sidebar_position: 4
---

# Block Library

The block editor relies on a registry of block types to render and edit blocks. The `@wordpress/block-library` package provides a set of core blocks that you can register in your application.

## Registering all block types

Registering blocks requires both loading the JavaScript code that makes the block type available for use and including the corresponding stylesheets.

To register all blocks from the block library, you can use the `registerCoreBlocks` function:

```js
import { registerCoreBlocks } from '@wordpress/block-library';

registerCoreBlocks();
```

And make sure to also load the stylesheets required for these blocks.

```js
import "@wordpress/block-library/build-style/common.css";
import "@wordpress/block-library/build-style/style.css";
import "@wordpress/block-library/build-style/editor.css";
```

## Registering individual blocks

That said, by default the block library includes a very big number of blocks and some of them may contain some WordPress-specific logic. For this reason, if you're building a third-party block editor, it's recommended to only register the blocks that you need.

### The paragraph block type

The main block type that almost all block editors need is the paragraph block. You can register it with the following code:

```js
import '@wordpress/block-library/build-module/paragraph/init';
import '@wordpress/block-library/build-style/paragraph/style.css';
import '@wordpress/block-library/build-style/paragraph/editor.css';
```

Also, the paragraph block is often used as the "default block" in the block editor. The default block has multiple purposes:

 - It's the block that is selected when the user starts typing or hits Enter.
 - It's the block that is inserted when the user clicks on the "Add block" button.
 - It's the block where the user can hit `/` to search for alternative block types.

You can mark the paragraph block as the default block with the following code:

```js
import { setDefaultBlockName } from '@wordpress/blocks';

setDefaultBlockName( 'core/paragraph' );
```

### The HTML block type

Another important block type that most block editors would want to use is the HTML block. This block allows users to insert arbitrary HTML code in the block editor and is often used to insert embeds or external content.

It is also used by the block editor to render blocks that are not registered in the block editor or as a fallback block type for random HTML content that can't be properly parsed into blocks.

You can register the HTML block with the following code:

```js
import '@wordpress/block-library/build-module/html/init';
import '@wordpress/block-library/build-style/html/editor.css';
```

And mark it as the fallback block type with the following code:

```js
import {
    setFreeformContentHandlerName,
    setUnregisteredTypeHandlerName
} from '@wordpress/blocks';

setFreeformContentHandlerName( 'core/html' );
setUnregisteredTypeHandlerName( 'core/html' );
```

### Extra blocks

In addition to these two default blocks, here's a non-exhaustive list of blocks that can be registered and used by any block editor:

 - **Heading block**: `heading`
 - **List block**: `list` and `list-item`
 - **Quote block**: `quote`
 - **Image block**: `image`
 - **Gallery block**: `gallery`
 - **Video block**: `video`
 - **Audio block**: `audio`
 - **Cover block**: `cover`
 - **File block**: `file`
 - **Code block**: `code`
 - **Preformatted block**: `preformatted`
 - **Pullquote block**: `pullquote`
 - **Table block**: `table`
 - **Verse block**: `verse`
 - **Separator block**: `separator`
 - **Spacer block**: `spacer`
 - **Columns block**: `columns` and `column`
 - **Group block**: `group`
 - **Button block**: `buttons` and `button`
 - **Social links block**: `social-links` and `social-link`

For each block, you'll need to load the JavaScript code and stylesheets. Some blocks have two stylesheets (`style.css` and `editor.css`). For example, to register the heading block, you can use the following code:

```js
import '@wordpress/block-library/build-module/heading/init';
import '@wordpress/block-library/build-style/heading/editor.css';
```
