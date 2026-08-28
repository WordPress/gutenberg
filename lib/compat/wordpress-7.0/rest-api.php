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
 * Registers the 'navigation-overlay' template part area.
 *
 * @param array $areas Array of template part area definitions.
 * @return array Modified array of template part area definitions.
 */
function gutenberg_register_overlay_template_part_area( $areas ) {
	foreach ( $areas as $area ) {
		if ( isset( $area['area'] ) && 'navigation-overlay' === $area['area'] ) {
			return $areas;
		}
	}

	$areas[] = array(
		'area'        => 'navigation-overlay',
		'label'       => __( 'Navigation Overlay', 'gutenberg' ),
		'description' => __(
			'The Navigation Overlay template defines an overlay area that typically contains navigation links and can be toggled open and closed.'
		),
		'icon'        => 'navigation-overlay',
		'area_tag'    => 'div',
	);

	return $areas;
}
add_filter( 'default_wp_template_part_areas', 'gutenberg_register_overlay_template_part_area' );

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

/**
 * Overrides the default REST controllers for revisions.
 *
 * The Gutenberg controllers support nested _fields parameters (e.g.
 * content.raw without content.rendered) and add a route to restore a
 * revision.
 *
 * The core WP_REST_Revisions_Controller uses in_array() checks for content,
 * title, excerpt, and guid fields, which prevents sub-field filtering via
 * the _fields parameter. The Gutenberg override uses rest_is_field_included()
 * so that clients can avoid expensive server-side rendering when only raw
 * data is needed.
 *
 * Post types that set their own controller keep it, except for templates,
 * which are switched to the Gutenberg subclass of the core template
 * revisions controller.
 */
function gutenberg_override_revisions_rest_controller( $args ) {
	if ( empty( $args['revisions_rest_controller_class'] ) ) {
		$args['revisions_rest_controller_class'] = 'Gutenberg_REST_Revisions_Controller';
	} elseif ( 'WP_REST_Template_Revisions_Controller' === $args['revisions_rest_controller_class'] ) {
		$args['revisions_rest_controller_class'] = 'Gutenberg_REST_Template_Revisions_Controller';
	}
	return $args;
}

add_filter( 'register_post_type_args', 'gutenberg_override_revisions_rest_controller', 10, 1 );

/**
 * Checks whether the current user may restore a revision of a parent post.
 *
 * Shared by the revisions controllers, which resolve the parent post
 * differently.
 *
 * @param WP_Post|WP_Error $parent_post Parent post of the revision, or the
 *                                      error that resolving it produced.
 * @return true|WP_Error True if the user may restore, WP_Error otherwise.
 */
function gutenberg_rest_restore_revision_permissions_check( $parent_post ) {
	if ( is_wp_error( $parent_post ) ) {
		return $parent_post;
	}

	if ( ! current_user_can( 'edit_post', $parent_post->ID ) ) {
		return new WP_Error(
			'rest_cannot_restore_revision',
			__( 'Sorry, you are not allowed to restore revisions of this post.' ),
			array( 'status' => rest_authorization_required_code() )
		);
	}

	return true;
}

/**
 * Restores a revision of a parent post.
 *
 * Shared by the revisions controllers, which resolve the parent post
 * differently.
 *
 * @param WP_Post|WP_Error $parent_post Parent post of the revision, or the
 *                                      error that resolving it produced.
 * @param WP_Post|WP_Error $revision    The revision to restore, or the error
 *                                      that resolving it produced.
 * @return WP_REST_Response|WP_Error Response object with the parent and
 *                                   revision IDs and the date of the restored
 *                                   revision, or WP_Error object on failure.
 */
function gutenberg_rest_restore_revision( $parent_post, $revision ) {
	if ( is_wp_error( $parent_post ) ) {
		return $parent_post;
	}

	if ( is_wp_error( $revision ) ) {
		return $revision;
	}

	if ( (int) $parent_post->ID !== (int) $revision->post_parent ) {
		return new WP_Error(
			'rest_revision_parent_id_mismatch',
			/* translators: %d: A post id. */
			sprintf( __( 'The revision does not belong to the specified parent with id of "%d"' ), $parent_post->ID ),
			array( 'status' => 404 )
		);
	}

	$result = wp_restore_post_revision( $revision->ID );

	if ( is_wp_error( $result ) ) {
		return $result;
	}

	if ( ! $result ) {
		return new WP_Error(
			'rest_cannot_restore_revision',
			__( 'The revision could not be restored.' ),
			array( 'status' => 500 )
		);
	}

	return new WP_REST_Response(
		array(
			'parent'   => (int) $parent_post->ID,
			'revision' => (int) $revision->ID,
			'date'     => mysql_to_rfc3339( $revision->post_date ),
		)
	);
}
