<?php
/**
 * PHP and WordPress configuration compatibility functions for the Gutenberg
 * editor plugin changes related to REST API.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

/**
 * Handle a failing oEmbed proxy request to try embedding as a shortcode.
 *
 * @see https://core.trac.wordpress.org/ticket/45447
 *
 * @since 2.3.0
 *
 * @param  WP_HTTP_Response|WP_Error $response The REST Request response.
 * @param  WP_REST_Server            $handler  ResponseHandler instance (usually WP_REST_Server).
 * @param  WP_REST_Request           $request  Request used to generate the response.
 * @return WP_HTTP_Response|object|WP_Error    The REST Request response.
 */
function gutenberg_filter_oembed_result( $response, $handler, $request ) {
	if ( ! is_wp_error( $response ) || 'oembed_invalid_url' !== $response->get_error_code() ||
			'/oembed/1.0/proxy' !== $request->get_route() ) {
		return $response;
	}

	// Try using a classic embed instead.
	global $wp_embed;
	$html = $wp_embed->shortcode( array(), $_GET['url'] );
	if ( ! $html ) {
		return $response;
	}

	global $wp_scripts;

	// Check if any scripts were enqueued by the shortcode, and include them in
	// the response.
	$enqueued_scripts = array();
	foreach ( $wp_scripts->queue as $script ) {
		$enqueued_scripts[] = $wp_scripts->registered[ $script ]->src;
	}

	return array(
		'provider_name' => __( 'Embed Handler', 'gutenberg' ),
		'html'          => $html,
		'scripts'       => $enqueued_scripts,
	);
}
add_filter( 'rest_request_after_callbacks', 'gutenberg_filter_oembed_result', 10, 3 );

/**
 * Adds the visibility property to the `publish` and `private` statuses.
 *
 * @since 6.x.x
 *
 * @param  array  $data      The status data.
 * @param  string $attribute The REST field's name attribute.
 * @return string            The label to use into the Block editor.
 */
function gutenberg_get_status_visibility_properties( $data, $attribute ) {
	$value = new stdClass();

	if ( 'visibility' !== $attribute || ! isset( $data['slug'] ) ) {
		return $value;
	}

	if ( 'publish' === $data['slug'] ) {
		$value->value = 'public';
		$value->label = __( 'Public', 'gutenberg' );
		$value->info  = __( 'Visible to everyone.', 'gutenberg' );
	} elseif ( 'private' === $data['slug'] ) {
		$value->value = 'private';
		$value->label = __( 'Private', 'gutenberg' );
		$value->info  = __( 'Only visible to site admins and editors.', 'gutenberg' );
	} else {
		$status_object = get_post_status_object( $data['slug'] );

		if ( isset( $status_object->visibility ) ) {
			$value = (object) $status_object->visibility;
		}
	}

	return $value;
}

/**
 * Registers a new property for the REST Status controller schema.
 *
 * @since 6.x.x
 */
function gutenberg_register_statuses_visibility_field() {
	register_rest_field(
		'status',
		'visibility',
		array(
			'get_callback' => 'gutenberg_get_status_visibility_properties',
			'schema'       => array(
				'context'     => array( 'view', 'edit' ),
				'description' => __( 'The visibility properties of the status.', 'gutenberg' ),
				'type'        => 'object',
				'readonly'    => true,
			),
		)
	);

	/**
	 * Register a custom status for the password visibility. This is done within
	 * the REST context to avoid any side effects on the classic editor.
	 */
	register_post_status(
		'password',
		array(
			'label'      => _x( 'Password protected', 'post status', 'gutenberg' ),
			'protected'  => true,
			'visibility' => (object) array(
				'value' => 'password',
				'label' => __( 'Password Protected', 'gutenberg' ),
				'info'  => __( 'Protected with a password you choose. Only those with the password can view this post.', 'gutenberg' ),
			),
		)
	);
}
add_action( 'rest_api_init', 'gutenberg_register_statuses_visibility_field' );

/**
 * Start: Include for phase 2
 */
/**
 * Registers the REST API routes needed by the legacy widget block.
 *
 * @since 5.0.0
 */
function gutenberg_register_rest_widget_updater_routes() {
	$widgets_controller = new WP_REST_Widget_Updater_Controller();
	$widgets_controller->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_rest_widget_updater_routes' );

/**
 * Registers the widget area REST API routes.
 *
 * @since 5.7.0
 */
function gutenberg_register_rest_widget_areas() {
	$widget_areas_controller = new WP_REST_Widget_Areas_Controller();
	$widget_areas_controller->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_rest_widget_areas' );
/**
 * End: Include for phase 2
 */
