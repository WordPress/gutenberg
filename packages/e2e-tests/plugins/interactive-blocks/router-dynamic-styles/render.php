<?php
/**
 * Test block render template for test/router-dynamic-styles.
 *
 * Provides deterministic style-scenario fixtures for two router bugs:
 *
 * Bug A — runtime-activated deferred stylesheets:
 *   A <style id="test-router-deferred-style" media="not all"> element is
 *   output server-side on every page request.
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
 *   view.js init() appends a <style> element with a stable id attribute,
 *   simulating plugins like Complianz GDPR that bypass wp_enqueue_style().
 *   The router must never disable it across any navigation path.
 *
 * Navigation links use data-wp-on--click="actions.navigate" to trigger
 * iAPI router SPA navigation. Without this directive the plain <a> clicks
 * would cause full page reloads, resetting all state and making the test
 * unable to verify that styles survive navigation.
 *
 * Navigation links nav-to-a, nav-to-b and nav-to-c resolve sibling posts by title so
 * the spec's addPostWithBlock( …, { alias } ) pattern works out of the box.
 *
 * @package gutenberg-test-interactive-blocks
 */

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

$link_a = $find_url( $base_alias . '-a' );
$link_b = $find_url( $base_alias . '-b' );
$link_c = $find_url( $base_alias . '-c' );
?>

<!-- Bug A fixture: deferred style outside router region, survives navigation. -->
<style id="test-router-deferred-style" media="not all">body { --test-deferred-active: 1; }</style>

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
			data-testid="nav-to-a"
			href="<?php echo esc_url( $link_a ); ?>"
			data-wp-on--click="actions.navigate"
		>Page A</a>
		<a
			data-testid="nav-to-b"
			href="<?php echo esc_url( $link_b ); ?>"
			data-wp-on--click="actions.navigate"
		>Page B</a>
		<a
			data-testid="nav-to-c"
			href="<?php echo esc_url( $link_c ); ?>"
			data-wp-on--click="actions.navigate"
		>Page C</a>
	</nav>
	<div data-wp-init="callbacks.init"></div>
</div>
