# Connect the input component to the meta field

We're now in the last step of our journey. We have to do a few things to connect the input control to the meta block field:

1. Tell WordPress that our plugin will use a field from the `post_meta`.
2. Initialize the input control with the block field value.
3. Update the block field value when the input control changes.

## Register the meta field

To work with fields in the _post_meta_ table, WordPress has a function called [register_meta](https://developer.wordpress.org/reference/functions/register_meta/). We're going to use it to register a new field called `sidebar_plugin_meta_block_field`. We configure this field to be available through the [REST API](https://developer.wordpress.org/rest-api/) because that's how the block editor access data, to be a single field (meaning that it contains a value, not an array of values), and to be of type _string_. We need to add this to our PHP code, within the _init_ callback function.

```php
register_meta( 'post', 'sidebar_plugin_meta_block_field', array(
	'show_in_rest' => true,
	'single' => true,
	'type' => 'string',
) );
```

To make sure the field has been loaded, we can query the block editor [data structures](https://wordpress.org/gutenberg/handbook/designers-developers/developers/data/). Open your browser's console, and execute:

```js
wp.data.select( 'core/editor' ).getCurrentPost().meta;
```

Before adding the `register_meta` function to our plugin, this returns a void array, because we haven't told WordPress to load any meta field yet. After registering the field, the same code will return an object containing the registered meta field and their values. In our case, it will contain `sidebar_plugin_meta_block_field`.

## Initialize the input control

Now that the field is available in the block editor data structures, we can surface it to the UI. The first thing we're going to do is to extract our input control to a function so we can expand its functionality and our code stays clear.

```js
( function( wp ) {
	var el = wp.element.createElement;
	var Text = wp.components.TextControl;

	var MetaBlockField = function() {
		return el( Text, {
			label: 'Meta Block Field',
			value: 'Initial value',
			onChange: function( content ) {
				console.log( 'content changed to ', content );
			},
		});
	}

	wp.plugins.registerPlugin( 'my-plugin-sidebar', {
		render: function(){
			return wp.editPost.PluginSidebar( {
				name: 'my-plugin-sidebar',
				icon: 'admin-post',
				title: 'My plugin sidebar',
				children: el(
					'div',
					{ className: 'sidebar-plugin-content' },
					el( MetaBlockField )
				),
			} );
		}
	} );
} )( window.wp );
```

Now we can focus solely on the `MetaBlockField` component. Our goal is to initialize it with the value of `sidebar_plugin_meta_block_field`, but also to keep it updated when that value changes. WordPress has [some utilities to work with data](https://wordpress.org/gutenberg/handbook/designers-developers/developers/packages/packages-data/) from the internal structures. The first we're going to use is [`withSelect`](https://wordpress.org/gutenberg/handbook/designers-developers/developers/packages/packages-data/#withselect-mapselecttoprops-function-function), which is a component designed to wrap other components and pass them some data. Its signature is:

```js
withSelect( /* function that returns some data */ )( /* function that takes the previous data as input and returns an UI component */ );
```

Besides helping us to query data, `withSelect` will also update the components it wraps (the second function call) when the original data changes (the first function call). Let's use it in an example:

```js
( function( wp ) {
	var el = wp.element.createElement;
	var Text = wp.components.TextControl;
	var withSelect = wp.data.withSelect;

	// Function that takes `select` as input and returns some data.
	var selectToData = function( select ) {
		return {
			metaFieldValue: select( 'core/editor' ).getEditedPostAttribute( 'meta' )[ 'sidebar_plugin_meta_block_field' ]
		}
	}

	// Our previous component,
	// a function that takes the data object and outputs the component UI.
	var MetaBlockField = function( props ) {
		return el( Text, {
			label: 'Meta Block Field',
			value: props.metaFieldValue,
			onChange: ( content ) => {
				console.log( 'content has changed to ', content );
			},
		} );
	}

	var MetaBlockFieldWithData = withSelect( selectToData )( MetaBlockField );

	wp.plugins.registerPlugin( 'my-plugin-sidebar', {
		render: function(){
			return wp.editPost.PluginSidebar( {
				name: 'my-plugin-sidebar',
				icon: 'admin-post',
				title: 'My plugin sidebar',
				children: el(
					'div',
					{ className: 'sidebar-plugin-content' },
					el( MetaBlockFieldWithData )
				),
			} );
		}
	} );
} )( window.wp );
```

Notice the changes it the original code:

* The `MetaBlockField` has now a `props` argument as input. It contains the object data returned by `selectToData` function, which it uses to initialize its value property.
* We've also updated the component we render within the `div` element. We now use `MetaBlockFieldWithData`, the component returned by `withSelect` which will be updated every time the original data changes.
* We've imported the `wp.data.withSelect` utility, so we have to declare our script depends on the `wp-data` package in our PHP script.
* We use the [`getEditedPostAttribute`](https://wordpress.org/gutenberg/handbook/designers-developers/developers/data/data-core-editor/#geteditedpostattribute) function to retrieve data instead of [`getCurrentPost`](https://wordpress.org/gutenberg/handbook/designers-developers/developers/data/data-core-editor/#getcurrentpost), which returns the most recent values of the post, including user editions that haven't been yet saved.

If we now open the sidebar, we'll see that the input's value is no longer `Initial value`, but a void string.

Let's check that our component is updated every time the value changes. Open the browser's console, execute

```js
wp.data.dispatch( 'core/editor' ).editPost( { meta: { sidebar_plugin_meta_block_field: 'hello world!' } } );
```

and observe how the contents of the input change!

## Update the meta field when the input content changes

The last step in our journey is to update the meta field when the input content changes. To do that, we'll use another utility from the `@wordpress/data` package, [`withDispatch`](https://wordpress.org/gutenberg/handbook/designers-developers/developers/packages/packages-data/#withdispatch-mapdispatchtoprops-function-function).

`withDispatch` works like `withSelect`. Let's see how to use it:

```js
( function( wp ) {
	var el = wp.element.createElement;
	var Text = wp.components.TextControl;
	var withSelect = wp.data.withSelect;
	var withDispatch = wp.data.withDispatch;

	// Function that takes `select` as input and returns some data.
	var selectToData = function( select ) {
		return {
			metaFieldValue: select(
				'core/editor'
			).getEditedPostAttribute( 'meta' )[ 'sidebar_plugin_meta_block_field' ],
		}
	}

	// Function that takes `dispatch` as input and returns an object with functions.
	// We call these functions _actions_, and they'll update the internal data 
	// structures when executed.
	var dispatchToActions = function( dispatch ) {
		return {
			setMetaFieldValue: function( value ) {
				dispatch( 'core/editor' ).editPost( { meta: { sidebar_plugin_meta_block_field: value } } );
			}
		}
	}

	// Our original UI component.
	// The action functions will now be also available through the `props` argument.
	var MetaBlockField = function( props ) {
		return el( Text, {
			label: 'Meta Block Field',
			value: props.metaFieldValue,
			onChange: ( content ) => {
				props.setMetaFieldValue( content );
			},
		} );
	}

	var MetaBlockFieldWithData = withSelect( selectToData )( MetaBlockField );
	var MetaBlockFieldWithDataAndActions = withDispatch( dispatchToActions )( MetaBlockFieldWithData );

	wp.plugins.registerPlugin( 'my-plugin-sidebar', {
		render: function(){
			return wp.editPost.PluginSidebar( {
				name: 'my-plugin-sidebar',
				icon: 'admin-post',
				title: 'My plugin sidebar',
				children: el(
					'div',
					{ className: 'sidebar-plugin-content' },
					el( MetaBlockFieldWithDataAndActions )
				),
			} );
		}
	} );
} )( window.wp );
```

With this code, we can now load our sidebar and see how the input value gets updated as we type. Check that the internal data structures are updated after some changes by executing the following code in your browser's console:

```js
wp.data.select( 'core/editor' ).getEditedPostAttribute( 'meta' )[ 'sidebar_plugin_meta_block_field' ];
```

After doing some changes, hit the "Save draft" button (or publish the post). Check that the changes are now stored properly in the current post data by doing:

```js
wp.data.select( 'core/editor' ).getCurrentPost()[ 'meta' ][ 'sidebar_plugin_meta_block_field' ];
```

That's it! We now have a custom sidebar to update `post_meta` content.
