<?php
/**
 * Test block render template for test/router-dynamic-styles.
 *
 * Provides deterministic style-scenario fixtures for two bugs:
 *
 * Bug A — runtime-activated deferred stylesheets (media="not all" → "all"):
 *   Enqueues a stylesheet with media="not all". The view script exposes an
 *   action that mutates link.media to "all", simulating an iAPI theme-switcher.
 *   After navigation the deferred-style-active indicator must remain "active".
 *
 * Bug B — dynamically-injected plugin stylesheets (no id, via appendChild):
 *   The view script injects a <style> element without an id attribute,
 *   simulating Complianz GDPR and similar plugins that bypass wp_enqueue_style().
 *   The plugin-style-active indicator must remain "active" across all navigations.
 *
 * Navigation links nav-to-b and nav-to-c resolve sibling posts by title so
 * the spec's addPostWithBlock( …, { alias } ) pattern works out of the box.
 */

// Enqueue the deferred stylesheet with media="not all".
// WordPress generates the id "test-router-dynamic-styles-deferred-css" from
// the handle, which the view script uses to locate and activate the element.
wp_enqueue_style(
	'test-router-dynamic-styles-deferred',
	plugins_url( 'deferred-style.css', __FILE__ ),
	array(),
	null,
	'not all'
);

// Resolve sibling post URLs by alias (post title set by addPostWithBlock).
$current_title = (string) get_the_title();
// Strip the trailing variant suffix (-a, -b, -c …) to get the base alias.
$base_alias = (string) preg_replace( '/-[a-z]$/', '', $current_title );

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
