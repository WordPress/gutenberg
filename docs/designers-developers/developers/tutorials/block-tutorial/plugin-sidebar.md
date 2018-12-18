# Creating a sidebar for your plugin

## Step 1: sidebar up and running

```php
<?php

/*
Plugin Name: Sidebar plugin
*/

function sidebar_plugin_script_register() {
	wp_register_script(
		'sidebar-plugin-js',
		plugins_url( 'sidebar-plugin.js', __FILE__ ),
		array( 'wp-plugins', 'wp-edit-post', 'wp-element' )
	);
	wp_register_style(
		'sidebar-plugin-css',
		plugins_url( 'sidebar-plugin.css', __FILE__ )
	);

}
add_action( 'init', 'sidebar_plugin_script_register' );

function sidebar_plugin_script_enqueue() {
	wp_enqueue_script( 'sidebar-plugin-js' );
}
add_action( 'enqueue_block_editor_assets', 'sidebar_plugin_script_enqueue' );

function sidebar_plugin_style_enqueue() {
	wp_enqueue_style( 'sidebar-plugin-css' );
}
add_action( 'enqueue_block_assets', 'sidebar_plugin_style_enqueue' );
```

```js
( function( wp ) {
	var el = wp.element.createElement;
	wp.plugins.registerPlugin( 'my-plugin-sidebar', {
		render: function(){
			return wp.editPost.PluginSidebar( {
				icon: 'admin-post',
				name: 'my-plugin-sidebar',
				title: 'My plugin sidebar',
				children: el(
					'div',
					{ className: 'sidebar-plugin-content' },
					'Meta field',
				),
			} );
		},
	} );
} )( window.wp );
```

```css
.sidebar-plugin-content {
	padding: 16px;
}
```

## Step 2: add a input control

```php
<?php

/*
Plugin Name: Sidebar example
*/

function sidebar_plugin_script_register() {
	wp_register_script(
		'sidebar-plugin-js',
		plugins_url( 'sidebar-plugin.js', __FILE__ ),
		array( 'wp-plugins', 'wp-edit-post', 'wp-element', 'wp-components' )
	);
	wp_register_style(
		'sidebar-plugin-css',
		plugins_url( 'sidebar-plugin.css', __FILE__ )
	);

}
add_action( 'init', 'sidebar_plugin_script_register' );

function sidebar_plugin_script_enqueue() {
	wp_enqueue_script( 'sidebar-plugin-js' );
}
add_action( 'enqueue_block_editor_assets', 'sidebar_plugin_script_enqueue' );

function sidebar_plugin_style_enqueue() {
	wp_enqueue_style( 'sidebar-plugin-css' );
}
add_action( 'enqueue_block_assets', 'sidebar_plugin_style_enqueue' );
```

```js
( function( wp ) {
	var el = wp.element.createElement;
	var Text = wp.components.TextControl;

	wp.plugins.registerPlugin( 'my-plugin-sidebar', {
		render: function(){
			return wp.editPost.PluginSidebar( {
				icon: 'admin-post',
				name: 'my-plugin-sidebar',
				title: 'My plugin sidebar',
				children: el(
					'div',
					{ className: 'sidebar-plugin-content' },
					el( Text, {
						label: 'Meta Block Field',
						value: 'initial value',
						onChange: function( content ) {
							console.log( 'changed to ', content );
						},
					} )
				),
			} );
		}
	} );
} )( window.wp );
```

## Step 3: an input that updates its content

```js
( function( wp ) {
	var el = wp.element.createElement;
	var Component = wp.element.Component;
	var Text = wp.components.TextControl;

	class MetaBlockField extends Component {
		constructor() {
			super( ...arguments );
			this.state = {
				value: '',
			}
		}

		render() {
			return el( Text, {
				label: 'Meta Block Field',
				value: this.state.value,
				onChange: ( content ) => {
					this.setState( { value: content } );
				},
			} );
		}
	}

	wp.plugins.registerPlugin( 'my-plugin-sidebar', {
		render: function(){
			return wp.editPost.PluginSidebar( {
				icon: 'admin-post',
				name: 'my-plugin-sidebar',
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

## Step 4: connect to post meta

```php
<?php

/*
Plugin Name: Sidebar example
*/

function sidebar_plugin_register() {
	register_meta( 'post', 'sidebar_plugin_meta_block_field', array(
		'show_in_rest' => true,
		'single' => true,
		'type' => 'string',
	) );
	wp_register_script(
		'sidebar-plugin-js',
		plugins_url( 'sidebar-plugin.js', __FILE__ ),
		array( 'wp-plugins', 'wp-edit-post', 'wp-element', 'wp-components', 'wp-data' )
	);
	wp_register_style(
		'sidebar-plugin-css',
		plugins_url( 'sidebar-plugin.css', __FILE__ )
	);
}
add_action( 'init', 'sidebar_plugin_register' );

function sidebar_plugin_script_enqueue() {
	wp_enqueue_script( 'sidebar-plugin-js' );
}
add_action( 'enqueue_block_editor_assets', 'sidebar_plugin_script_enqueue' );

function sidebar_plugin_style_enqueue() {
	wp_enqueue_style( 'sidebar-plugin-css' );
}
add_action( 'enqueue_block_assets', 'sidebar_plugin_style_enqueue' );
```

```js
( function( wp ) {
	var el = wp.element.createElement;
	var Component = wp.element.Component;
	var Text = wp.components.TextControl;
	var setMeta = function( fieldName, fieldValue ) {
		wp.data.dispatch( 'core/editor' ).editPost( { meta: { [ fieldName ] : fieldValue } } );
	}
	var getMeta = function( fieldName ) {
		return wp.data.select( 'core/editor' ).getEditedPostAttribute( 'meta' )[ fieldName ];
	}

	class MetaBlockField extends Component {
		constructor() {
			super( ...arguments );
			this.state = {
				value: getMeta( 'sidebar_plugin_meta_block_field' ) || '',
			}
		}

		render() {
			return el( Text, {
				label: 'Meta Block Field',
				value: this.state.value,
				onChange: ( content ) => {
					this.setState( { value: content } );
					setMeta( 'sidebar_plugin_meta_block_field', content );
				},
			} );
		}
	}

	wp.plugins.registerPlugin( 'my-plugin-sidebar', {
		render: function(){
			return wp.editPost.PluginSidebar( {
				icon: 'admin-post',
				name: 'my-plugin-sidebar',
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