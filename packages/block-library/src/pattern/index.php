<?php
/**
 * Server-side rendering of the `core/pattern` block.
 *
 * @package WordPress
 */

/**
 *  Registers the `core/pattern` block on the server.
 *
 * @since 5.9.0
 */
function register_block_core_pattern() {
	register_block_type_from_metadata(
		__DIR__ . '/pattern',
		array(
			'render_callback' => 'render_block_core_pattern',
		)
	);
}

/**
 * Returns the customization of a registered pattern: the published `wp_block`
 * post carrying the pattern name in its `wp_pattern_slug` meta.
 *
 * @since 23.9.0
 *
 * @param string $pattern_name Registered pattern name.
 * @return WP_Post|null The customization, or null when there is none.
 */
function block_core_pattern_get_customization( $pattern_name ) {
	$posts = get_posts(
		array(
			'post_type'      => 'wp_block',
			'post_status'    => 'publish',
			'posts_per_page' => 1,
			'meta_key'       => 'wp_pattern_slug',
			'meta_value'     => $pattern_name,
			'no_found_rows'  => true,
		)
	);

	return $posts ? $posts[0] : null;
}

/**
 * Renders the `core/pattern` block on the server.
 *
 * @since 6.3.0 Backwards compatibility: blocks with no `syncStatus` attribute do not receive block wrapper.
 * @since 23.9.0 Renders the pattern's customization when it has one.
 *
 * @global WP_Embed $wp_embed Used to process embedded content within patterns
 *
 * @param array $attributes Block attributes.
 *
 * @return string Returns the output of the pattern.
 */
function render_block_core_pattern( $attributes ) {
	static $seen_refs = array();

	$slug = $attributes['slug'] ?? null;
	if ( empty( $slug ) || ! is_string( $slug ) ) {
		return '';
	}

	$registry = WP_Block_Patterns_Registry::get_instance();

	if ( ! $registry->is_registered( $slug ) ) {
		return '';
	}

	if ( isset( $seen_refs[ $slug ] ) ) {
		// WP_DEBUG_DISPLAY must only be honored when WP_DEBUG. This precedent
		// is set in `wp_debug_mode()`.
		$is_debug = WP_DEBUG && WP_DEBUG_DISPLAY;

		return $is_debug ?
			// translators: Visible only in the front end, this warning takes the place of a faulty block. %s represents a pattern's slug.
			sprintf( __( '[block rendering halted for pattern "%s"]' ), $slug ) :
			'';
	}

	$pattern = $registry->get_registered( $slug );
	$content = $pattern['content'];

	// A registered pattern edited on this site renders its customization.
	$customization = block_core_pattern_get_customization( $slug );
	if ( $customization ) {
		$content = $customization->post_content;
	}

	$seen_refs[ $slug ] = true;

	$content = do_blocks( $content );

	global $wp_embed;
	$content = $wp_embed->autoembed( $content );

	unset( $seen_refs[ $slug ] );
	return $content;
}

add_action( 'init', 'register_block_core_pattern' );
