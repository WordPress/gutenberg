# Building a custom block editor

The WordPress block editor is a powerful tool that allows you to create and format content in various ways. It is powered, in part, by the [`@wordpress/block-editor`](/packages/block-editor/README.md) package, which is a JavaScript library that provides the core functionality of the editor.

This package can also be used to create custom block editors for virtually any other web application. This means that you can use the same blocks and block editing experience outside of WordPress.

![alt text](https://developer.wordpress.org/files/2023/07/custom-block-editor.png 'The Standalone Editor instance populated with example Blocks within a custom WordPress admin page.')

This flexibility and interoperability makes blocks a powerful tool for building and managing content across multiple applications. It also makes it simpler for developers to create content editors that work best for their users.

This guide covers the basics of creating your first custom block editor.

## Introduction

With its many packages and components, the Gutenberg codebase can be daunting at first. But at its core, it's all about managing and editing blocks. So if you want to work on the editor, it's essential to understand how block editing works at a fundamental level.

This guide will walk you through building a fully functioning, custom block editor "instance" within WordPress. Along the way, we'll introduce you to the key packages and components, so you can see how the block editor works under the hood.

By the end of this article, you will have a solid understanding of the block editor's inner workings and be well on your way to creating your own block editor instances.

<div class="callout callout-tip">
	The code used throughout this guide is available for download in the <a href="https://github.com/getdave/standalone-block-editor">accompanying WordPress plugin</a>. The demo code in this plugin as an essential resource.
</div>

## Code syntax

The code snippets in this guide use JSX syntax. However, you could use plain JavaScript if you prefer. However, once familiar with JSX, many developers find it easier to read and write, so all code examples in the Block Editor Handbook use this syntax.

## What you're going to be building

Throughout this guide, you will create an (almost) fully functioning block editor instance. The result will look something like this:

![The Standalone Editor instance populated with example Blocks within a custom WordPress admin page](https://developer.wordpress.org/files/2023/07/custom-block-editor.png)

While it looks similar, this editor will not be the same _Block Editor_ you are familiar with when creating posts and pages in WordPress. Instead, it will be an entirely custom instance that will live within a custom WordPress admin page called "Block Editor."

The editor will have the following features:

-   Ability to add and edit all Core blocks.
-   Familiar visual styles and main/sidebar layout.
-   _Basic_ block persistence between page reloads.

## Plugin setup and organization

The custom editor is going to be built as a WordPress plugin. To keep things simple, the plugin will be named `Standalone Block Editor Demo` because that is what it does.

The plugin file structure will look like this:

![alt text](https://wordpress.org/gutenberg/files/2020/03/repo-files.png 'Screenshot showing file structure of the Plugin at https://github.com/getdave/standalone-block-editor.')

Here is a brief summary of what's going on:

-   `plugin.php` – Standard plugin "entry" file with comment meta data, which requires `init.php`.
-   `init.php` - Handles the initialization of the main plugin logic.
-   `src/` (directory) - This is where the JavaScript and CSS source files will live. These files are _not_ directly enqueued by the plugin.
-   `webpack.config.js` - A custom Webpack config extending the defaults provided by the [`@wordpress/scripts`](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-scripts/) npm package to allow for custom CSS styles (via Sass).

The only item not shown above is the `build/` directory, which is where the _compiled_ JS and CSS files are outputted by `@wordpress/scripts`. These files are enqueued by the plugin separately.

<div class="callout callout-info">
	Throughout this guide, filename references will be placed in a comment at the top of each code snippet so you can follow along.
</div>

With the basic file structure in place, let's look at what packages will be needed.

## The "Core" of the editor

While the WordPress Editor is comprised of many moving parts, at its core is the [`@wordpress/block-editor`](/packages/block-editor/README.md) package, which is best summarized by its own `README` file:

> This module allows you to create and use standalone block editors.

Perfect, this is the main package you will use to create the custom block editor instance. But first, you need to create a home for the editor.

## Creating the custom "Block Editor" page

Let's begin by creating a custom page within WordPress admin that will house the custom block editor instance.

<div class="callout callout-info">
	If you're already comfortable with the process of creating custom admin pages in WordPress, you might want to <a href="#registering-and-rendering-our-custom-block-editor">skip ahead</a>.
</div>

### Registering the page

To do this, you need to [register a custom admin page](https://developer.wordpress.org/reference/functions/add_menu_page/) using the standard WordPress [`add_menu_page()`](https://developer.wordpress.org/reference/functions/add_menu_page/) helper:

```php
// File: init.php

add_menu_page(
    'Standalone Block Editor',         // Visible page name
    'Block Editor',                    // Menu label
    'edit_posts',                      // Required capability
    'getdavesbe',                      // Hook/slug of page
    'getdave_sbe_render_block_editor', // Function to render the page
    'dashicons-welcome-widgets-menus'  // Custom icon
);
```

The `getdave_sbe_render_block_editor` function will be used to render the contents of the admin page. As a reminder, the source code for each step is available in the [accompanying plugin](https://github.com/getdave/standalone-block-editor).

### Adding the target HTML

Since the block editor is a React-powered application, you need to output some HTML into the custom page where JavaScript can render the block editor.

Let's use the `getdave_sbe_render_block_editor` function referenced in the step above.

```php
// File: init.php

function getdave_sbe_render_block_editor() {
	?>
	<div
		id="getdave-sbe-block-editor"
		class="getdave-sbe-block-editor"
	>
		Loading Editor...
	</div>
	<?php
}
```

The function outputs some basic placeholder HTML. Note the `id` attribute `getdave-sbe-block-editor`, which will be used shortly.

### Enqueuing JavaScript and CSS

With the target HTML in place, you can now enqueue some JavaScript and CSS so that they will run on the custom admin page.

To do this, let's hook into [`admin_enqueue_scripts`](https://developer.wordpress.org/reference/hooks/admin_enqueue_scripts/).

First, you must ensure the custom code is only run on the custom admin page. So, at the top of the callback function, exit early if the page doesn't match the page's identifier:

```php
// File: init.php

function getdave_sbe_block_editor_init( $hook ) {

    // Exit if not the correct page.
	if ( 'toplevel_page_getdavesbe' !== $hook ) {
		return;
    }
}

add_action( 'admin_enqueue_scripts', 'getdave_sbe_block_editor_init' );
```

With this in place, you can then safely register the main JavaScript file using the standard WordPress [`wp_enqueue_script()`](https://developer.wordpress.org/reference/functions/wp_enqueue_script/) function:

```php
// File: init.php

wp_enqueue_script( $script_handle, $script_url, $script_asset['dependencies'], $script_asset['version'] );
```

To save time and space, the `$script_` variables assignment has been omitted. You can [review these here](https://github.com/getdave/standalone-block-editor/blob/974a59dcbc539a0595e8fa34670e75ec541853ab/init.php#L19).

Note the third argument for script dependencies, `$script_asset['dependencies']`. These dependencies are
dynamically generated using [@wordpress/dependency-extraction-webpack-plugin](https://developer.wordpress.org/block-editor/packages/packages-dependency-extraction-webpack-plugin/) which will
[ensure that](https://developer.wordpress.org/block-editor/packages/packages-scripts/#default-webpack-config) WordPress provided scripts are not included in the built
bundle.

You also need to register both your custom CSS styles and the WordPress default formatting library to take advantage of some nice default styling:

```php
// File: init.php

// Enqueue default editor styles.
wp_enqueue_style( 'wp-format-library' );

// Enqueue custom styles.
wp_enqueue_style(
    'getdave-sbe-styles',                       // Handle
    plugins_url( 'build/index.css', __FILE__ ), // Block editor CSS
    array( 'wp-edit-blocks' ),                  // Dependency to include the CSS after it
    filemtime( __DIR__ . '/build/index.css' )
);
```

### Inlining the editor settings

Looking at the `@wordpress/block-editor` package, you can see that it accepts a [settings object](https://github.com/WordPress/gutenberg/tree/4c472c3443513d070a50ba1e96f3a476861447b3/packages/block-editor#SETTINGS_DEFAULTS) to configure the default settings for the editor. These are available on the server side, so you need to expose them for use within JavaScript.

To do this, let's [inline the settings object as JSON](https://github.com/getdave/standalone-block-editor/blob/974a59dcbc539a0595e8fa34670e75ec541853ab/init.php#L48) assigned to the global `window.getdaveSbeSettings` object:

```php
// File: init.php

// Get custom editor settings.
$settings = getdave_sbe_get_block_editor_settings();

// Inline all settings.
wp_add_inline_script( $script_handle, 'window.getdaveSbeSettings = ' . wp_json_encode( $settings ) . ';' );
```

## Registering and rendering the custom block editor

With the PHP above in place to create the admin page, you’re now finally ready to use JavaScript to render a block editor into the page’s HTML.

Begin by opening the main `src/index.js` file. Then pull in the required JavaScript packages and import the CSS styles. Note that using Sass requires [extending](https://github.com/getdave/standalone-block-editor/blob/974a59dcbc539a0595e8fa34670e75ec541853ab/webpack.config.js#L13) the default `@wordpress/scripts` Webpack config.

```js
// File: src/index.js

// External dependencies.
import { createRoot } from 'react-dom';

// WordPress dependencies.
import domReady from '@wordpress/dom-ready';
import { registerCoreBlocks } from '@wordpress/block-library';

// Internal dependencies.
import Editor from './editor';
import './styles.scss';
```

Next, once the DOM is ready you will need to run a function which:

- Grabs the editor settings from `window.getdaveSbeSettings` (previously inlined from PHP).
- Registers all the Core WordPress blocks using `registerCoreBlocks`.
- Renders an `<Editor>` component into the waiting `<div>` on the custom admin page.

```jsx
domReady( function () {
	const root = createRoot( document.getElementById( 'getdave-sbe-block-editor' ) );
	const settings = window.getdaveSbeSettings || {};
	registerCoreBlocks();
	root.render(
		<Editor settings={ settings } />
	);
} );
```

<div class="callout callout-info">
	It is possible to render the editor from PHP without creating an unnecessary JS global. Check out the <a href="https://href.li/?https://github.com/WordPress/gutenberg/blob/c6821d7e64a54eb322583a35daedc6c192ece850/lib/edit-site-page.php#L135">Edit Site</a> package in the Gutenberg plugin for an example of this.
</div>

## Reviewing the `<Editor>` component

Let's take a closer look at the `<Editor>` component that was used in the code above and lives in `src/editor.js` of the [companion plugin](https://github.com/getdave/standalone-block-editor).

Despite its name, this is not the actual core of the block editor. Rather, it is a _wrapper_ component that will contain the components that form the custom editor's main body.

### Dependencies

The first thing to do inside `<Editor>` is to pull in some dependencies.

```jsx
// File: src/editor.js

import Notices from 'components/notices';
import Header from 'components/header';
import Sidebar from 'components/sidebar';
import BlockEditor from 'components/block-editor';
```

The most important of these are the internal components `BlockEditor` and `Sidebar`, which will be covered shortly.

The remaining components consist mostly of static elements that form the editor's layout and surrounding user interface (UI). These elements include the header and notice areas, among others.

### Editor render

With these components available, you can define the `<Editor>` component.

```jsx
// File: src/editor.js

function Editor( { settings } ) {
	return (
		<DropZoneProvider>
			<div className="getdavesbe-block-editor-layout">
				<Notices />
				<Header />
				<Sidebar />
				<BlockEditor settings={ settings } />
			</div>
		</DropZoneProvider>
	);
}
```

In this process, the core of the editor's layout is being scaffolded, along with a few specialized [context providers](https://reactjs.org/docs/context.html#contextprovider) that make specific functionality available throughout the component hierarchy.

Let's examine these in more detail:

-   `<DropZoneProvider>` – Enables the use of [dropzones for drag and drop functionality](https://github.com/WordPress/gutenberg/tree/e38dbe958c04d8089695eb686d4f5caff2707505/packages/components/src/drop-zone)
-   `<Notices>` – Provides a "snack bar" Notice that will be rendered if any messages are dispatched to the `core/notices` store
-   `<Header>` – Renders the static title "Standalone Block Editor" at the top of the editor UI
-   `<BlockEditor>` – The custom block editor component

### Keyboard navigation

With this basic component structure in place, the only remaining thing left to do
is wrap everything in the [`navigateRegions` HOC](https://github.com/WordPress/gutenberg/tree/e38dbe958c04d8089695eb686d4f5caff2707505/packages/components/src/higher-order/navigate-regions) to provide keyboard navigation between the different "regions" in the layout.

```jsx
// File: src/editor.js

export default navigateRegions( Editor );
```

## The custom `<BlockEditor>`

Now the core layouts and components are in place. It's time to explore the custom implementation of the block editor itself.

The component for this is called `<BlockEditor>`, and this is where the magic happens.

Opening `src/components/block-editor/index.js` reveals that it's the most complex component encountered thus far. A lot going on, so start by focusing on what is being rendered by the `<BlockEditor>` component:

```js
// File: src/components/block-editor/index.js

return (
	<div className="getdavesbe-block-editor">
		<BlockEditorProvider
			value={ blocks }
			onInput={ updateBlocks }
			onChange={ persistBlocks }
			settings={ settings }
		>
			<Sidebar.InspectorFill>
				<BlockInspector />
			</Sidebar.InspectorFill>
			<BlockCanvas height="400px" />
		</BlockEditorProvider>
	</div>
);
```

The key components are `<BlockEditorProvider>` and `<BlockList>`. Let's examine these.

### Understanding the `<BlockEditorProvider>` component

[`<BlockEditorProvider>`](https://github.com/WordPress/gutenberg/tree/e38dbe958c04d8089695eb686d4f5caff2707505/packages/block-editor/src/components/provider) is one of the most important components in the hierarchy. It establishes a new block editing context for a new block editor.

As a result, it is _fundamental_ to the entire goal of this project.

The children of `<BlockEditorProvider>` comprise the UI for the block editor. These components then have access to data (via `Context`), enabling them to _render_ and _manage_ the blocks and their behaviors within the editor.

```jsx
// File: src/components/block-editor/index.js

<BlockEditorProvider
	value={ blocks }           // Array of block objects
	onInput={ updateBlocks }   // Handler to manage Block updates
	onChange={ persistBlocks } // Handler to manage Block updates/persistence
	settings={ settings }      // Editor "settings" object
/>
```

#### `BlockEditor` props

You can see that `<BlockEditorProvider>` accepts an array of (parsed) block objects as its `value` prop and, when there's a change detected within the editor, calls the `onChange` and/or `onInput` handler prop (passing the new Blocks as an argument).

Internally it does this by subscribing to the provided `registry` (via the [`withRegistryProvider` HOC](https://github.com/WordPress/gutenberg/blob/e38dbe958c04d8089695eb686d4f5caff2707505/packages/block-editor/src/components/provider/index.js#L158)), listening to block change events, determining whether the block changing was persistent, and then calling the appropriate `onChange|Input` handler accordingly.

For the purposes of this simple project, these features allow you to:

-   Store the array of current blocks in state as `blocks`.
-   Update the `blocks` state in memory on `onInput` by calling the hook setter
    `updateBlocks(blocks)`.
-   Handle basic persistence of blocks into `localStorage` using `onChange`. This is [fired when block updates are considered "committed"](https://github.com/WordPress/gutenberg/tree/HEAD/packages/block-editor/src/components/provider#onchange).

It's also worth recalling that the component accepts a `settings` property. This is where you will add the editor settings inlined earlier as JSON within `init.php`. You can use these settings to configure features such as custom colors, available image sizes, and [much more](https://github.com/WordPress/gutenberg/tree/4c472c3443513d070a50ba1e96f3a476861447b3/packages/block-editor#SETTINGS_DEFAULTS).

### Understanding the `<BlockList>` component

Alongside `<BlockEditorProvider>` the next most interesting component is [`<BlockList>`](https://github.com/WordPress/gutenberg/blob/e38dbe958c04d8089695eb686d4f5caff2707505/packages/block-editor/src/components/block-list/index.js).

This is one of the most important components as it's role is to **render a list of blocks into the editor**.

It does this in part thanks to being placed as a child of `<BlockEditorProvider>`, which affords it full access to all information about the state of the current blocks in the editor.

#### How does `BlockList` work?

Under the hood, `<BlockList>` relies on several other lower-level components in order to render the list of blocks.

The hierarchy of these components can be _approximated_ as follows:

```jsx
// Pseudo code for example purposes only.

<BlockList>
	/* renders a list of blocks from the rootClientId. */
	<BlockListBlock>
		/* renders a single block from the BlockList. */
		<BlockEdit>
			/* renders the standard editable area of a block. */
			<Component /> /* renders the block UI as defined by its `edit()` implementation.
			*/
		</BlockEdit>
	</BlockListBlock>
</BlockList>
```

Here is roughly how this works together to render the list of blocks:

-   `<BlockList>` loops over all the block `clientIds` and
    renders each via [`<BlockListBlock />`](https://github.com/WordPress/gutenberg/blob/e38dbe958c04d8089695eb686d4f5caff2707505/packages/block-editor/src/components/block-list/block.js).
-   `<BlockListBlock />`, in turn, renders the individual block
    using its own subcomponent [`<BlockEdit>`](https://github.com/WordPress/gutenberg/blob/def076809d25e2ad680beda8b9205ab9dea45a0f/packages/block-editor/src/components/block-edit/index.js).
-   Finally, the [block itself](https://github.com/WordPress/gutenberg/blob/def076809d25e2ad680beda8b9205ab9dea45a0f/packages/block-editor/src/components/block-edit/edit.js) is rendered using the `Component` placeholder component.

The `@wordpress/block-editor` package components are among the most complex and involved. Understanding them is crucial if you want to grasp how the editor functions at a fundamental level. Studying these components is strongly advised.

## Reviewing the sidebar

Also within the render of the `<BlockEditor>`, is the `<Sidebar>` component.

```jsx
// File: src/components/block-editor/index.js

return (
    <div className="getdavesbe-block-editor">
        <BlockEditorProvider>
            <Sidebar.InspectorFill> /* <-- SIDEBAR */
                <BlockInspector />
            </Sidebar.InspectorFill>
            <BlockCanvas height="400px" />
        </BlockEditorProvider>
    </div>
);
```

This is used, in part, to display advanced block settings via the `<BlockInspector>` component.

```jsx
<Sidebar.InspectorFill>
	<BlockInspector />
</Sidebar.InspectorFill>
```

However, the keen-eyed readers amongst you will have already noted the presence of a `<Sidebar>` component within the `<Editor>` (`src/editor.js`) component's
layout:

```jsx
// File: src/editor.js
<Notices />
<Header />
<Sidebar /> // <-- What's this?
<BlockEditor settings={ settings } />

```

Opening the `src/components/sidebar/index.js` file, you can see that this is, in fact, the component rendered within `<Editor>` above. However, the implementation utilises
Slot/Fill to expose a `Fill` (`<Sidebar.InspectorFill>`), which is subsequently imported and rendered inside of the `<BlockEditor>` component (see above).

With this in place, you then can render `<BlockInspector />` as a child of the `Sidebar.InspectorFill`. This has the result of allowing you to keep `<BlockInspector>` within the React context of `<BlockEditorProvider>` whilst allowing it to be rendered into the DOM in a separate location (i.e. in the `<Sidebar>`).

This might seem overly complex, but it is required in order for `<BlockInspector>` to have access to information about the current block. Without Slot/Fill, this setup would be extremely difficult to achieve.

And with that you have covered the render of you custom `<BlockEditor>`.

<div class="callout callout-tip">
<a href="https://github.com/WordPress/gutenberg/blob/def076809d25e2ad680beda8b9205ab9dea45a0f/packages/block-editor/src/components/block-inspector/index.js"><code>&lt;BlockInspector&gt;</code></a>
itself actually renders a <code>Slot</code> for <a href="https://github.com/WordPress/gutenberg/tree/HEAD/packages/block-editor/src/components/inspector-controls"><code>&lt;InspectorControls&gt;</code></a>. This is what allows you <a href="https://github.com/WordPress/gutenberg/blob/def076809d25e2ad680beda8b9205ab9dea45a0f/packages/block-library/src/paragraph/edit.js#L127">render</a> a <code>&lt;InspectorControls>&gt;</code> component inside
the <code>edit()</code> definition for your block and have
it display within the editor's sidebar. Exploring this component in more detail is recommended.
</div>

## Block Persistence

You have come a long way on your journey to create a custom block editor. But there is one major area left to touch upon - block persistence. In other words, having your
blocks saved and available _between_ page refreshes.

![alt text](https://developer.wordpress.org/files/2023/07/custom-block-editor-persistance.gif 'Screencapture showing blocks being restored between page refreshes.')

As this is only an _experiment_, this guide has opted to utilize the browser's `localStorage` API to handle saving block data. In a real-world scenario, you would likely choose a more reliable and robust system (e.g. a database).

That said, let's take a closer look at how to handle save blocks.

### Storing blocks in state

Looking at the `src/components/block-editor/index.js` file, you will notice that some state has been created to store the blocks as an array:

```jsx
// File: src/components/block-editor/index.js

const [ blocks, updateBlocks ] = useState( [] );
```

As mentioned earlier, `blocks` is passed to the "controlled" component `<BlockEditorProvider>` as its `value` prop. This "hydrates" it with an initial set of blocks. Similarly, the `updateBlocks` setter is hooked up to the `onInput` callback on `<BlockEditorProvider>`, which ensures that the block state is kept in sync with changes made to blocks within the editor.

### Saving block data

If you now turn your attention to the `onChange` handler, you will notice it is hooked up to a function `persistBlocks()` which is defined as follows:

```js
// File: src/components/block-editor/index.js

function persistBlocks( newBlocks ) {
	updateBlocks( newBlocks );
	window.localStorage.setItem( 'getdavesbeBlocks', serialize( newBlocks ) );
}
```

This function accepts an array of "committed" block changes and calls the state setter `updateBlocks`. It also stores the blocks within LocalStorage under the key `getdavesbeBlocks`. In order to achieve this, the block data is serialized into [Gutenberg "Block Grammar"](https://developer.wordpress.org/block-editor/principles/key-concepts/#blocks) format, meaning it can be safely stored as a string.

If you open DeveloperTools and inspect the LocalStorage you will see serialized block data stored and updated as changes occur within the editor. Below is an example of the format:

```
<!-- wp:heading -->
<h2>An experiment with a standalone Block Editor in the WordPress admin</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>This is an experiment to discover how easy (or otherwise) it is to create a standalone instance of the Block Editor in the WordPress admin.</p>
<!-- /wp:paragraph -->
```

### Retrieving previous block data

Having persistence in place is all well and good, but it's only useful if that data is retrieved and _restored_ within the editor upon each full page reload.

Accessing data is a side effect, so you must use the `useEffect` hook to handle this.

```jsx
// File: src/components/block-editor/index.js

useEffect( () => {
	const storedBlocks = window.localStorage.getItem( 'getdavesbeBlocks' );

	if ( storedBlocks && storedBlocks.length ) {
		updateBlocks( () => parse( storedBlocks ) );
		createInfoNotice( 'Blocks loaded', {
			type: 'snackbar',
			isDismissible: true,
		} );
	}
}, [] );
```

This handler:

-   Grabs the serialized block data from local storage.
-   Converts the serialized blocks back to JavaScript objects using the `parse()` utility.
-   Calls the state setter `updateBlocks` causing the `blocks` value to be updated in state to reflect the blocks retrieved from LocalStorage.

As a result of these operations, the controlled `<BlockEditorProvider>` component is updated with the blocks restored from LocalStorage, causing the editor to show these blocks.

Finally, you will want to generate a notice - which will display in the `<Notice>` component as a "snackbar" notice - to indicate that the blocks have been restored.

## Wrapping up

Congratulations for completing this guide. You should now have a better understanding of how the block editor works under the hood. 

The full code for the custom block editor you have just built is [available on GitHub](https://github.com/getdave/standalone-block-editor). Download and try it out for yourself. Experiment, then and take things even further.
