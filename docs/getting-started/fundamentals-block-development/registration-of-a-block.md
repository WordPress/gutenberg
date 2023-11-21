# Registration of a block

A block is usually registered through a plugin in both the server and the client using its `block.json` metadata. 

Although technically, blocks could be registered only on the client, **registering blocks in both the server and the client is a general recommendation**, as some features like Dynamic Rendering, Block Hooks, or Block style variations won't work properly without a server registration of the block. 

[![Open Block Registration diagram in excalidraw](https://developer.wordpress.org/files/2023/11/block-registration-e1700493399839.png)](https://excalidraw.com/#json=PUQu7jpvbKsUHYfpHWn7s,61QnhpZtjykp3s44lbUN_g "Open Block Registration diagram in excalidraw")

### Registration of the block with PHP (server-side)

A block registration in the server usually takes place in the main plugin PHP file with the `register_block_type` function called on the `init` action.

The [`register_block_type`](https://developer.wordpress.org/reference/functions/register_block_type/) function, that aims to simplify the block type registration on the server, can read metadata stored in the `block.json` file.

This function takes two params relevant in this context (`$block_type` accepts more types and variants):

-   `$block_type` (`string`) – path to the folder where the `block.json` file is located or full path to the metadata file if named differently.
-   `$args` (`array`) – an optional array of block type arguments. Default value: `[]`. Any arguments may be defined. However, the one described below is supported by default:
    -   `$render_callback` (`callable`) – callback used to render blocks of this block type, it's an alternative to the `render` field in `block.json`.

As part of the build process, the `block.json` is usually copied from the `src` folder to the `build` folder, so the `block.json` registered should be the one in the `build` folder.

`register_block_type` returns the registered block type (`WP_Block_Type`) on success or `false` on failure.

**Example:**
```php
register_block_type(
	__DIR__ . '/notice',
	array(
		'render_callback' => 'render_block_core_notice',
	)
);
```

**Example:**
```php
function minimal_block_ca6eda___register_block() {
	register_block_type( __DIR__ . '/build' );
}

add_action( 'init', 'minimal_block_ca6eda___register_block' );
```
_See the [full block example](https://github.com/WordPress/block-development-examples/tree/trunk/plugins/minimal-block-ca6eda) of the  [code above](https://github.com/WordPress/block-development-examples/blob/trunk/plugins/minimal-block-ca6eda/index.php)_

### Registration of the block with JavaScript (client-side)

When the block is registered on the server, you only need to register the client-side settings on the client using the same block’s name.

**Example:**

```js
registerBlockType( 'my-plugin/notice', {
	edit: Edit,
	// ...other client-side settings
} );
```

Although registering the block also on the server with PHP is still recommended for the reasons mentioned at ["Benefits using the metadata file"](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#benefits-using-the-metadata-file), if you want to register it only client-side you can use [`registerBlockType`](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-blocks/#registerblocktype) method from `@wordpress/blocks` package to register a block type using the metadata loaded from `block.json` file.

The function takes two params:

-   `$blockNameOrMetadata` (`string`|`Object`) – block type name (supported previously) or the metadata object loaded from the `block.json` file with a bundler (e.g., webpack) or a custom Babel plugin.
-   `$settings` (`Object`) – client-side block settings.

The client-side block settings object passed as a second parameter include two properties that are especially relevant:
	- `edit`: The React component that gets used in the editor for our block.
	- `save`: The React component that generates the static HTML markup that gets saved to the Database. 


`registerBlockType` returns the registered block type (`WPBlock`) on success or `undefined` on failure.

**Example:**

```
import { registerBlockType } from '@wordpress/blocks';
import metadata from './block.json';

registerBlockType( metadata.name, {
	edit() {
		return <p>Hello World - Block Editor</p>;
	},
	save() {
		return <p>Hello World - Frontend</p>;
	},
} );
```
_See the [code above](https://github.com/WordPress/block-development-examples/blob/trunk/plugins/minimal-block-ca6eda/src/index.js) in [an example](https://github.com/WordPress/block-development-examples/tree/trunk/plugins/minimal-block-ca6eda)_

## Additional resources

- [`register_block_type` PHP function](https://developer.wordpress.org/reference/functions/register_block_type/)
- [`registerBlockType` JS function](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-blocks/#registerblocktype)
- [Why a block needs to be registered in both the server and the client?](https://github.com/WordPress/gutenberg/discussions/55884) | GitHub Discussion