<?php
/**
 * Style Variations define reusable global styles that can be linked
 * to post types (posts, pages, templates, etc.).
 *
 * @package gutenberg
 */

/**
 * Meta key used to identify style variations (against main global styles).
 */
define( 'GUTENBERG_STYLE_VARIATION_META_KEY', '_wp_style_variation' );

/**
 * Meta key used on posts/templates to reference a connected style variation.
 * TODO: this could use a better name, like _wp_style_variation_id
 */
define( 'GUTENBERG_CONNECTED_STYLE_VARIATION_META_KEY', '_wp_connected_style_variation' );

/**
 * Register meta for style variations.
 */
function gutenberg_register_style_variation_meta() {
	// Meta to identify a wp_global_styles post as a style variation.
	register_post_meta(
		'wp_global_styles',
		GUTENBERG_STYLE_VARIATION_META_KEY,
		array(
			'show_in_rest'  => true,
			'single'        => true,
			'type'          => 'boolean',
			'default'       => false,
			'auth_callback' => function () {
				return current_user_can( 'edit_theme_options' );
			},
		)
	);

	// Meta to connect posts/pages/templates to a style variation.
	$post_types = array( 'post', 'page', 'wp_template', 'wp_template_part', 'wp_block' );
	foreach ( $post_types as $post_type ) {
		register_post_meta(
			$post_type,
			GUTENBERG_CONNECTED_STYLE_VARIATION_META_KEY,
			array(
				'show_in_rest'  => true,
				'single'        => true,
				'type'          => 'integer',
				'default'       => 0,
				'auth_callback' => function () {
					return current_user_can( 'edit_posts' );
				},
			)
		);
	}
}
add_action( 'init', 'gutenberg_register_style_variation_meta' );

/**
 * Get a style variation by ID.
 *
 * @param int $style_variation_id The style variation post ID.
 * @return array|null The style variation data or null if not found.
 */
function gutenberg_get_style_variation( $style_variation_id ) {
	$post = get_post( $style_variation_id );

	if ( ! $post || 'wp_global_styles' !== $post->post_type ) {
		return null;
	}

	// Verify it's a style variation.
	$is_style_variation = get_post_meta( $style_variation_id, GUTENBERG_STYLE_VARIATION_META_KEY, true );
	if ( ! $is_style_variation ) {
		return null;
	}

	return array(
		'id'      => $post->ID,
		'title'   => $post->post_title,
		'content' => json_decode( $post->post_content, true ),
	);
}

/**
 * Get the connected style variation ID for a post.
 *
 * @param int $post_id The post ID.
 * @return int The connected style variation ID, or 0 if none.
 */
function gutenberg_get_connected_style_variation_id( $post_id ) {
	return (int) get_post_meta( $post_id, GUTENBERG_CONNECTED_STYLE_VARIATION_META_KEY, true );
}

/**
 * Get a WP_Theme_JSON_Gutenberg object from a style variation's content.
 *
 * @param array $style_variation The style variation data.
 * @return WP_Theme_JSON_Gutenberg The theme JSON object.
 */
function gutenberg_get_style_variation_theme_json( $style_variation ) {
	$content = $style_variation['content'];

	// Ensure content is valid.
	if ( ! is_array( $content ) ) {
		$content = array();
	}

	// Remove the flag that marks it as user theme JSON.
	unset( $content['isGlobalStylesUserThemeJSON'] );

	return new WP_Theme_JSON_Gutenberg( $content, 'custom' );
}

/**
 * Add style variation data to the block editor settings.
 *
 * This provides the editor with information about connected style variations
 * so it can load the correct styles via the JavaScript side.
 *
 * @param array $settings The block editor settings.
 * @return array Modified settings.
 */
function gutenberg_add_style_variations_to_editor_settings( $settings ) {
	$post_id = 0;

	// Get the post ID from the editor context.
	if ( isset( $settings['postId'] ) ) {
		$post_id = $settings['postId'];
	}

	if ( ! $post_id ) {
		return $settings;
	}

	// Get the connected style variation for this post.
	$connected_style_variation_id = gutenberg_get_connected_style_variation_id( $post_id );

	$settings['connectedStyleVariationId'] = $connected_style_variation_id;

	return $settings;
}
add_filter( 'block_editor_settings_all', 'gutenberg_add_style_variations_to_editor_settings' );

/**
 * Enqueue style variation CSS on the frontend.
 *
 * This ensures connected style variations are properly applied on singular pages.
 */
function gutenberg_enqueue_style_variation_css() {
	// Only run on singular pages.
	if ( ! is_singular() ) {
		return;
	}

	$post_id = get_the_ID();
	if ( ! $post_id ) {
		return;
	}

	// Get the connected style variation.
	$style_variation_id = gutenberg_get_connected_style_variation_id( $post_id );
	if ( ! $style_variation_id ) {
		return;
	}

	$style_variation = gutenberg_get_style_variation( $style_variation_id );
	if ( ! $style_variation || empty( $style_variation['content'] ) ) {
		return;
	}

	// Generate CSS from the style variation.
	$style_variation_json = gutenberg_get_style_variation_theme_json( $style_variation );
	$css                  = $style_variation_json->get_stylesheet( array( 'styles', 'presets', 'variables' ) );

	if ( empty( $css ) ) {
		return;
	}

	// Output the CSS.
	wp_register_style( 'gutenberg-style-variation-' . $style_variation_id, false );
	wp_enqueue_style( 'gutenberg-style-variation-' . $style_variation_id );
	wp_add_inline_style( 'gutenberg-style-variation-' . $style_variation_id, $css );
}
add_action( 'wp_enqueue_scripts', 'gutenberg_enqueue_style_variation_css', 100 );
