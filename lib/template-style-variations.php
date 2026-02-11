<?php
/**
 * Template Style Variations API.
 *
 * Public functions for working with template-specific style variations.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

/**
 * The meta key used to store the style variation ID on templates.
 */
define( 'GUTENBERG_TEMPLATE_STYLE_VARIATION_META_KEY', '_wp_style_variation_id' );

/**
 * The meta key used to identify which variation a wp_global_styles post belongs to.
 * This creates a one-to-one relationship between variations and their style posts.
 */
define( 'GUTENBERG_VARIATION_SOURCE_META_KEY', '_wp_source_variation_id' );

/**
 * Registers a style variation.
 *
 *
 * @param string $id   Unique identifier for the variation (e.g., 'theme//variation-name').
 * @param array  $args {
 *     Arguments for the style variation.
 *
 *     @type string $title      Human-readable title for the variation.
 *     @type array  $data       The theme.json-compatible data (settings, styles).
 *     @type string $base_theme Optional. ID of a registered base theme.
 *     @type string $source     Optional. Source of the variation ('theme', 'plugin', 'custom').
 * }
 * @return bool True on success, false on failure.
 */
function gutenberg_register_style_variation( $id, $args ) {
	return WP_Style_Variations_Registry_Gutenberg::get_instance()->register( $id, $args );
}

/**
 * Unregisters a style variation.
 *
 *
 * @param string $id The variation ID to unregister.
 * @return bool True on success, false on failure.
 */
function gutenberg_unregister_style_variation( $id ) {
	return WP_Style_Variations_Registry_Gutenberg::get_instance()->unregister( $id );
}

/**
 * Registers a base theme.
 *
 *
 * @param string $id   Unique identifier for the base theme.
 * @param array  $args {
 *     Arguments for the base theme.
 *
 *     @type string $title Human-readable title for the base theme.
 *     @type array  $data  The full theme.json-compatible data.
 * }
 * @return bool True on success, false on failure.
 */
function gutenberg_register_base_theme( $id, $args ) {
	return WP_Base_Themes_Registry_Gutenberg::get_instance()->register( $id, $args );
}

/**
 * Unregisters a base theme.
 *
 *
 * @param string $id The base theme ID to unregister.
 * @return bool True on success, false on failure.
 */
function gutenberg_unregister_base_theme( $id ) {
	return WP_Base_Themes_Registry_Gutenberg::get_instance()->unregister( $id );
}

/**
 * Gets the style variation ID associated with a template.
 *
 *
 * @param string $template_id The template ID (e.g., 'theme//single').
 * @return string|null The registered style variation ID, or null if none.
 */
function gutenberg_get_template_style_variation_id( $template_id ) {
	// Parse the template ID to get the slug.
	$parts = explode( '//', $template_id, 2 );
	$slug  = isset( $parts[1] ) ? $parts[1] : $template_id;
	$theme = isset( $parts[0] ) ? $parts[0] : get_stylesheet();

	// Find the template post.
	$template_posts = get_posts(
		array(
			'post_type'      => 'wp_template',
			'post_status'    => array( 'publish', 'auto-draft' ),
			'name'           => $slug,
			'posts_per_page' => 1,
			'tax_query'      => array(
				array(
					'taxonomy' => 'wp_theme',
					'field'    => 'name',
					'terms'    => array( $theme, get_template() ),
				),
			),
		)
	);

	if ( empty( $template_posts ) ) {
		return null;
	}

	$template_post = $template_posts[0];
	$variation_id  = get_post_meta( $template_post->ID, GUTENBERG_TEMPLATE_STYLE_VARIATION_META_KEY, true );

	return $variation_id ? $variation_id : null;
}

/**
 * Determines the current template being rendered on the frontend.
 *
 *
 * @return string|null The template ID, or null if not determinable.
 */
function gutenberg_get_current_template_id() {
	global $_wp_current_template_id;

	if ( ! empty( $_wp_current_template_id ) ) {
		return $_wp_current_template_id;
	}

	// Fallback: try to determine from the queried template.
	if ( ! is_admin() && function_exists( 'wp_is_block_theme' ) && wp_is_block_theme() ) {
		$template_slug = '';

		if ( is_front_page() && is_home() ) {
			$template_slug = 'home';
		} elseif ( is_front_page() ) {
			$template_slug = 'front-page';
		} elseif ( is_home() ) {
			$template_slug = 'home';
		} elseif ( is_singular() ) {
			$template_slug = 'single';
		} elseif ( is_archive() ) {
			$template_slug = 'archive';
		} elseif ( is_search() ) {
			$template_slug = 'search';
		} elseif ( is_404() ) {
			$template_slug = '404';
		} else {
			$template_slug = 'index';
		}

		return get_stylesheet() . '//' . $template_slug;
	}

	return null;
}

/**
 * Registers the template style variation meta for templates.
 *
 */
function gutenberg_register_template_style_variation_meta() {
	// Register the variation ID meta (string ID like "demo//dark-mode").
	// This links a template to a registered style variation.
	register_post_meta(
		'wp_template',
		GUTENBERG_TEMPLATE_STYLE_VARIATION_META_KEY,
		array(
			'type'              => 'string',
			'single'            => true,
			'show_in_rest'      => true,
			'auth_callback'     => function () {
				return current_user_can( 'edit_theme_options' );
			},
			'sanitize_callback' => 'sanitize_text_field',
		)
	);
}

add_action( 'init', 'gutenberg_register_template_style_variation_meta' );

/**
 * Registers theme style variations into the style variations registry.
 *
 * Reads style variation JSON files from the active theme's styles/ directory
 * and registers them so they appear in the template style variation picker.
 *
 */
function gutenberg_register_theme_style_variations() {
	$theme_variations = WP_Theme_JSON_Resolver_Gutenberg::get_style_variations( 'theme' );
	foreach ( $theme_variations as $theme_variation ) {
		if ( empty( $theme_variation['title'] ) ) {
			continue;
		}
		$variation_id = 'theme//' . sanitize_title( $theme_variation['title'] );
		if ( WP_Style_Variations_Registry_Gutenberg::get_instance()->is_registered( $variation_id ) ) {
			continue;
		}
		gutenberg_register_style_variation(
			$variation_id,
			array(
				'title'  => $theme_variation['title'],
				'source' => 'theme',
				'data'   => array(
					'version'  => 3,
					'settings' => isset( $theme_variation['settings'] ) ? $theme_variation['settings'] : array(),
					'styles'   => isset( $theme_variation['styles'] ) ? $theme_variation['styles'] : array(),
				),
			)
		);
	}
}
add_action( 'init', 'gutenberg_register_theme_style_variations', 10 );

/**
 * Gets the wp_global_styles post ID for a style variation.
 *
 * Looks up the post by querying for the _wp_source_variation_id meta.
 * There should be at most one wp_global_styles post per variation.
 *
 *
 * @param string $variation_id The style variation ID (e.g., 'demo//dark-mode').
 * @return int|null The wp_global_styles post ID, or null if none exists.
 */
function gutenberg_get_variation_post_id( $variation_id ) {
	if ( empty( $variation_id ) ) {
		return null;
	}

	$posts = get_posts(
		array(
			'post_type'      => 'wp_global_styles',
			'post_status'    => array( 'publish', 'draft' ),
			'posts_per_page' => 1,
			'meta_query'     => array(
				array(
					'key'   => GUTENBERG_VARIATION_SOURCE_META_KEY,
					'value' => $variation_id,
				),
			),
		)
	);

	if ( empty( $posts ) ) {
		return null;
	}

	return (int) $posts[0]->ID;
}

/**
 * Creates or gets the wp_global_styles post for a style variation.
 *
 * If a wp_global_styles post already exists for this variation, returns its ID.
 * Otherwise, creates a new post initialized with the registered variation's data.
 *
 * There is ONE post per variation, shared by all templates using that variation.
 *
 *
 * @param string $variation_id The registered style variation ID.
 * @return int|WP_Error The wp_global_styles post ID, or WP_Error on failure.
 */
function gutenberg_get_or_create_variation_post( $variation_id ) {
	// Check if a post already exists for this variation.
	$existing_post_id = gutenberg_get_variation_post_id( $variation_id );
	if ( $existing_post_id ) {
		return $existing_post_id;
	}

	// Get the registered variation data.
	$registry  = WP_Style_Variations_Registry_Gutenberg::get_instance();
	$variation = $registry->get_registered( $variation_id );

	if ( ! $variation ) {
		return new WP_Error(
			'variation_not_found',
			/* translators: %s: variation ID */
			sprintf( __( 'Style variation "%s" is not registered.', 'gutenberg' ), $variation_id )
		);
	}

	// Create the global styles post.
	$post_data = array(
		'post_type'    => 'wp_global_styles',
		'post_status'  => 'publish',
		'post_title'   => $variation['title'],
		'post_content' => wp_json_encode(
			array(
				'version'                     => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'isGlobalStylesUserThemeJSON' => true,
				'settings'                    => isset( $variation['data']['settings'] ) ? $variation['data']['settings'] : new stdClass(),
				'styles'                      => isset( $variation['data']['styles'] ) ? $variation['data']['styles'] : new stdClass(),
			)
		),
		'post_name'    => sanitize_title( 'wp-global-styles-' . $variation_id ),
	);

	$post_id = wp_insert_post( $post_data, true );

	if ( is_wp_error( $post_id ) ) {
		return $post_id;
	}

	// Store the source variation ID on the post. This links the post to the variation.
	update_post_meta( $post_id, GUTENBERG_VARIATION_SOURCE_META_KEY, $variation_id );

	// Store the base theme if present.
	if ( ! empty( $variation['base_theme'] ) ) {
		update_post_meta( $post_id, '_wp_base_theme_id', $variation['base_theme'] );
	}

	// Note: We intentionally do NOT assign the wp_theme taxonomy to variation posts.
	// Variation posts are identified by their _wp_source_variation_id meta.
	// Assigning the theme taxonomy would cause get_user_data_from_wp_global_styles()
	// to return the variation post instead of the default global styles post.

	return $post_id;
}
