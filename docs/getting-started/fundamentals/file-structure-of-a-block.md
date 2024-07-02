# File structure of a block

When developing custom blocks for WordPress, it's best practice to register them within plugins rather than themes. This strategy guarantees that your blocks stay accessible, even when users switch themes. While there might be situations where embedding blocks directly into a theme could be appropriate, this guide focuses on blocks housed within a plugin. Specifically, it details the file structure as produced by the [`create-block`](https://developer.wordpress.org/block-editor/getting-started/devenv/get-started-with-create-block/) tool.

Adhering to the `create-block` tool's structure is not mandatory, but it serves as a reliable reference. The files it generates encompass everything needed for a block's definition and registration. Following this structure can help maintain consistency and ensure your blocks are well-organized and easy to maintain.

[![Open File Structure of a Block diagram image](https://developer.wordpress.org/files/2023/11/file-structure-block.png)](https://developer.wordpress.org/files/2023/11/file-structure-block.png "Open File Structure of a Block diagram image")

## `<plugin-file>.php`


When creating a block in a WordPress plugin, you usually register the block on the server in the main PHP file of the plugin. This is done using the [`register_block_type()`](https://developer.wordpress.org/reference/functions/register_block_type/) function. 

<div class="callout callout-info">
    For more on creating a WordPress plugin, refer to the documentation on <a href="https://developer.wordpress.org/plugins/plugin-basics/">Plugin Basics</a> and the <a href="https://developer.wordpress.org/plugins/plugin-basics/header-requirements/"> Header Requirements</a> for the main PHP file.
</div>

## `package.json`

The `package.json` file is used to configure a Node.js project, which is technically what a block plugin is. In this file, you define the `npm` dependencies of the block and the scripts used for local development.

## `src` folder

In a standard project, the `src` (source) folder contains the raw, uncompiled code, including JavaScript, CSS, and other assets necessary for developing the block. This is where you write and edit your block's source code, utilizing modern JavaScript features and JSX for React components.

The [build process](docs/block-editor/getting-started/fundamentals/javascript-in-the-block-editor/#javascript-build-process.md) provided by `wp-scripts` will then take the files from this folder and generate the production-ready files in the project's `build` folder. 

### `block.json`

The `block.json` file contains the [block's metadata](docs/block-editor/reference-guides/block-api/block-metadata/), streamlining its definition and registration across client-side and server-side environments. 

This file includes the block name, description, [attributes](docs/block-editor/reference-guides/block-api/block-attributes/), [supports](docs/block-editor/reference-guides/block-api/block-supports/), and more, as well as the locations of essential files responsible for the block's functionality, appearance, and styling. 

When a build process is applied, the `block.json` file and the other generated files are moved to a designated folder, often the `build` folder. Consequently, the file paths specified within `block.json` point to these processed, bundled versions of the files. 

A few of the most important properties that can be defined in a `block.json` are:

- **[`editorScript`](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#editor-script):** Usually set with the path of a bundled `index.js` file that was built from `src/index.js`.
- **[`style`](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#style):** Usually set with the path of a bundled `style-index.css` file that was built from `src/style.(css|scss|sass)`.
- **[`editorStyle`](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#editor-style):** Usually set with the path of a bundled `index.css` that was built from `src/editor.(css|scss|sass)`.
- **[`render`](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#render):** Usually set with the path of a bundled `render.php` that was copied from `src/render.php`.
- **[`viewScript`](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#view-script):** Usually set with the path of a bundled `view.js` that was built from `src/view.js`.

[![Open Build Output Diagram in excalidraw](https://developer.wordpress.org/files/2023/11/file-structure-build-output.png)](https://excalidraw.com/#json=c22LROgcG4JkD-7SkuE-N,rQW_ViJBq0Yk3qhCgqD6zQ "Open Build Output Diagram in excalidraw")

### `index.js`

The `index.js` file (or any other file defined in the `editorScript` property of `block.json`) is the entry point file for JavaScript that should only get loaded in the Block Editor. It's responsible for calling the `registerBlockType` function to register the block on the client and typically imports the `edit.js` and `save.js` files to get the functions required for block registration.

### `edit.js`

The `edit.js` file contains the React component responsible for rendering the block's editing user interface, allowing users to interact with and customize the block's content and settings in the Block Editor. This component gets passed to the [`edit`](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#edit) property of the `registerBlockType` function in the `index.js` file.

### `save.js`

The `save.js` exports the function that returns the static HTML markup that gets saved to the WordPress database. This function gets passed to the [`save`](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#save) property of the `registerBlockType` function in the `index.js` file.

### `style.(css|scss|sass)`

A `style` file with extensions `.css`, `.scss`, or `.sass` contains the styles of the block that will be loaded in both the Block Editor and on the front end. In the build process, this file is converted into `style-index.css`, which is usually defined using the [`style`](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#style) property in `block.json`

<div class="callout callout-info">
    The webpack configuration used internally by <code>wp-scripts</code> includes a <a href="https://webpack.js.org/loaders/css-loader/">css-loader</a> chained with <a herf="https://webpack.js.org/loaders/postcss-loader/">postcss-loader</a> and <a href="https://webpack.js.org/loaders/sass-loader/">sass-loader</a> that allows it to process CSS, SASS or SCSS files. Check <a href="https://developer.wordpress.org/block-editor/reference-guides/packages/packages-scripts/#default-webpack-config">Default webpack config</a> for more info
</div>

### `editor.(css|scss|sass)`

An `editor` file with extensions `.css`, `.scss`, or `.sass` contains the additional styles applied to the block in the Block Editor. You will often use this file for styles specific to the block's user interface. This file is converted to `index.css` during the build process, usually defined using the `editorStyle` property in `block.json`.

### `render.php`

The `render.php` file (or any other file defined in the [`render`](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#render) property of `block.json`) defines the server-side process that returns the markup for the block when there is a request from the front end. If defined, this file will take precedence over other ways to render the block's markup on the front end.

### `view.js`

The `view.js` file (or any other file defined in the [`viewScript`](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#view-script) property of `block.json`) will be loaded in the front end when the block is displayed.

## `build` folder

The `build` folder contains the compiled and optimized versions of the code from the `src` folder. These files are generated from the [build process](https://developer.wordpress.org/block-editor/getting-started/devenv/get-started-with-wp-scripts/#the-build-process-with-wp-scripts), triggered by the `build` or `start` commands of `wp-scripts`.

This transformation process includes minification, transpilation from modern JavaScript to a version compatible with a wider range of browsers, and bundling of assets for efficient loading. WordPress ultimately enqueues and uses the `build` folder's contents to render the block in the Block Editor and on the front end.

<div class="callout callout-info">
    You can use <code>webpack-src-dir</code> and <code>output-path</code> option of <code>wp-scripts</code> build commands to <a href="https://developer.wordpress.org/block-editor/reference-guides/packages/packages-scripts/#automatic-block-json-detection-and-the-source-code-directory">customize the entry and output points</a>.
</div>

## Additional resources

- [Diagram featuring the file structure of a block](https://excalidraw.com/#json=YYpeR-kY1ZMhFKVZxGhMi,mVZewfwNAh_oL-7bj4gmdw)
