<?php
/**
 * Test block render template for test/router-dynamic-styles.
 *
 * Provides deterministic style-scenario fixtures for two bugs:
 *
 * Bug A — runtime-activated deferred stylesheets (media="not all" → "all"):
 *   Enqueues a stylesheet with media="not all" via wp_enqueue_scripts so the
 *   <link> tag appears in <head>. The view script exposes an action that
 *   mutates link.media to "all", simulating an iAPI theme-switcher.
 *   After navigation the deferred-style-active indicator must remain "active".
 *
 * Bug B — dynamically-injected plugin stylesheets (no id, via appendChild):
 *   The view script injects a <style> element without an id attribute,
 *   simulating plugins like Complianz GDPR that bypass wp_enqueue_style().
 *   The plugin-style-active indicator must remain "active" across navigations.
 *
 * @package gutenberg-test-interactive-blocks
 */

// Enqueue the deferred stylesheet with media="not all" during wp_enqueue_scripts
// so the <link> tag is output inside <head>. Calling wp_enqueue_style() directly
// in a render template runs after wp_head() and the tag never appears in <head>.
// WordPress generates the id "test-router-dynamic-styles-deferred-css" from
// the handle, which the view script uses to locate and activate the element.
add_action(
	'wp_enqueue_scripts',
	function () {
		wp_enqueue_style(
			'test-router-dynamic-styles-deferred',
			plugin_dir_url( __FILE__ ) . 'deferred-style.css',
			array(),
			null,
			'not all'
		);
	}
);

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
