# Notices

Notices are informational UI displayed near the top of admin pages. WordPress core, themes, and plugins all use notices to indicate the result of an action, or to draw the user's attention to necessary information.

In the classic editor, notices hooked onto the `admin_notices` action can render whatever HTML they'd like. In the block editor, notices are restricted to a more formal API.

## Notices in the Classic Editor

In the classic editor, here's an example of the "Post draft updated" notice:

![Post draft updated in the classic editor](https://raw.githubusercontent.com/WordPress/gutenberg/HEAD/docs/how-to-guides/notices/classic-editor-notice.png)

Producing an equivalent "Post draft updated" notice would require code like this:

```php
/**
 * Hook into the 'admin_notices' action to render
 * a generic HTML notice.
 */
function myguten_admin_notice() {
	$screen = get_current_screen();
	// Only render this notice in the post editor.
	if ( ! $screen || 'post' !== $screen->base ) {
		return;
	}
	// Render the notice's HTML.
	// Each notice should be wrapped in a <div>
	// with a 'notice' class.
	echo '<div class="notice notice-success is-dismissible"><p>';
	echo sprintf( __( 'Post draft updated. <a href="%s" target="_blank">Preview post</a>' ), get_preview_post_link() );
	echo '</p></div>';
};
add_action( 'admin_notices', 'myguten_admin_notice' );
```

Importantly, the `admin_notices` hook allows a developer to render whatever HTML they'd like. One advantage is that the developer has a great amount of flexibility. The key disadvantage is that arbitrary HTML makes future iterations on notices more difficult, if not possible, because the iterations need to accommodate for arbitrary HTML. This is why the block editor has a formal API.

## Notices in the Block Editor

In the block editor, here's an example of the "Post published" notice:

![Post published in the block editor](https://raw.githubusercontent.com/WordPress/gutenberg/HEAD/docs/how-to-guides/notices/block-editor-notice.png)

Producing an equivalent "Post published" notice would require code like this:

```js
( function ( wp ) {
	wp.data.dispatch( 'core/notices' ).createNotice(
		'success', // Can be one of: success, info, warning, error.
		'Post published.', // Text string to display.
		{
			isDismissible: true, // Whether the user can dismiss the notice.
			// Any actions the user can perform.
			actions: [
				{
					url: '#',
					label: 'View post',
				},
			],
		}
	);
} )( window.wp );
```

You'll want to use this _Notices Data API_ when producing a notice from within the JavaScript application lifecycle.

To better understand the specific code example above:

-   `wp` is WordPress global window variable.
-   `wp.data` is an object provided by the block editor for accessing the block editor data store.
-   `wp.data.dispatch('core/notices')` accesses functionality registered to the block editor data store by the Notices package.
-   `createNotice()` is a function offered by the Notices package to register a new notice. The block editor reads from the notice data store in order to know which notices to display.

Check out the [_Loading JavaScript_](/docs/how-to-guides/javascript/loading-javascript.md) tutorial for a primer on how to load your custom JavaScript into the block editor.

## Learn More

The block editor offers a complete API for generating notices. The official documentation is a great place to review what's possible.

For a full list of the available actions and selectors, refer to the [Notices Data Handbook](/docs/reference-guides/data/data-core-notices.md) page.
