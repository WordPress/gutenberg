# `block.json`

The `block.json` file simplifies the processs of defining a block and using the same block's definition to register the block in both the server and the client.

[![Open block.json diagram in excalidraw](https://developer.wordpress.org/files/2023/11/block-json.png)](https://excalidraw.com/#json=v1GrIkGsYGKv8P14irBy6,Yy0vl8q7DTTL2VsH5Ww27A "Open block.json diagram in excalidraw")

_Check [here](https://github.com/WordPress/block-development-examples/blob/trunk/plugins/block-supports-6aa4dd/src/block.json) the `block.json` of [a block example](https://github.com/WordPress/block-development-examples/tree/trunk/plugins/block-supports-6aa4dd)_

Besides simplifying a block's registration, using a `block.json` has [several benefits](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#benefits-using-the-metadata-file), including improved performance and development.

At ["Metadata in block.json"](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#benefits-using-the-metadata-file) you can find a detailed explanation of all the properties you can set in a `block.json` for a block. Besides providing basic metadata to identify the block and discover it, with these properties you can define things such as:

- Files to determine the block's behavior, output, or style 
- Data Storage in the Block
- Setting UI panels for the block

## Files to determine the block's behavior, output, or style 

The `editorScript` and `editorStyle` properties allow us to define Javascript and CSS files to be enqueued and loaded **only in the editor**.

The `script` and `style` properties allow us to define Javascript and CSS files to be enqueued and loaded **in both the editor and the frontend**.

The `viewScript` and `style` property allow us to define Javascript file to be enqueued and loaded **only in the editor**.

All these properties (`editorScript`, `editorStyle`, `script` `style`,`viewScript`) accept as a value a path prefixed with `file:`, a handle registered with `wp_register_script` or `wp_register_style`, or an array with a mix of both.

The `render` property...


## Enable UI panels

-----


- Basic definition properties
- Relative paths for key files that define the block's behaviour, output or style such as:
	- The `editorScript` property
	- The `style` property
	- The `editorStyle` property
	- The `render` property
	- The `viewScript` property

- Feature enabler properties such as:
	- The `attributes` property
	- The `supports` property


-----

 such as:
	- The `$schema` property
	- The `name` property
	- The `title` property
	- The `category` property

-----
One of the most versatile features of a block is their ability to store data  stored along witht


Attributes provide the structured data needs of a block. They can exist in different forms when they are serialized, but they are declared together under a common interface.

See the the attributes documentation for more details.

## Definition properties

https://github.com/WordPress/block-development-examples/blob/trunk/plugins/minimal-block-ca6eda/src/block.json

Development is improved by using a defined schema definition file that provides tooltips, autocomplete, and schema validation in the IDE. To use the schema, add the following to the top of the `block.json`:

```
"$schema": "https://schemas.wp.org/trunk/block.json"
```






