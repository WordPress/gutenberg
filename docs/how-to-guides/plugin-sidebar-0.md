# Plugin Sidebar

## Overview

How to add a sidebar to your plugin. A sidebar is the region to the far right of the editor. Your plugin can add an additional icon next to the InspectorControls (gear icon) that can be expanded.

![Example sidebar](https://raw.githubusercontent.com/WordPress/gutenberg/HEAD/docs/assets/sidebar-up-and-running.png)

_Note: this tutorial covers a custom sidebar, if you are looking to add controls to the sidebar see the [Block Toolbar and Settings Sidebar](/docs/getting-started/fundamentals/block-in-the-editor.md)_

## Before you start

The tutorial assumes you have an existing plugin setup and are ready to add PHP and JavaScript code. Please, refer to [Getting started with JavaScript](/docs/how-to-guides/javascript/README.md) tutorial for an introduction to WordPress plugins and how to use JavaScript to extend the block editor.

## Step-by-step guide

### Step 1: Get a sidebar up and running

The first step is to tell the editor that there is a new plugin that will have its own sidebar. Use the [registerPlugin](/packages/plugins/README.md), [PluginSidebar](/packages/edit-post/README.md#pluginsidebar), and [createElement](/packages/element/README.md) utilities provided by the `@wordpress/plugins`, `@wordpress/edit-post`, and `react` packages, respectively.

Add the following code to a JavaScript file called `plugin-sidebar.js` and save it within your plugin's directory:

```js
( function ( wp, React ) {
	var el = React.createElement;
	var registerPlugin = wp.plugins.registerPlugin;
	var PluginSidebar = wp.editPost.PluginSidebar;

	registerPlugin( 'my-plugin-sidebar', {
		render: function () {
			return el(
				PluginSidebar,
				{
					name: 'my-plugin-sidebar',
					icon: 'admin-post',
					title: 'My plugin sidebar',
				},
				'Meta field'
			);
		},
	} );
} )( window.wp, window.React );
```

For this code to work, those utilities need to be available in the browser, so you must specify `wp-plugins`, `wp-edit-post`, and `react` as dependencies of your script.

Here is the PHP code to register your script and specify the dependencies:

```php
<?php

/*
Plugin Name: Sidebar plugin
*/

function sidebar_plugin_register() {
	wp_register_script(
		'plugin-sidebar-js',
		plugins_url( 'plugin-sidebar.js', __FILE__ ),
		array( 'wp-plugins', 'wp-edit-post', 'react' )
	);
}
add_action( 'init', 'sidebar_plugin_register' );

function sidebar_plugin_script_enqueue() {
	wp_enqueue_script( 'plugin-sidebar-js' );
}
add_action( 'enqueue_block_editor_assets', 'sidebar_plugin_script_enqueue' );
```

After installing and activating this plugin, there is a new icon resembling a tack in the top-right of the editor. Upon clicking it, the plugin's sidebar will be opened:

![Sidebar Up and Running](https://raw.githubusercontent.com/WordPress/gutenberg/HEAD/docs/assets/sidebar-up-and-running.png)

### Step 2: Tweak the sidebar style and add controls

After the sidebar is up and running, the next step is to fill it up with the necessary components and basic styling.

To visualize and edit the meta field value you'll use an input component. The `@wordpress/components` package contains many components available for you to reuse, and, specifically, the [TextControl](/packages/components/src/text-control/README.md) is aimed at creating an input field:

```js
( function ( wp ) {
	var el = React.createElement;
	var registerPlugin = wp.plugins.registerPlugin;
	var PluginSidebar = wp.editPost.PluginSidebar;
	var TextControl = wp.components.TextControl;

	registerPlugin( 'my-plugin-sidebar', {
		render: function () {
			return el(
				PluginSidebar,
				{
					name: 'my-plugin-sidebar',
					icon: 'admin-post',
					title: 'My plugin sidebar',
				},
				el(
					'div',
					{ className: 'plugin-sidebar-content' },
					el( TextControl, {
						label: 'Meta Block Field',
						value: 'Initial value',
						onChange: function ( content ) {
							console.log( 'content changed to ', content );
						},
					} )
				)
			);
		},
	} );
} )( window.wp );
```

Update the `plugin-sidebar.js` with this new code. Notice that it uses a new utility called `wp.components` from the `@wordpress/components` package. Be sure to add `wp-components` to the dependencies in the `wp_register_script` function in the PHP file.

The code introduces:

-   a CSS class `plugin-sidebar-content` to the `div` element to target styles,
-   a `TextControl` component instead of the plain `'Meta field'` text.

With the new CSS class available you can add a little style. Create a new file in your plugin directory called `plugin-sidebar.css` with the following to give some padding:

```css
.plugin-sidebar-content {
	padding: 16px;
}
```

Register the script and enqueue it to load with `enqueue_block_editor_assets` alongside the JavaScript file.

After those changes, the PHP code will look like this:

```php
<?php

/*
Plugin Name: Sidebar example
*/

function sidebar_plugin_register() {
	wp_register_script(
		'plugin-sidebar-js',
		plugins_url( 'plugin-sidebar.js', __FILE__ ),
		array(
			'react',
			'wp-plugins',
			'wp-edit-post',
			'wp-components'
		)
	);
	wp_register_style(
		'plugin-sidebar-css',
		plugins_url( 'plugin-sidebar.css', __FILE__ )
	);
}
add_action( 'init', 'sidebar_plugin_register' );

function sidebar_plugin_script_enqueue() {
	wp_enqueue_script( 'plugin-sidebar-js' );
	wp_enqueue_style( 'plugin-sidebar-css' );
}
add_action( 'enqueue_block_editor_assets', 'sidebar_plugin_script_enqueue' );
```

Reload the editor and open the sidebar:

![Sidebar with style and controls](https://raw.githubusercontent.com/WordPress/gutenberg/HEAD/docs/assets/sidebar-style-and-controls.png)

This code doesn't let users store or retrieve data just yet, so the next steps will focus on how to connect it to the meta block field.

### Step 3: Register the meta field

To work with fields in the `post_meta` table, use the [register_post_meta](https://developer.wordpress.org/reference/functions/register_post_meta/). function to create a new field called `sidebar_plugin_meta_block_field`.

Note: this field needs to be available to the REST API because that's how the block editor access data.

Add the PHP code in your plugins `init` callback function:

```php
register_post_meta( 'post', 'sidebar_plugin_meta_block_field', array(
	'show_in_rest' => true,
	'single' => true,
	'type' => 'string',
) );
```

To confirm, query the block editor store to see the field is loaded. After implementing, reload the editor page and open your browser's developer console. Use this JavaScript snippet in the console to confirm:

```js
wp.data.select( 'core/editor' ).getCurrentPost().meta;
```

The function will return an object containing the registered meta field you registered.

If the code returns `undefined` make sure your post type supports `custom-fields`. Either when [registering the post](https://developer.wordpress.org/reference/functions/register_post_type/#supports) or with [add_post_type_support function](https://developer.wordpress.org/reference/functions/add_post_type_support/).

### Step 4: Initialize the input control

With the field available in the editor store, it can now be surfaced to the UI. We extract the input control to a function to keep the code clean as we add functionality.

```js
( function ( wp ) {
	var el = React.createElement;
	var registerPlugin = wp.plugins.registerPlugin;
	var PluginSidebar = wp.editPost.PluginSidebar;
	var TextControl = wp.components.TextControl;

	var MetaBlockField = function () {
		return el( TextControl, {
			label: 'Meta Block Field',
			value: 'Initial value',
			onChange: function ( content ) {
				console.log( 'content changed to ', content );
			},
		} );
	};

	registerPlugin( 'my-plugin-sidebar', {
		render: function () {
			return el(
				PluginSidebar,
				{
					name: 'my-plugin-sidebar',
					icon: 'admin-post',
					title: 'My plugin sidebar',
				},
				el(
					'div',
					{ className: 'plugin-sidebar-content' },
					el( MetaBlockField )
				)
			);
		},
	} );
} )( window.wp );
```

We want to initialize the value in the `MetaBlockField` component with the value of `sidebar_plugin_meta_block_field`, and keep it updated when that value changes.

The `useSelect` function is used to fetch data when the component loads and will update if the data changes. Here is the code update with `useSelect`:

```js
( function ( wp ) {
	var el = React.createElement;
	var registerPlugin = wp.plugins.registerPlugin;
	var PluginSidebar = wp.editPost.PluginSidebar;
	var Text = wp.components.TextControl;
	var useSelect = wp.data.useSelect;

	var MetaBlockField = function () {
		var metaFieldValue = useSelect( function ( select ) {
			return select( 'core/editor' ).getEditedPostAttribute(
				'meta'
			)[ 'sidebar_plugin_meta_block_field' ];
		}, [] );

		return el( Text, {
			label: 'Meta Block Field',
			value: metaFieldValue,
			onChange: function ( content ) {
				console.log( 'content has changed to ', content );
			},
		} );
	};

	registerPlugin( 'my-plugin-sidebar', {
		render: function () {
			return el(
				PluginSidebar,
				{
					name: 'my-plugin-sidebar',
					icon: 'admin-post',
					title: 'My plugin sidebar',
				},
				el(
					'div',
					{ className: 'plugin-sidebar-content' },
					el( MetaBlockField )
				)
			);
		},
	} );
} )( window.wp );
```

The `wp.data.useSelect` function is from the `@wordpress/data` package, so `wp-data` needs to be added as a dependency in the `wp_register_script` function in PHP.

Note: The `getEditedPostAttribute` call is used to retrieve the most recent values of the post, including user editions that haven't been yet saved.

Confirm it's working by updating the code, reloading, and opening the sidebar. The input's content is no longer `Initial value` but a void string. Users can't type values yet, but you can check that the component is updated if the value in the store changes. Open the browser's console, execute

```js
wp.data
	.dispatch( 'core/editor' )
	.editPost( { meta: { sidebar_plugin_meta_block_field: 'hello world!' } } );
```

You can observe the content changing in the input component.

### Step 5: Update the meta field when the input's content changes

The last step is to update the meta field when the input content changes.
The `useDispatch` function takes a store name as its only argument and returns methods that you can use to update the store, in this case we'll use `editPost`

```js
( function ( wp ) {
	var el = React.createElement;
	var registerPlugin = wp.plugins.registerPlugin;
	var PluginSidebar = wp.editPost.PluginSidebar;
	var TextControl = wp.components.TextControl;
	var useSelect = wp.data.useSelect;
	var useDispatch = wp.data.useDispatch;

	var MetaBlockField = function ( props ) {
		var metaFieldValue = useSelect( function ( select ) {
			return select( 'core/editor' ).getEditedPostAttribute(
				'meta'
			)[ 'sidebar_plugin_meta_block_field' ];
		}, [] );

		var editPost = useDispatch( 'core/editor' ).editPost;

		return el( TextControl, {
			label: 'Meta Block Field',
			value: metaFieldValue,
			onChange: function ( content ) {
				editPost( {
					meta: { sidebar_plugin_meta_block_field: content },
				} );
			},
		} );
	};

	registerPlugin( 'my-plugin-sidebar', {
		render: function () {
			return el(
				PluginSidebar,
				{
					name: 'my-plugin-sidebar',
					icon: 'admin-post',
					title: 'My plugin sidebar',
				},
				el(
					'div',
					{ className: 'plugin-sidebar-content' },
					el( MetaBlockField )
				)
			);
		},
	} );
} )( window.wp );
```

After the update, when the user types, the input control calls `editPost` and updates the editor store on each keystroke.

Update the JavaScript, load the sidebar, and type in the input field. You can confirm it is saved by typing something in the input control and executing the JavaScript snippet in your browser's development console:

```js
wp.data.select( 'core/editor' ).getEditedPostAttribute( 'meta' )[
	'sidebar_plugin_meta_block_field'
];
```

The message displayed should be what you typed in the input.

When saving a post, you can confirm it is stored properly in the database by reloading after a save and confirming the input control is initialized with the last value you typed.

## Additional resources

Documentation for working with the [@wordpress/data package](/packages/data/README.md).

Functions used in this guide:

-   [useSelect](/packages/data/README.md#useselect).
-   [getEditedPostAttribute](/docs/reference-guides/data/data-core-editor.md#geteditedpostattribute)
-   [useDispatch](/packages/data/README.md#usedispatch)

## Conclusion

You now have a custom sidebar that you can use to update `post_meta` content.

A complete example is available, download the [plugin-sidebar example](https://github.com/WordPress/block-development-examples/tree/trunk/plugins/plugin-sidebar-9ee4a6) from the [block-development-examples](https://github.com/WordPress/block-development-examples) repository.

### Note

If you have enabled Custom Fields in the 'Panels' page of the Editor 'Preferences' (via the three dots in top right), a field with the same name as the TextControl, in this case `sidebar_plugin_meta_block_field`, will also appear in the custom fields panel at the bottom of the editor window. These two fields have access to the same meta property.

![Text Control and Custom Field](https://raw.githubusercontent.com/WordPress/gutenberg/HEAD/docs/assets/plugin-sidebar-text-control-custom-field.png)

On saving the post the value in the TextControl will be saved first and the value in the custom field will be saved second, so that is the one that ends up persisting in the database. So if you change the value in the TextControl it is still the one in the custom field that ends up getting saved.

This problem does not exist if Custom Fields is not enabled.

If you need to have Custom Fields enabled and also have post meta in the sidebar there are two possible solutions:

1. Precede the name of the meta field with an underscore, so the name in the above example would be `_sidebar_plugin_meta_block_field`. This indicates that the post meta should be treated as private so it will not be visible in the Custom Fields section of a post. With this solution an error will be generated when you save the post unless you add an `auth_callback` property to the `args` array passed to `register_post_meta` with a function that ultimately returns `true`.  See the `args` documentation in the [post_meta](https://developer.wordpress.org/reference/functions/register_meta/#parameters) page for more info.
2. In the TextControl's `onChange` function, target the Value field textarea and set the value there to be the same as the value in the TextControl meta field. The value will then be identical in both places and so you can be assured that if the value is changed in the TextControl then it will still be saved to the database.

```js
return el( TextControl, {
  label: 'Meta Block Field',
  value: metaFieldValue,
  onChange: function ( content ) {
    editPost( {
      meta: { sidebar_plugin_meta_block_field: content }
    })
    document.querySelector( {the-value-textarea} ).innerHTML = content;
  },
} );
```
