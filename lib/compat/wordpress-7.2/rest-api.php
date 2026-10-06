<?php
/**
 * WordPress 7.2 compatibility functions for the Gutenberg
 * editor plugin changes related to REST API.
 *
 * @package gutenberg
 */

/**
 * Registers the View Config REST API routes.
 *
 * Replaces the 7.1 registration so the route is served by the 7.2 controller.
 */
function gutenberg_register_view_config_controller_endpoints_7_2() {
	$view_config_controller = new Gutenberg_REST_View_Config_Controller_7_2();
	$view_config_controller->register_routes();
}
remove_action( 'rest_api_init', 'gutenberg_register_view_config_controller_endpoints', PHP_INT_MAX );
add_action( 'rest_api_init', 'gutenberg_register_view_config_controller_endpoints_7_2', PHP_INT_MAX );

/**
 * Registers the Templates and Template Parts REST API routes.
 *
 * Replaces the core controller class so the 7.2 controller is used.
 *
 * @see Gutenberg_REST_Templates_Controller_7_2
 *
 * @param array $args Array of arguments for registering a post type.
 * @return array Modified array of arguments.
 */
function gutenberg_modify_template_post_type_args_7_2( $args ) {
	$args['rest_controller_class'] = 'Gutenberg_REST_Templates_Controller_7_2';
	return $args;
}
add_filter( 'register_wp_template_post_type_args', 'gutenberg_modify_template_post_type_args_7_2' );
add_filter( 'register_wp_template_part_post_type_args', 'gutenberg_modify_template_post_type_args_7_2' );

/**
 * Exposes the privacy policy page setting in the REST API.
 *
 * WordPress stores the page assigned in Settings > Privacy in the
 * `wp_page_for_privacy_policy` option, but does not register it with
 * `show_in_rest`, so the settings endpoint cannot report it. Registering it
 * lets the editor label the privacy policy page, alongside the homepage and
 * the posts page.
 *
 * Runs on `rest_api_init` after `register_initial_settings`, and skips
 * registration when WordPress Core already exposes the option.
 */
function gutenberg_register_privacy_policy_page_setting() {
	$registered = get_registered_settings();
	if (
		isset( $registered['wp_page_for_privacy_policy'] ) &&
		! empty( $registered['wp_page_for_privacy_policy']['show_in_rest'] )
	) {
		return;
	}

	register_setting(
		'reading',
		'wp_page_for_privacy_policy',
		array(
			'show_in_rest' => array(
				'name' => 'page_for_privacy_policy',
			),
			'type'         => 'integer',
			'description'  => __( 'The ID of the page that should be displayed as the privacy policy page', 'gutenberg' ),
			'default'      => 0,
		)
	);
}
add_action( 'rest_api_init', 'gutenberg_register_privacy_policy_page_setting', 11 );

/**
 * Prevents users without the `manage_privacy_options` capability from
 * changing the privacy policy page through the REST API.
 *
 * The settings endpoint only checks `manage_options`. On multisite the
 * `manage_privacy_options` capability maps to `manage_network`, so a site
 * administrator can read the setting but must not change it, matching the
 * Settings > Privacy screen.
 *
 * @param bool   $updated Whether the setting update has already been handled.
 * @param string $name    Setting name (as shown in REST API responses).
 * @return bool Whether to short-circuit the update.
 */
function gutenberg_restrict_privacy_policy_page_setting_update( $updated, $name ) {
	if ( 'page_for_privacy_policy' === $name && ! current_user_can( 'manage_privacy_options' ) ) {
		return true;
	}
	return $updated;
}
add_filter( 'rest_pre_update_setting', 'gutenberg_restrict_privacy_policy_page_setting_update', 10, 2 );

/**
 * Adds the `action-trash` link to a REST response.
 *
 * Targets the `self` link, so responses whose `_fields` leave out `_links`
 * are skipped. Attachments run `rest_prepare_attachment` twice, so an
 * existing link is kept.
 *
 * @param WP_REST_Response $response The response object.
 */
function gutenberg_add_trash_action_link( $response ) {
	$links = $response->get_links();
	if (
		empty( $links['self'][0]['href'] ) ||
		isset( $links['https://api.w.org/action-trash'] )
	) {
		return;
	}

	$response->add_link( 'https://api.w.org/action-trash', $links['self'][0]['href'] );
}

/**
 * Adds the `action-trash` link to posts the current user can move to the trash.
 *
 * Without the link, deleting the post is permanent.
 *
 * @param WP_REST_Response $response The response object.
 * @param WP_Post          $post     Post object.
 * @param WP_REST_Request  $request  Request object.
 * @return WP_REST_Response The response object.
 */
function gutenberg_add_post_trash_action_link( $response, $post, $request ) {
	if (
		! $post instanceof WP_Post ||
		'edit' !== $request['context'] ||
		'trash' === $post->post_status ||
		! current_user_can( 'delete_post', $post->ID )
	) {
		return $response;
	}

	// Mirrors `WP_REST_Posts_Controller::delete_item()`.
	$supports_trash = ( EMPTY_TRASH_DAYS > 0 );
	if ( 'attachment' === $post->post_type ) {
		$supports_trash = $supports_trash && MEDIA_TRASH;
	}

	/** This filter is documented in wp-includes/rest-api/endpoints/class-wp-rest-posts-controller.php */
	$supports_trash = apply_filters( "rest_{$post->post_type}_trashable", $supports_trash, $post );
	if ( $supports_trash ) {
		gutenberg_add_trash_action_link( $response );
	}

	return $response;
}

/**
 * Adds the `action-trash` link to comments the current user can move to the trash.
 *
 * Without the link, deleting the comment is permanent.
 *
 * @param WP_REST_Response $response The response object.
 * @param WP_Comment       $comment  Comment object.
 * @param WP_REST_Request  $request  Request object.
 * @return WP_REST_Response The response object.
 */
function gutenberg_add_comment_trash_action_link( $response, $comment, $request ) {
	if (
		'edit' !== $request['context'] ||
		'trash' === $comment->comment_approved ||
		(
			! current_user_can( 'moderate_comments' ) &&
			! current_user_can( 'edit_comment', $comment->comment_ID )
		)
	) {
		return $response;
	}

	/** This filter is documented in wp-includes/rest-api/endpoints/class-wp-rest-comments-controller.php */
	$supports_trash = apply_filters( 'rest_comment_trashable', ( EMPTY_TRASH_DAYS > 0 ), $comment );
	if ( $supports_trash ) {
		gutenberg_add_trash_action_link( $response );
	}

	return $response;
}
add_filter( 'rest_prepare_comment', 'gutenberg_add_comment_trash_action_link', 10, 3 );

/**
 * Registers the `action-trash` link filter for post types shown in REST.
 *
 * Menu items and fonts can only be deleted permanently, so they're skipped.
 *
 * @param string       $post_type        Post type slug.
 * @param WP_Post_Type $post_type_object Post type object.
 */
function gutenberg_register_post_trash_action_link( $post_type, $post_type_object ) {
	if (
		! $post_type_object->show_in_rest ||
		in_array( $post_type, array( 'nav_menu_item', 'wp_font_family', 'wp_font_face' ), true )
	) {
		return;
	}

	add_filter( "rest_prepare_{$post_type}", 'gutenberg_add_post_trash_action_link', 10, 3 );
}
add_action( 'registered_post_type', 'gutenberg_register_post_trash_action_link', 10, 2 );
