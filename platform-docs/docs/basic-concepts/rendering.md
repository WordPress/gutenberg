---
sidebar_position: 8
---

# Rendering blocks

## HTML Serialization and Parsing

After editing your blocks, you may choose to persist them as JSON or serialize them to HTML.

Given a block list object, you can retrieve an initial HTML version like so:

```js
import { serialize } from '@wordpress/blocks';

const blockList = [
    {
        name: 'core/paragraph',
        attributes: {
            content: 'Hello world!',
        },
    },
];

const html = serialize( blockList );
```

If needed, it is also possible to parse back the HTML into a block list object:

```js
import { parse } from '@wordpress/blocks';

const blockList = parse( html );
```

## Going further

Some of the customizations that the core blocks offer, like layout styles, do not output the necessary CSS using the `serialize` function. Instead in the editor, an additional style element is appended to the document head. This is done to avoid bloating the HTML output with unnecessary CSS.

We're currently working on providing a utility that allows you to render blocks with all the necessary CSS.
