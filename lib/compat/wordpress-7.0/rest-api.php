<?php
/**
 * WordPress 7.0 compatibility functions for the Gutenberg
 * editor plugin changes related to REST API.
 *
 * @package gutenberg
 */

/**
 * Registers the Block Patterns REST API routes.
 */
function gutenberg_register_block_patterns_controller_endpoints() {
	$block_patterns_controller = new Gutenberg_REST_Block_Patterns_Controller_7_0();
	$block_patterns_controller->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_block_patterns_controller_endpoints' );

/**
 * Registers the Registered Templates REST API routes.
 * The template activation experiment registers its own routes, so we only register the registered templates controller if the experiment is not enabled.
 * See: lib/compat/wordpress-7.0/template-activate.php
 *
 * @see Gutenberg_REST_Registered_Templates_Controller
 * @see Gutenberg_REST_Templates_Controller_7_0
 */
if ( ! gutenberg_is_experiment_enabled( 'active_templates' ) ) {
	function gutenberg_modify_wp_template_post_type_args_7_0( $args ) {
		$args['rest_controller_class']   = 'Gutenberg_REST_Templates_Controller_7_0';
		$args['late_route_registration'] = true;
		return $args;
	}
	add_filter( 'register_wp_template_post_type_args', 'gutenberg_modify_wp_template_post_type_args_7_0' );
}

/**
 * Registers the Registered Templates Parts REST API routes.
 * The template activation experiment does not, however, register the routes for the wp_template_part post type,
 * so we need to register the routes for that post type here.
 * See: lib/compat/wordpress-7.0/template-activate.php
 *
 * @see Gutenberg_REST_Registered_Templates_Controller
 * @see Gutenberg_REST_Templates_Controller_7_0
 */
function gutenberg_modify_wp_template_part_post_type_args_7_0( $args ) {
	$args['rest_controller_class']   = 'Gutenberg_REST_Templates_Controller_7_0';
	$args['late_route_registration'] = true;
	return $args;
}
add_filter( 'register_wp_template_part_post_type_args', 'gutenberg_modify_wp_template_part_post_type_args_7_0' );

/**
 * Registers the 'navigation-overlay' template part area when the experiment is enabled.
 *
 * @param array $areas Array of template part area definitions.
 * @return array Modified array of template part area definitions.
 */
if ( gutenberg_is_experiment_enabled( 'gutenberg-customizable-navigation-overlays' ) ) {
	function gutenberg_register_overlay_template_part_area( $areas ) {
		$areas[] = array(
			'area'        => 'navigation-overlay',
			'label'       => __( 'Navigation Overlay', 'gutenberg' ),
			'description' => __( 'Custom overlay area for navigation overlays.', 'gutenberg' ),
			'icon'        => 'overlay',
			'area_tag'    => 'div',
		);

		return $areas;
	}
	add_filter( 'default_wp_template_part_areas', 'gutenberg_register_overlay_template_part_area' );
}

/**
 * Adds user global styles link relation to all theme responses.
 *
 * This ensures that all themes (including classic themes) have access to the
 * wp:user-global-styles link, which is required for the font library to function.
 *
 * WordPress core only adds this link for block themes with theme.json support.
 * This filter extends that functionality to all themes.
 *
 * @param WP_REST_Response $response The response object.
 * @param WP_Theme         $theme    Theme object used to create response.
 * @return WP_REST_Response Modified response object.
 */
function gutenberg_rest_theme_global_styles_link_rel_7_0( $response, $theme ) {
	// Only add the link for the active theme to match WordPress core behavior.
	if ( $theme->get_stylesheet() !== get_stylesheet() ) {
		return $response;
	}

	// Check if the link already exists (WordPress core adds it for block themes).
	$all_links = $response->get_links();
	if ( isset( $all_links['https://api.w.org/user-global-styles'] ) ) {
		return $response;
	}

	// Get or create the global styles post ID for this theme.
	// Now that we've removed the theme.json check, this works for all themes.
	$global_styles_id = WP_Theme_JSON_Resolver_Gutenberg::get_user_global_styles_post_id();
	if ( ! $global_styles_id ) {
		return $response;
	}

	// Add the wp:user-global-styles link.
	$response->add_link(
		'https://api.w.org/user-global-styles',
		rest_url( 'wp/v2/global-styles/' . $global_styles_id )
	);

	return $response;
}
add_filter( 'rest_prepare_theme', 'gutenberg_rest_theme_global_styles_link_rel_7_0', 10, 2 );
