# `block.json`

The `block.json` file simplifies the processs of defining a block and using the same block's definition to register the block in both the server and the client.

[![Open block.json diagram in excalidraw](https://developer.wordpress.org/files/2023/11/block-json.png)](https://excalidraw.com/#json=v1GrIkGsYGKv8P14irBy6,Yy0vl8q7DTTL2VsH5Ww27A "Open block.json diagram in excalidraw")

Besides simplifying the registration of a block, the use of a `block.json` [has several benefits](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#benefits-using-the-metadata-file) including performance and development.

Development is improved by using a defined schema definition file that provides tooltips, autocomplete, and schema validation in the IDE. To use the schema, add the following to the top of the `block.json`:

```
"$schema": "https://schemas.wp.org/trunk/block.json"
```

Here's [the `block.json`](https://github.com/WordPress/block-development-examples/blob/trunk/plugins/block-supports-6aa4dd/src/block.json) of [a block example](https://github.com/WordPress/block-development-examples/tree/trunk/plugins/block-supports-6aa4dd) 

```json
{
	"$schema": "https://schemas.wp.org/trunk/block.json",
	"apiVersion": 3,
	"name": "block-development-examples/block-supports-6aa4dd",
	"version": "0.1.0",
	"title": "Block Supports 6aa4dd",
	"category": "widgets",
	"attributes": {
		"content": {
			"type": "string",
			"source": "html",
			"selector": "p"
		}
	},
	"example": {
		"attributes": {
			"content": "Hello world"
		}
	},
	"textdomain": "block-development-examples",
	"editorScript": "file:./index.js",
	"editorStyle": "file:./index.css",
	"style": "file:./style-index.css",
	"keywords": [ "6aa4dd" ],
	"supports": {
		"color": {
			"text": true,
			"link": true,
			"background": true
		}
	}
}
```

At [**Reference Guides / Block API Reference / Metadata in block.json**](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#benefits-using-the-metadata-file) you can find a detailed explanation of all the properties you can set in a `block.json` for a block.

These properties allow to set different things for the block:
    - Basic definition properties such as:
        - The `$schema` property
        - The `name` property
        - The `title` property
        - The `category` property

    - Relative path for files that define the block's behaviour, output or style such as:
        - The `editorScript` property
        - The `style` property
        - The `editorStyle` property
        - The `render` property
        - The `viewScript` property

    - Feature enabler properties such as:
        - The `attributes` property
        - The `supports` property

