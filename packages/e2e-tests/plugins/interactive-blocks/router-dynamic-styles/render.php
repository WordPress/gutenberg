<?php
/**
 * Test block render template for test/router-dynamic-styles.
 *
 * Provides deterministic style-scenario fixtures for two router bugs:
 *
 * Bug A — runtime-activated deferred stylesheets:
 *   A <style id="test-router-deferred-style" media="not all"> element is
 *   output server-side on every page request via wp_head (see below).
 *   This mirrors the real WordPress pattern of wp_enqueue_style() with
 *   media="not all". view.js finds it by id and the activateDeferredStyle
 *   action sets element.media = "all".
 *
 *   Because the element is server-rendered it also appears in the fetched
 *   page HTML during SPA navigation. normalizeMedia() maps "not all" → "all"
 *   so the SCS algorithm matches the live activated element (media="all")
 *   against the server-returned element (media="not all"), keeps it in
 *   page.styles, and applyStyles() leaves it enabled.
 *
 *   No external CSS file is required — the declaration is inlined.
 *
 * Bug B — dynamically-injected plugin stylesheets:
 *   view.js init() appends a <style> element without an id attribute,
 *   simulating plugins like Complianz GDPR that bypass wp_enqueue_style().
 *   The router must never disable it across any navigation path.
 *
 * Navigation links nav-to-b and nav-to-c resolve sibling posts by title so
 * the spec's addPostWithBlock( …, { alias } ) pattern works out of the box.
 *
 * @package gutenberg-test-interactive-blocks
 */

// Prevent function redeclaration if the render file is included multiple times.
if ( ! function_exists( 'gutenberg_test_router_deferred_style' ) ) {
	/**
	 * Prints the inline deferred-style fixture for the router-dynamic-styles
	 * test block. Hooked to wp_head at priority 20.
	 *
	 * The element intentionally carries no src/href so the test never relies
	 * on resolving an external file. The id attribute is stable so view.js can
	 * retrieve it with getElementById().
	 */
	function gutenberg_test_router_deferred_style() {
		// Remove ourselves so subsequent pages in the same PHP process
		// (e.g. REST-rendered block previews) do not duplicate the tag.
		remove_action( 'wp_head', 'gutenberg_test_router_deferred_style', 20 );
		echo '<style id="test-router-deferred-style" media="not all">body { --test-deferred-active: 1; }</style>' . "\n";
	}
}

// Output the deferred-style fixture into <head> exactly once per page.
if ( ! has_action( 'wp_head', 'gutenberg_test_router_deferred_style' ) ) {
	add_action( 'wp_head', 'gutenberg_test_router_deferred_style', 20 );
}

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
