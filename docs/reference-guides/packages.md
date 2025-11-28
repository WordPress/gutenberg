# Package Reference

WordPress exposes a list of JavaScript packages and tools for WordPress development.

For information on creating and managing packages in Gutenberg, see the [packages README](../../packages/README.md). For details on the build system and package configuration, see the [@wordpress/build README](../../packages/wp-build/README.md).

## Package Guidelines

Packages are the first layer of architecture and organization in Gutenberg. They exist to separate concerns, provide clarity, and establish a shared mental model across teams. To maintain good package hygiene, follow these guidelines when creating new packages or iterating on existing ones:

1. **Each package should have a single, clear purpose.**

   It should be immediately obvious why the package exists.

2. **Every package must include a README.**

   This is the first place contributors look to understand scope and usage.

3. **Any prerequisites must be documented.**

   Generic packages without prerequisites are better, but packages with some prerequisites are acceptable. Examples of prerequisites: API endpoints that must exist, authentication assumptions, environment dependencies. These should be clearly stated in the README.

4. **Public APIs should have documentation.**

   Either inline in the README or linked to external docs.

5. **Avoid utility and kitchen-sink packages.**

   They tend to grow without a coherent domain and become junk drawers.

6. **Avoid broad, catch-all scopes.**

   For example: "Reusable components for the WooCommerce plugin." This creates unclear ownership and encourages uncontrolled growth.

7. **Default to bundled packages (no globals, no modules) unless necessary.**

   In Gutenberg, we should default to "bundled" packages unless there's a specific need for globals or modules. See the [@wordpress/build README](../../packages/wp-build/README.md) for more information on package configuration.

## Using the packages via WordPress global

JavaScript packages are available as a registered script in WordPress and can be accessed using the `wp` global variable.

If you wanted to use the `PlainText` component from the block editor module, first you would specify `wp-block-editor` as a dependency when you enqueue your script:

```php
wp_enqueue_script(
	'my-custom-block',
	plugins_url( $block_path, __FILE__ ),
	array( 'react', 'wp-blocks', 'wp-block-editor', 'wp-i18n' )
);
```

After the dependency is declared, you can access the module in your JavaScript code using the global `wp` like so:

```js
const { PlainText } = wp.blockEditor;
```

## Using the packages via npm

All the packages are also available on [npm](https://www.npmjs.com/org/wordpress) if you want to bundle them in your code.

Using the same `PlainText` example, you would install the block editor module with npm:

```bash
npm install @wordpress/block-editor --save
```

Once installed, you can access the component in your code using:

```js
import { PlainText } from '@wordpress/block-editor';
```

## Testing JavaScript code from a specific major WordPress version

There is a way to quickly install a version of the individual WordPress package used with a given WordPress major version using [npm distribution tags](https://docs.npmjs.com/cli/v8/commands/npm-dist-tag) (example for WordPress `5.8.x`):

```bash
npm install @wordpress/block-editor@wp-5.8
```

It’s also possible to update all existing WordPress packages in the project with a single command:

```bash
npx @wordpress/scripts packages-update --dist-tag=wp-5.8
```

All major WordPress versions starting from `5.7.x` are supported (e.g., `wp-5.7` or `wp-6.0`). Each individual dist-tag always points to the latest bug fix release for that major version line.
