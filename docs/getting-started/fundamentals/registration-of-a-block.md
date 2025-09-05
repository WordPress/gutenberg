# Registration of a block

Blocks in WordPress are typically bundled in a plugin and registered on both the server and client-side using `block.json` metadata.

While it's possible to register blocks solely on the client-side, best practices strongly advise registering them on both the server and client. This dual registration is crucial for enabling server-side features such as Dynamic Rendering, Block Supports, Block Hooks, and Style Variations. Without server-side registration, these functionalities will not operate correctly.

For instance, if you want a block [to be styled via `theme.json`](https://developer.wordpress.org/themes/global-settings-and-styles/settings/blocks/), it must be registered on the server. Otherwise, the block won't recognize or apply any styles assigned to it in `theme.json`.

The following diagram details the registration process for a block.

[![Open Block Registration diagram image](https://developer.wordpress.org/files/2023/11/block-registration-e1700493399839.png)](https://developer.wordpress.org/files/2023/11/block-registration-e1700493399839.png "Open Block Registration diagram image")

## Registering a block with PHP (server-side)

Block registration on the server usually takes place in the main plugin PHP file with the [`register_block_type()`](https://developer.wordpress.org/reference/functions/register_block_type/) function called on the [`init`](https://developer.wordpress.org/reference/hooks/init/) hook. This function simplifies block type registration by reading metadata stored in a `block.json` file.

This function is designed to register block types and primarily uses two parameters in this context, although it can accommodate more variations:

- **`$block_type` (`string`):** This can either be the path to the directory containing the `block.json` file or the complete path to the metadata file if it has a different name. This parameter tells WordPress where to find the block's configuration.

- **`$args` (`array`):** This is an optional parameter where you can specify additional arguments for the block type. By default, this is an empty array, but it can include various options, one of which is the `$render_callback`. This callback is used to render blocks on the front end and is an alternative to the `render` property in `block.json`.

During the development process, the `block.json` file is typically moved from the `src` (source) directory to the `build` directory as part of compiling your code. Therefore, when registering your block, ensure the `$block_type` path points to the `block.json` file within the `build` directory.

The `register_block_type()` function returns the registered block type (`WP_Block_Type`) on success or `false` on failure. Here is a simple example using the `render_callback`.

```php
register_block_type(
	__DIR__ . '/build',
	array(
		'render_callback' => 'render_block_core_notice',
	)
);
```

Here is a more complete example, including the `init` hook.

```php
function minimal_block_ca6eda___register_block() {
	register_block_type( __DIR__ . '/build' );
}
add_action( 'init', 'minimal_block_ca6eda___register_block' );
```

_See the [full block example](https://github.com/WordPress/block-development-examples/tree/trunk/plugins/minimal-block-ca6eda) of the  [code above](https://github.com/WordPress/block-development-examples/blob/trunk/plugins/minimal-block-ca6eda/plugin.php)_

## Registering a block with JavaScript (client-side)

When the block has already been registered on the server, you only need to register the client-side settings in JavaScript using the [`registerBlockType`](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-blocks/#registerblocktype) method from the `@wordpress/blocks` package. You just need to make sure you use the same block name as defined in the block's `block.json` file. Here's an example:

```js
import { registerBlockType } from '@wordpress/blocks';

registerBlockType( 'my-plugin/notice', {
	edit: Edit,
	// ...other client-side settings
} );
```

While it's generally advised to register blocks on the server using PHP for the benefits outlined in the ["Benefits using the metadata file"](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#benefits-using-the-metadata-file) section, you can opt to register a block solely on the client-side. The `registerBlockType` method allows you to register a block type using metadata.

The function accepts two parameters:

- **`blockNameOrMetadata` (`string`|`Object`):** This can either be the block type's name as a string or an object containing the block's metadata, which is typically loaded from the `block.json` file.
- **`settings` (`Object`):** This is an object containing the block's client-side settings.

<div class="callout callout-tip">
	You can import the contents of the <code>block.json</code> file (or any other <code>.json</code> file) directly into your JavaScript files if you're using a build process, such as the one provided by <a href="https://developer.wordpress.org/block-editor/getting-started/devenv/get-started-with-wp-scripts/#the-build-process-with-wp-scripts"><code>wp-scripts</code></a>.
</div>

The `settings` object passed as the second parameter includes many properties, but these are the two most important ones:

- **`edit`:** The React component that gets used in the Editor for our block.
- **`save`:** The function that returns the static HTML markup that gets saved to the database.

The `registerBlockType()` function returns the registered block type (`WPBlock`) on success or `undefined` on failure. Here's an example:

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

_See the [full block example](https://github.com/WordPress/block-development-examples/tree/trunk/plugins/minimal-block-ca6eda) of the [code above](https://github.com/WordPress/block-development-examples/blob/trunk/plugins/minimal-block-ca6eda/src/index.js)_

## Additional resources

- [`register_block_type` PHP function](https://developer.wordpress.org/reference/functions/register_block_type/)
- [`registerBlockType` JS function](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-blocks/#registerblocktype)
- [Why a block needs to be registered in both the server and the client?](https://github.com/WordPress/gutenberg/discussions/55884) | GitHub Discussion
- [Block Registration diagram](https://excalidraw.com/#json=PUQu7jpvbKsUHYfpHWn7s,61QnhpZtjykp3s44lbUN_g)
