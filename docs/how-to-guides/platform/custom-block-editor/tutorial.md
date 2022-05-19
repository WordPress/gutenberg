# Tutorial: building a custom block editor

This tutorial will step through the fundamentals of creating a custom instance
of a "block editor" using the `@wordpress/block-editor` package.

## Table of Contents

-   [Introduction](#introduction).
-   [What we're going to be building](#what-were-going-to-be-building).
-   [Plugin setup and organization](#plugin-setup-and-organization).
-   [The "Core" of the Editor](#the-core-of-the-editor).
-   [Creating the custom "Block Editor" page in WP Admin](#creating-the-custom-block-editor-page-in-wp-admin).
-   [Registering and Rendering our custom block editor](#registering-and-rendering-our-custom-block-editor).
-   [Reviewing the `<Editor>` component](#reviewing-the-editor-component).
-   [The custom `<BlockEditor>`](#the-custom-blockeditor).
-   [Reviewing the Sidebar](#reviewing-the-sidebar).
-   [Block Persistence](#block-persistence).
-   [Wrapping up](#wrapping-up).

## Introduction

The Gutenberg codebase is complex, with many packages and components, but at its core it is a tool for managing and editing blocks. Therefore, when working on the editor it is important to gain a better understanding of how block editing works at a _fundamental_ level.

To do this, this tutorial will walk you through building a **fully functioning, _custom_ block editor "instance"** within WordPress, introducing you to the key packages and components along the way.

By the end of this article, you should have gained a good understanding of how the block editor works and some of the knowledge required to put together your own block editor instances.

## What we're going to be building

We're going to be creating an (almost) fully functioning Block Editor instance.

![The Standalone Editor instance populated with example Blocks within a custom WP Admin page](https://wordpress.org/gutenberg/files/2020/03/editor.png)

This block editor will not be the same _Block Editor_ you are familiar with when creating `Post`s in WP Admin. Rather it will be an entirely custom instance which will live within a custom WP Admin page called (imaginatively) "Block Editor".

Our editor will have the following features:

-   Ability to add and edit all Core Blocks.
-   Familiar visual styles and main/sidebar layout.
-   _Basic_ block persistence between page reloads.

With that in mind, let's start taking our first steps towards building this.

## Plugin setup and organization

Our custom editor is going to be built as a WordPress Plugin. To keep things simple. we'll call this `Standalone Block Editor Demo` because that is what it does. Nice!

Let's take a look at our Plugin file structure:

![alt text](https://wordpress.org/gutenberg/files/2020/03/repo-files.png 'Screenshot showing file structure of the Plugin at https://github.com/getdave/standalone-block-editor.')

Here's a brief summary of what's going on:

-   `plugin.php` - standard Plugin "entry" file with comment meta data. Requires `init.php`.
-   `init.php` - handles the initialization of the main Plugin logic. We'll be spending a lot of time here.
-   `src/` (directory) - this is where our JavaScript (and CSS) source files will live. These files are _not_ directly enqueued by the Plugin.
-   `webpack.config.js` - a custom Webpack config extending the defaults provided by the `@wordpress/scripts` npm package to allow for custom CSS styles (via Sass).

The only item not shown above is the `build/` directory, which is where our _compiled_ JS and CSS files will be outputted by `@wordpress/scripts` ready to be enqueued by our Plugin.

**Note:** throughout this tutorial, filename references will be placed in a comment at the top of each code snippet so you can follow along.

With our basic file structure in place, we can now start looking at what package we're going to need.

## The "Core" of the Editor

Whilst the Gutenberg Editor is comprised of many moving parts, at it's core is the `@wordpress/block-editor` package.

It's role is perhaps best summarized by its own `README` file:

> This module allows you to create and use standalone block editors.

This is great and exactly what we need! Indeed, it is the main package we'll be using to create our custom block editor instance.

However, before we can get to working with this package in code, we're going to need to create a home for our editor within WP Admin.

## Creating the custom "Block Editor" page in WP Admin

As a first step, we need to create a custom page within WP Admin.

**Note**: if you're already comfortable with the process of creating custom Admin pages in WordPress you might want to [skip ahead](#registering-and-rendering-our-custom-block-editor).

### Registering the Page

To do this we [register our custom admin page](https://developer.wordpress.org/reference/functions/add_menu_page/) using the standard WP `add_menu_page()` helper:

```php
// init.php

add_menu_page(
    'Standalone Block Editor', // visible page name
    'Block Editor', // menu label
    'edit_posts', // required capability
    'getdavesbe', // hook/slug of page
    'getdave_sbe_render_block_editor', // function to render the page
    'dashicons-welcome-widgets-menus' // custom icon
);
```

Note the reference to a function `getdave_sbe_render_block_editor` which is the function which we will use to render the contents of the admin page.

### Adding the target HTML

As the block editor is a React powered application, we now need to output some HTML into our custom page into which the JavaScript can render the block editor.

To do this we need to look at our `getdave_sbe_render_block_editor` function referenced in the step above.

```php
// init.php

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

Here we simply output some basic placeholder HTML.

Note that we've included an `id` attribute `getdave-sbe-block-editor`. Keep a note of that, a we'll be using it shortly.

### Enqueuing JavaScript and CSS

With our target HTML in place we can now enqueue some JavaScript (as well as some CSS styles) so that they will run on our custom Admin page.

To do this we hook into `admin_enqueue_scripts`.

First, we need to make sure we only run our custom code on our own admin page, so at the top of our callback function let's exit early if the page doesn't match our page's identifier:

```php
// init.php

function getdave_sbe_block_editor_init( $hook ) {

    // Exit if not the correct page
	if ( 'toplevel_page_getdavesbe' !== $hook ) {
		return;
    }
}

add_action( 'admin_enqueue_scripts', 'getdave_sbe_block_editor_init' );
```

With this in place, we can then safely register our main JavaScript file using the standard WP `wp_enqueue_script` function:

```php
// init.php

wp_enqueue_script( $script_handle, $script_url, $script_asset['dependencies'], $script_asset['version'] );
```

To save time and space, the assignment of the `$script_` variables has been omitted. You can [review these here](https://github.com/getdave/standalone-block-editor/blob/974a59dcbc539a0595e8fa34670e75ec541853ab/init.php#L19).

Note that we register our script dependencies (`$script_asset['dependencies']`) as the 3rd argument - these deps are being
dynamically generated using [@wordpress/dependency-extraction-webpack-plugin](https://developer.wordpress.org/block-editor/packages/packages-dependency-extraction-webpack-plugin/) which will
[ensure that WordPress provided scripts are not included in the built
bundle](https://developer.wordpress.org/block-editor/packages/packages-scripts/#default-webpack-config).

We also need to register both our custom CSS styles and the WordPress default formatting library in order take advantage of some nice default styling:

```php
// init.php

// Editor default styles
wp_enqueue_style( 'wp-format-library' );

// Custom styles
wp_enqueue_style(
    'getdave-sbe-styles', // Handle.
    plugins_url( 'build/index.css', __FILE__ ), // Block editor CSS.
    array( 'wp-edit-blocks' ), // Dependency to include the CSS after it.
    filemtime( __DIR__ . '/build/index.css' )
);
```

### Inlining the editor settings

Looking at the `@wordpress/block-editor` package, we can see that it [accepts a settings object to configure the default settings for the editor](https://github.com/WordPress/gutenberg/tree/4c472c3443513d070a50ba1e96f3a476861447b3/packages/block-editor#SETTINGS_DEFAULTS). These are available on the server side so we need to expose them for use within the JavaScript.

To do this we [inline the settings object as JSON](https://github.com/getdave/standalone-block-editor/blob/974a59dcbc539a0595e8fa34670e75ec541853ab/init.php#L48) assigned to the global `window.getdaveSbeSettings` object:

```php
// init.php

// Inline the Editor Settings
$settings = getdave_sbe_get_block_editor_settings();
wp_add_inline_script( $script_handle, 'window.getdaveSbeSettings = ' . wp_json_encode( $settings ) . ';' );
```

## Registering and Rendering our custom block editor

With the PHP above in place to create our admin page, we’re now finally ready to use JavaScript to render a Block Editor into the page’s HTML.

Let's open up our main `src/index.js` file.

Here we first pull in required JS packages and import our CSS styles (note using Sass requires [extending the default `@wordpress/scripts` Webpack config](https://github.com/getdave/standalone-block-editor/blob/974a59dcbc539a0595e8fa34670e75ec541853ab/webpack.config.js#L13)).

```js
// src/index.js

import domReady from '@wordpress/dom-ready';
import { render } from '@wordpress/element';
import { registerCoreBlocks } from '@wordpress/block-library';
import Editor from './editor';

import './styles.scss';
```

Next, once the DOM is ready we run a function which:

-   Grabs our editor settings from `window.getdaveSbeSettings` (inlined from PHP -
    see above).
-   Registers all the Core Gutenberg Blocks using `registerCoreBlocks`.
-   Renders an `<Editor>` component into the waiting `<div>` on our custom Admin page.

```jsx
domReady( function () {
	const settings = window.getdaveSbeSettings || {};
	registerCoreBlocks();
	render(
		<Editor settings={ settings } />,
		document.getElementById( 'getdave-sbe-block-editor' )
	);
} );
```

**Note**: it is possible to render the editor from PHP without creating an unnecessary JS global. Check out [the Edit Site package in Gutenberg Core for an example of this](https://href.li/?https://github.com/WordPress/gutenberg/blob/c6821d7e64a54eb322583a35daedc6c192ece850/lib/edit-site-page.php#L135).

## Reviewing the `<Editor>` component

Let's take a closer look at the `<Editor>` component we saw being used above.

Despite its name, this _is not_ the actual core of the block editor. Rather it is a _wrapper_ component we've created to contain the components which form the main body of our custom editor.

### Dependencies

The first thing we do inside `<Editor>` is to pull in some dependencies.

```jsx
// src/editor.js

import Notices from 'components/notices';
import Header from 'components/header';
import Sidebar from 'components/sidebar';
import BlockEditor from 'components/block-editor';
```

The most important of these are the internal components `BlockEditor` and `Sidebar`, which we will explore in greater detail shortly.

The remaining components are largely static elements which form the layout and surrounding UI of the editor (eg: header and notice areas).

### Editor Render

With these components available we can proceed to define our `<Editor>` component.

```jsx
// src/editor.js

function Editor( { settings } ) {
	return (
		<SlotFillProvider>
			<DropZoneProvider>
				<div className="getdavesbe-block-editor-layout">
					<Notices />
					<Header />
					<Sidebar />
					<BlockEditor settings={ settings } />
				</div>
				<Popover.Slot />
			</DropZoneProvider>
		</SlotFillProvider>
	);
}
```

Here we are scaffolding the core of the editor's layout alongside a few specialised [context providers](https://reactjs.org/docs/context.html#contextprovider) which make particular functionality available throughout the component hierarchy.

Let's examine these in more detail:

-   `<SlotFillProvider>` - enables the use of the ["Slot/Fill"
    pattern](/docs/reference-guides/slotfills/README.md) through our component tree.
-   `<DropZoneProvider>` - enables the use of [dropzones for drag and drop functionality](https://github.com/WordPress/gutenberg/tree/e38dbe958c04d8089695eb686d4f5caff2707505/packages/components/src/drop-zone).
-   `<Notices>` - custom component. Provides a "snack bar" Notice that will be rendered if any messages are dispatched to `core/notices` store.
-   `<Header>` - renders the static title "Standalone Block Editor" at the top of the
    editor UI.
-   `<BlockEditor>` - our custom block editor component. This is where things get
    interesting. We'll focus a little more on this in a moment.
-   `<Popover.Slot />` - renders a slot into which `<Popover>`s can be rendered
    using the Slot/Fill mechanic.

### Keyboard Navigation

With this basic component structure in place the only remaining thing left to do
is wrap everything in [the `navigateRegions` HOC](https://github.com/WordPress/gutenberg/tree/e38dbe958c04d8089695eb686d4f5caff2707505/packages/components/src/higher-order/navigate-regions) to provide keyboard navigation between the different "regions" in the layout.

```jsx
// src/editor.js

export default navigateRegions( Editor );
```

## The custom `<BlockEditor>`

Now we have a our core layouts and components in place, it's time to explore our
custom implementation of the block editor itself.

The component for this is called `<BlockEditor>` and this is where the magic happens.

Opening `src/components/block-editor/index.js` we see that this is the most
complex of the components we have encountered thus far.

There's a lot going on so let's break this down!

### Understanding the render

To start, let's focus on what is being rendered by the `<BlockEditor>` component:

```js
// src/components/block-editor/index.js

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
			<div className="editor-styles-wrapper">
				<BlockEditorKeyboardShortcuts />
				<WritingFlow>
					<ObserveTyping>
						<BlockList className="getdavesbe-block-editor__block-list" />
					</ObserveTyping>
				</WritingFlow>
			</div>
		</BlockEditorProvider>
	</div>
);
```

The key components to focus on here are `<BlockEditorProvider>` and `<BlockList>`. Let's examine these.

### Understanding the `<BlockEditorProvider>` component

[`<BlockEditorProvider>`](https://github.com/WordPress/gutenberg/tree/e38dbe958c04d8089695eb686d4f5caff2707505/packages/block-editor/src/components/provider) is one of the most important components in the hierarchy. As we learnt earlier, it establishes a new block editing context for a new block editor.

As a result, it is _fundamental_ to the entire goal of our project.

The children of `<BlockEditorProvider>` comprise the UI for the block
editor. These components then have access to data (via `Context`) which enables
them to _render_ and _manage_ the Blocks and their behaviors within the editor.

```jsx
// src/components/block-editor/index.js

<BlockEditorProvider
	value={ blocks } // array of block objects
	onInput={ updateBlocks } // handler to manage Block updates
	onChange={ persistBlocks } // handler to manage Block updates/persistence
	settings={ settings } // editor "settings" object
/>
```

#### `BlockEditor` props

We can see that `<BlockEditorProvider>` accepts array of (parsed) block objects as its `value` prop and, when there's a change detected within the editor, calls the `onChange` and/or `onInput` handler prop (passing the new Blocks as a argument).

Internally it does this by subscribing to the provided `registry` (via the [`withRegistryProvider` HOC](https://github.com/WordPress/gutenberg/blob/e38dbe958c04d8089695eb686d4f5caff2707505/packages/block-editor/src/components/provider/index.js#L158)), listening to block change events, determining whether Block changing was persistent, and then calling the appropriate `onChange|Input` handler accordingly.

For the purposes of our simple project these features allow us to:

-   Store the array of current blocks in state as `blocks`.
-   Update the `blocks` state in memory on `onInput` by calling the hook setter
    `updateBlocks(blocks)`.
-   Handle basic persistence of blocks into `localStorage` using `onChange`. This is [fired when block updates are considered
    "committed"](https://github.com/WordPress/gutenberg/tree/HEAD/packages/block-editor/src/components/provider#onchange).

It's also worth recalling that the component accepts a `settings` prop. This accepts the editor settings which we inlined as JSON within `init.php` earlier. This configures features such as custom colors, available image sizes and [much more](https://github.com/WordPress/gutenberg/tree/4c472c3443513d070a50ba1e96f3a476861447b3/packages/block-editor#SETTINGS_DEFAULTS).

### Understanding the `<BlockList>` component

Alongside `<BlockEditorProvider>` the next most interesting component is [`<BlockList>`](https://github.com/WordPress/gutenberg/blob/e38dbe958c04d8089695eb686d4f5caff2707505/packages/block-editor/src/components/block-list/index.js).

This is one of the most important components as it's role is to **render a list of Blocks into the editor**.

It does this in part thanks to being placed as a child of `<BlockEditorProvider>` which affords it full access to all information about the state of the current Blocks in the editor.

#### How does `BlockList` work?

Under the hood `<BlockList>` relies on several other lower-level components in order to render the list of Blocks.

The hierarchy of these components can be _approximated_ as follows:

```jsx
// Pseudo code - example purposes only

<BlockList>
	/* renders a list of Blocks from the rootClientId. */
	<BlockListBlock>
		/* renders a single "Block" from the BlockList. */
		<BlockEdit>
			/* renders the standard editable area of a Block. */
			<Component /> /* renders the Block UI as defined by its `edit()` implementation.
			*/
		</BlockEdit>
	</BlockListBlock>
</BlockList>
```

Here's roughly how this works together to render our list of blocks:

-   `<BlockList>` loops over all the Block clientIds and
    renders each via [`<BlockListBlock />`](https://github.com/WordPress/gutenberg/blob/e38dbe958c04d8089695eb686d4f5caff2707505/packages/block-editor/src/components/block-list/block.js).
-   `<BlockListBlock />` in turn renders the individual "Block"
    via it's own subcomponent [`<BlockEdit>`](https://github.com/WordPress/gutenberg/blob/def076809d25e2ad680beda8b9205ab9dea45a0f/packages/block-editor/src/components/block-edit/index.js).
-   Finally [the Block itself](https://github.com/WordPress/gutenberg/blob/def076809d25e2ad680beda8b9205ab9dea45a0f/packages/block-editor/src/components/block-edit/edit.js) is rendered using the `Component` placeholder component.

These are some of the most complex and involved components within the `@wordpress/block-editor` package. That said, if you want to have a strong grasp of how the editor works at a fundamental level, I strongly advise making a study of these components. I leave this as an exercise for the reader!

### Utility components in our custom block editor

Jumping back to our own custom `<BlockEditor>` component, it is also worth noting the following "utility" components:

```js
// src/components/block-editor/index.js

<div className="editor-styles-wrapper">
	<BlockEditorKeyboardShortcuts /> /* 1. */
	<WritingFlow>
		/* 2. */
		<ObserveTyping>
			/* 3. */
			<BlockList className="getdavesbe-block-editor__block-list" />
		</ObserveTyping>
	</WritingFlow>
</div>
```

These provide other important elements of functionality for our editor instance.

1. [`<BlockEditorKeyboardShortcuts />`](https://github.com/WordPress/gutenberg/blob/e38dbe958c04d8089695eb686d4f5caff2707505/packages/block-editor/src/components/keyboard-shortcuts/index.js) - enables and usage of keyboard shortcuts within the editor.
2. [`<WritingFlow>`](https://github.com/WordPress/gutenberg/blob/e38dbe958c04d8089695eb686d4f5caff2707505/packages/block-editor/src/components/writing-flow/index.js) - handles selection, focus management and navigation across blocks.
3. [`<ObserveTyping>`](https://github.com/WordPress/gutenberg/tree/e38dbe958c04d8089695eb686d4f5caff2707505/packages/block-editor/src/components/observe-typing)- used to manage the editor's internal `isTyping` flag. This is used in various places, most commonly to show/hide the Block toolbar in response to typing.

## Reviewing the Sidebar

Also within the render of our `<BlockEditor>`, is our `<Sidebar>` component.

```jsx
// src/components/block-editor/index.js

return (
    <div className="getdavesbe-block-editor">
        <BlockEditorProvider>
            <Sidebar.InspectorFill> /* <-- SIDEBAR */
                <BlockInspector />
            </Sidebar.InspectorFill>
            <div className="editor-styles-wrapper">
                // snip
            </div>
        </BlockEditorProvider>
    </div>
);
```

This is used - alongside other things - to display advanced Block settings via the `<BlockInspector>` component.

```jsx
<Sidebar.InspectorFill>
	<BlockInspector />
</Sidebar.InspectorFill>
```

However, the keen-eyed readers amongst you will have already noted the presence
of a `<Sidebar>` component within our `<Editor>` (`src/editor.js`) component's
layout:

```jsx
// src/editor.js
<Notices />
<Header />
<Sidebar /> // <-- eh!?
<BlockEditor settings={ settings } />

```

Opening `src/components/sidebar/index.js` we see that this is in fact the
component rendered within `<Editor>` above. However, the implementation utilises
Slot/Fill to expose a `Fill` (`<Sidebar.InspectorFill>`) which we subsequently
`import` and render inside of our `<BlockEditor>` component (see above).

With this in place, we then render `<BlockInspector />` as a child of the
`Sidebar.InspectorFill`. This has the result of allowing us to keep
`<BlockInspector>` within the React context of `<BlockEditorProvider>` whilst
allowing it to be rendered into the DOM in a separate location (ie: in the `<Sidebar>`).

This might seem overly complex, but it is required in order that
`<BlockInspector>` can have access to information about the current Block.
Without Slot/Fill this setup would be extremely difficult to achieve.

Aside:
[`<BlockInspector>`](https://github.com/WordPress/gutenberg/blob/def076809d25e2ad680beda8b9205ab9dea45a0f/packages/block-editor/src/components/block-inspector/index.js)
itself actually renders a `Slot` for [`<InspectorControls>`](https://github.com/WordPress/gutenberg/tree/HEAD/packages/block-editor/src/components/inspector-controls). This is what allows you [render a `<InspectorControls>` component inside
the `edit()` definition for your block](https://github.com/WordPress/gutenberg/blob/def076809d25e2ad680beda8b9205ab9dea45a0f/packages/block-library/src/paragraph/edit.js#L127) and have
it display within Gutenberg's sidebar. I recommend looking into this component
in more detail.

And with that we have covered the render of our custom `<BlockEditor>`!

## Block Persistence

We've come a long way on our journey to create a custom block editor. But there is
one major area left to touch upon - Block persistance; that is the act of having our
Blocks saved and **available _between_ page refreshes**.

![alt text](https://wordpress.org/gutenberg/files/2020/03/block-persistance.gif 'Screencapture showing added Blocks being restored between page refreshes.')

As this is only an _experiment_ we've opted to utilise the browser's
`localStorage` API to handle saving Block data. In a real-world scenario however
you'd like choose a more reliable and robust system (eg: a database).

That said, let's take a closer look at how we're handling saving our Blocks.

### Storing blocks in state

Opening `src/components/block-editor/index.js` we will notice we have created
some state to store our Blocks as an array:

```jsx
// src/components/block-editor/index.js

const [ blocks, updateBlocks ] = useState( [] );
```

As mentioned earlier, `blocks` is passed to the "controlled" component `<BlockEditorProvider>` as its `value` prop. This "hydrates" it with an initial set of Blocks. Similarly, the `updateBlocks` setter is hooked up to the `onInput` callback on `<BlockEditorProvider>` which ensures that our block state is kept in sync with changes made to blocks within the editor.

### Saving Block data

If we now turn our attention to the `onChange` handler, we will notice it is
hooked up to a function `persistBlocks()` which is defined as follows:

```js
// src/components/block-editor/index.js

function persistBlocks( newBlocks ) {
	updateBlocks( newBlocks );
	window.localStorage.setItem( 'getdavesbeBlocks', serialize( newBlocks ) );
}
```

This function accepts an array of "committed" block changes and calls the state
setter `updateBlocks`. In addition to this however, it also stores the blocks
within LocalStorage under the key `getdavesbeBlocks`. In order to achieve this
the Block data is serialized into [Gutenberg "Block Grammar"](https://developer.wordpress.org/block-editor/principles/key-concepts/#blocks) format, meaning it can be safely stored as a string.

If we open DeveloperTools and inspect our LocalStorage we will see serialized
Block data stored and updated as changes occur within the editor. Below is an
example of the format:

```
<!-- wp:heading -->
<h2>An experiment with a standalone Block Editor in WPAdmin</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>This is an experiment to discover how easy (or otherwise) it is to create a standalone instance of the Block Editor in WPAdmin.</p>
<!-- /wp:paragraph -->
```

### Retrieving previous block data

Having persistence in place is all well and good, but it's useless unless that
data is retrieved and _restored_ within the editor upon each full page reload.

Accessing data is a side effect, so naturally we reach for our old (new!?)
friend the `useEffect` hook to handle this.

```jsx
// src/components/block-editor/index.js

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

In this handler, we:

-   Grab the serialized block data from local storage.
-   Convert the serialized blocks back to JavaScript objects using the `parse()`
    utility.
-   Call the state setter `updateBlocks` causing the `blocks` value to be updated
    in state to reflect the blocks retrieved from LocalStorage.

As a result of these operations the controlled `<BlockEditorProvider>` component
is updated with the blocks restored from LocalStorage causing the editor to
show these blocks.

Finally, for good measure we generate a notice - which will display in our `<Notice>` component as a "snackbar" notice - to indicate that the blocks have been restored.

## Wrapping up

If you've made it this far then congratulations! I hope you now have a better understanding of how the block editor works under the hood.

In addition, you've reviewed an working example of the code required to implement your own custom functioning block editor. This information should prove useful, especially as Gutenberg expands beyond editing just the `Post` and into Widgets, Full Site Editing and beyond!

The full code for the custom functioning block editor we've just built is [available on GitHub](https://github.com/getdave/standalone-block-editor). I encourage you to download and try it out for yourself. Experiment, then and take things even further!
