# Initialize the input control

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
