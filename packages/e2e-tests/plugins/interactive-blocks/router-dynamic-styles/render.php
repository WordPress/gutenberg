<?php
/**
 * Test block render template for test/router-dynamic-styles.
 *
 * Bug A — runtime-activated deferred stylesheets (media="not all" → "all"):
 *   Uses block.json viewStyle to enqueue deferred-style.css. WordPress
 *   registers the style early (handle: "test-router-dynamic-styles-style").
 *   wp_style_add_data() is called here to set media="not all" before the
 *   style is printed (viewStyle styles print in wp_footer when the block
 *   renders after wp_head). The view script activates the sheet by mutating
 *   link.media to "all".
 *
 * Bug B — dynamically-injected plugin stylesheets (no id, via appendChild):
 *   The view script injects a <style> element without an id attribute on
 *   every init(). The router must never disable it.
 *
 * @package gutenberg-test-interactive-blocks
 */

// Set media="not all" on the viewStyle-registered stylesheet so it loads
// without applying styles (deferred pattern). This must be called before the
// style is printed — viewStyle styles are output in wp_footer, so this call
// in the render callback is always early enough.
wp_style_add_data( 'test-router-dynamic-styles-style', 'media', 'not all' );

// Resolve sibling post URLs by alias (post title set by addPostWithBlock).
$current_title = (string) get_the_title();
$base_alias    = (string) preg_replace( '/-[a-z]$/', '', $current_title );

$find_url = static function ( string $alias ): string {
	$posts = get_posts(
		array(
			'post_type'      => 'post',
			'post_status'    => 'publish',
			'title'          => $alias,
			'posts_per_page' => 1,
			'no_found_rows'  => true,
			'fields'         => 'ids',
		)
	);
	return $posts ? (string) get_permalink( $posts[0] ) : '#';
};

$link_b = $find_url( $base_alias . '-b' );
$link_c = $find_url( $base_alias . '-c' );
?>
<div
	data-wp-interactive="test/router-dynamic-styles"
	data-wp-router-region="test-router-dynamic-styles"
	<?php echo get_block_wrapper_attributes(); ?>
>
	<p>
		Deferred style:
		<span
			data-testid="deferred-style-active"
			data-wp-text="state.deferredStyleStatus"
		>inactive</span>
	</p>
	<p>
		Plugin style:
		<span
			data-testid="plugin-style-active"
			data-wp-text="state.pluginStyleStatus"
		>inactive</span>
	</p>
	<button
		type="button"
		data-testid="activate-deferred-style"
		data-wp-on--click="actions.activateDeferredStyle"
	>
		Activate deferred style
	</button>
	<nav>
		<a
			data-testid="nav-to-b"
			href="<?php echo esc_url( $link_b ); ?>"
		>Page B</a>
		<a
			data-testid="nav-to-c"
			href="<?php echo esc_url( $link_c ); ?>"
		>Page C</a>
	</nav>
	<div data-wp-init="callbacks.init"></div>
</div>
