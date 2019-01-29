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
 * Registers the REST API routes needed by the Gutenberg editor.
 *
 * @since 2.8.0
 * @deprecated 5.0.0
 */
function gutenberg_register_rest_routes() {
	_deprecated_function( __FUNCTION__, '5.0.0' );
}

/**
 * Make sure oEmbed REST Requests apply the WP Embed security mechanism for WordPress embeds.
 *
 * @see  https://core.trac.wordpress.org/ticket/32522
 *
 * TODO: This is a temporary solution. Next step would be to edit the WP_oEmbed_Controller,
 * once merged into Core.
 *
 * @since 2.3.0
 *
 * @param  WP_HTTP_Response|WP_Error $response The REST Request response.
 * @param  WP_REST_Server            $handler  ResponseHandler instance (usually WP_REST_Server).
 * @param  WP_REST_Request           $request  Request used to generate the response.
 * @return WP_HTTP_Response|object|WP_Error    The REST Request response.
 */
function gutenberg_filter_oembed_result( $response, $handler, $request ) {
	if ( 'GET' !== $request->get_method() ) {
		return $response;
	}

	if ( is_wp_error( $response ) && 'oembed_invalid_url' !== $response->get_error_code() ) {
		return $response;
	}

	// External embeds.
	if ( '/oembed/1.0/proxy' === $request->get_route() ) {
		if ( is_wp_error( $response ) ) {
			// It's possibly a local post, so lets try and retrieve it that way.
			$post_id = url_to_postid( $_GET['url'] );
			$data    = get_oembed_response_data( $post_id, apply_filters( 'oembed_default_width', 600 ) );

			if ( $data ) {
				// It's a local post!
				$response = (object) $data;
			} else {
				// Try using a classic embed, instead.
				global $wp_embed;
				$html = $wp_embed->shortcode( array(), $_GET['url'] );
				if ( $html ) {
					global $wp_scripts;
					// Check if any scripts were enqueued by the shortcode, and
					// include them in the response.
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
			}
		}

		// Make sure the HTML is run through the oembed sanitisation routines.
		$response->html = wp_oembed_get( $_GET['url'], $_GET );
	}

	return $response;
}
add_filter( 'rest_request_after_callbacks', 'gutenberg_filter_oembed_result', 10, 3 );

/**
 * Add additional 'visibility' rest api field to taxonomies.
 *
 * Used so private taxonomies are not displayed in the UI.
 *
 * @see https://core.trac.wordpress.org/ticket/42707
 * @deprecated 5.0.0
 */
function gutenberg_add_taxonomy_visibility_field() {
	_deprecated_function( __FUNCTION__, '5.0.0' );
}

/**
 * Gets taxonomy visibility property data.
 *
 * @see https://core.trac.wordpress.org/ticket/42707
 * @deprecated 5.0.0
 *
 * @param array $object Taxonomy data from REST API.
 * @return array Array of taxonomy visibility data.
 */
function gutenberg_get_taxonomy_visibility_data( $object ) {
	_deprecated_function( __FUNCTION__, '5.0.0' );

	return isset( $object['visibility'] ) ? $object['visibility'] : array();
}

/**
 * Add a permalink template to posts in the post REST API response.
 *
 * @see https://core.trac.wordpress.org/ticket/45017
 * @deprecated 5.0.0
 *
 * @param WP_REST_Response $response WP REST API response of a post.
 * @return WP_REST_Response Response containing the permalink_template.
 */
function gutenberg_add_permalink_template_to_posts( $response ) {
	_deprecated_function( __FUNCTION__, '5.0.0' );

	return $response;
}

/**
 * Add the block format version to post content in the post REST API response.
 *
 * @see https://core.trac.wordpress.org/ticket/43887
 * @deprecated 5.0.0
 *
 * @param WP_REST_Response $response WP REST API response of a post.
 * @return WP_REST_Response Response containing the block_format.
 */
function gutenberg_add_block_format_to_post_content( $response ) {
	_deprecated_function( __FUNCTION__, '5.0.0' );

	return $response;
}

/**
 * Include target schema attributes to links, based on whether the user can.
 *
 * @see https://core.trac.wordpress.org/ticket/45014
 * @deprecated 5.0.0
 *
 * @param WP_REST_Response $response WP REST API response of a post.
 * @return WP_REST_Response Response containing the new links.
 */
function gutenberg_add_target_schema_to_links( $response ) {
	_deprecated_function( __FUNCTION__, '5.0.0' );

	return $response;
}

/**
 * Whenever a post type is registered, ensure we're hooked into it's WP REST API response.
 *
 * @deprecated 5.0.0
 *
 * @param string $post_type The newly registered post type.
 * @return string That same post type.
 */
function gutenberg_register_post_prepare_functions( $post_type ) {
	_deprecated_function( __FUNCTION__, '5.0.0' );

	return $post_type;
}

/**
 * Silence PHP Warnings and Errors in JSON requests
 *
 * @see https://core.trac.wordpress.org/ticket/44534
 * @deprecated 5.0.0
 */
function gutenberg_silence_rest_errors() {
	_deprecated_function( __FUNCTION__, '5.0.0' );
}

/**
 * Include additional labels for registered post types
 *
 * @see https://core.trac.wordpress.org/ticket/45101
 * @deprecated 5.0.0
 *
 * @param array $args Arguments supplied to register_post_type().
 * @return array Arguments supplied to register_post_type()
 */
function gutenberg_filter_post_type_labels( $args ) {
	_deprecated_function( __FUNCTION__, '5.0.0' );

	return $args;
}
