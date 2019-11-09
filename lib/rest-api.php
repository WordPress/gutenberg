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
 * Reducer callback operating on an array of block results for REST response.
 * Given a block entity, adds an array formatted for use in the response, if
 * the block is named.
 *
 * @param array $result Blocks to include.
 * @param array $block  The parsed block to format.
 * @return array        Block formatted for REST response.
 */
function gutenberg_format_block_for_rest( $result, $block ) {
	if ( ! empty( $block['blockName'] ) ) {
		$result[] = array(
			'name'         => $block['blockName'],
			'attributes'   => (object) $block['attrs'],
			'inner_blocks' => array_reduce(
				$block['innerBlocks'],
				'gutenberg_format_block_for_rest',
				array()
			),
		);
	}

	return $result;
}

/**
 * Augments REST Posts controller response to include blocks data, only if
 * response already includes `content.raw`.
 *
 * In a more correct implementation, this would use item schema as basis for
 * whether `content.blocks` is included in a response.
 *
 * @since 6.9.0
 *
 * @param WP_REST_Response $response The response object.
 * @return WP_HTTP_Response          The filtered response object.
 */
function gutenberg_add_blocks_to_rest_posts_content( $response ) {
	if ( ! empty( $response->data['content']['raw'] ) ) {
		$response->data['content']['blocks'] = array_reduce(
			parse_blocks( $response->data['content']['raw'] ),
			'gutenberg_format_block_for_rest',
			array()
		);
	}

	return $response;
}

/**
 * Adds filter for all registered post types to augment REST API responses for
 * that post type to include blocks data.
 *
 * In a core implementation, this would not be necessary, as the logic for
 * including blocks data would be part of the controller implementation.
 *
 * @since 6.9.0
 */
function gutenberg_filter_rest_prepare_post_types() {
	$post_types = get_post_types();
	foreach ( $post_types as $post_type ) {
		add_filter(
			'rest_prepare_' . $post_type,
			'gutenberg_add_blocks_to_rest_posts_content'
		);
	}
}
add_action( 'rest_pre_dispatch', 'gutenberg_filter_rest_prepare_post_types' );

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
 * Registers the block directory.
 *
 * @since 6.5.0
 */
function gutenberg_register_rest_block_directory() {
	if ( ! gutenberg_is_experiment_enabled( 'gutenberg-block-directory' ) ) {
		return;
	}

	$block_directory_controller = new WP_REST_Block_Directory_Controller();
	$block_directory_controller->register_routes();
}
add_filter( 'rest_api_init', 'gutenberg_register_rest_block_directory' );
