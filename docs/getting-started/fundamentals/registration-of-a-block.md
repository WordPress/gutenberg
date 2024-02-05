# Registration of a block

A block is usually registered through a plugin on both the server and client-side using its `block.json` metadata. 

Although technically, blocks could be registered only in the client, **registering blocks on both the server and in the client is a strong recommendation**. Some server-side features like Dynamic Rendering, Block Supports, Block Hooks, or Block style variations require the block to "exist" on the server, and they won't work properly without server registration of the block.

For example, to allow a block [to be styled via `theme.json`](https://developer.wordpress.org/themes/global-settings-and-styles/settings/blocks/), it needs to be registered on the server, otherwise, any styles assigned to it in `theme.json` will be ignored. 

[![Open Block Registration diagram image](https://developer.wordpress.org/files/2023/11/block-registration-e1700493399839.png)](https://developer.wordpress.org/files/2023/11/block-registration-e1700493399839.png "Open Block Registration diagram image")

## Registration of the block with PHP (server-side)

Block registration on the server usually takes place in the main plugin PHP file with the `register_block_type` function called on the [init hook](https://developer.wordpress.org/reference/hooks/init/).

The [`register_block_type`](https://developer.wordpress.org/reference/functions/register_block_type/) function aims to simplify block type registration on the server by reading metadata stored in the `block.json` file.

This function takes two params relevant in this context (`$block_type` accepts more types and variants):

-   `$block_type` (`string`) – path to the folder where the `block.json` file is located or full path to the metadata file if named differently.
-   `$args` (`array`) – an optional array of block type arguments. Default value: `[]`. Any arguments may be defined. However, the one described below is supported by default:
    -   `$render_callback` (`callable`) – callback used to render blocks of this block type, it's an alternative to the `render` field in `block.json`.

As part of the build process, the `block.json` file is usually copied from the `src` folder to the `build` folder, so the path to the `block.json` of your registered block should refer to the `build` folder.

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

## Registration of the block with JavaScript (client-side)

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

-   `$blockNameOrMetadata` (`string`|`Object`) – block type name or the metadata object loaded from the `block.json`
-   `$settings` (`Object`) – client-side block settings.

<div class="callout callout-tip">
The content of <code>block.json</code> (or any other <code>.json</code> file) can be imported directly into Javascript files when using <a href="https://developer.wordpress.org/block-editor/getting-started/devenv/get-started-with-wp-scripts/#the-build-process-with-wp-scripts">a build process like the one available with <code>wp-scripts</code></a>
</div>

The client-side block settings object passed as a second parameter includes two especially relevant properties:

- `edit`: The React component that gets used in the editor for our block.
- `save`: The function that returns the static HTML markup that gets saved to the Database. 

`registerBlockType` returns the registered block type (`WPBlock`) on success or `undefined` on failure.

**Example:**

```js
import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps } from '@wordpress/block-editor';
import metadata from './block.json';

const Edit = () => <p { ...useBlockProps() }>Hello World - Block Editor</p>;
const save = () => <p { ...useBlockProps.save() }>Hello World - Frontend</p>;

registerBlockType( metadata.name, {
	edit: Edit,
	save,
} );
```
_See the [code above](https://github.com/WordPress/block-development-examples/blob/trunk/plugins/minimal-block-ca6eda/src/index.js) in [an example](https://github.com/WordPress/block-development-examples/tree/trunk/plugins/minimal-block-ca6eda)_

## Additional resources

- [`register_block_type` PHP function](https://developer.wordpress.org/reference/functions/register_block_type/)
- [`registerBlockType` JS function](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-blocks/#registerblocktype)
- [Why a block needs to be registered in both the server and the client?](https://github.com/WordPress/gutenberg/discussions/55884) | GitHub Discussion
- [Block Registration diagram](https://excalidraw.com/#json=PUQu7jpvbKsUHYfpHWn7s,61QnhpZtjykp3s44lbUN_g)
