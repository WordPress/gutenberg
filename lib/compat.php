<?php
/**
 * PHP and WordPress configuration compatibility functions for the Gutenberg
 * editor plugin.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

/**
 * Splits a UTF-8 string into an array of UTF-8-encoded codepoints.
 *
 * @since 0.5.0
 *
 * Based on WordPress' _mb_substr() compat function.
 *
 * @param string $str        The string to split.
 * @return array
 */
function _gutenberg_utf8_split( $str ) {
	if ( _wp_can_use_pcre_u() ) {
		// Use the regex unicode support to separate the UTF-8 characters into
		// an array.
		preg_match_all( '/./us', $str, $match );
		return $match[0];
	}

	$regex = '/(
		  [\x00-\x7F]                  # single-byte sequences   0xxxxxxx
		| [\xC2-\xDF][\x80-\xBF]       # double-byte sequences   110xxxxx 10xxxxxx
		| \xE0[\xA0-\xBF][\x80-\xBF]   # triple-byte sequences   1110xxxx 10xxxxxx * 2
		| [\xE1-\xEC][\x80-\xBF]{2}
		| \xED[\x80-\x9F][\x80-\xBF]
		| [\xEE-\xEF][\x80-\xBF]{2}
		| \xF0[\x90-\xBF][\x80-\xBF]{2} # four-byte sequences   11110xxx 10xxxxxx * 3
		| [\xF1-\xF3][\x80-\xBF]{3}
		| \xF4[\x80-\x8F][\x80-\xBF]{2}
	)/x';

	// Start with 1 element instead of 0 since the first thing we do is pop.
	$chars = array( '' );
	do {
		// We had some string left over from the last round, but we counted it
		// in that last round.
		array_pop( $chars );

		// Split by UTF-8 character, limit to 1000 characters (last array
		// element will contain the rest of the string).
		$pieces = preg_split(
			$regex,
			$str,
			1000,
			PREG_SPLIT_DELIM_CAPTURE | PREG_SPLIT_NO_EMPTY
		);

		$chars = array_merge( $chars, $pieces );

		// If there's anything left over, repeat the loop.
		if ( count( $pieces ) > 1 ) {
			$str = array_pop( $pieces );
		} else {
			break;
		}
	} while ( $str );

	return $chars;
}

/**
 * Shims fix for apiRequest on sites configured to use plain permalinks.
 *
 * @see https://core.trac.wordpress.org/ticket/42382
 *
 * @param WP_Scripts $scripts WP_Scripts instance (passed by reference).
 */
function gutenberg_shim_fix_api_request_plain_permalinks( $scripts ) {
	$api_request_fix = <<<JS
( function( wp, wpApiSettings ) {
	var buildAjaxOptions;

	if ( 'string' !== typeof wpApiSettings.root ||
			-1 === wpApiSettings.root.indexOf( '?' ) ) {
		return;
	}

	buildAjaxOptions = wp.apiRequest.buildAjaxOptions;

	wp.apiRequest.buildAjaxOptions = function( options ) {
		if ( 'string' === typeof options.path ) {
			options.path = options.path.replace( '?', '&' );
		}

		return buildAjaxOptions.call( wp.apiRequest, options );
	};
} )( window.wp, window.wpApiSettings );
JS;

	$scripts->add_inline_script( 'wp-api-request', $api_request_fix, 'after' );
}
add_action( 'wp_default_scripts', 'gutenberg_shim_fix_api_request_plain_permalinks' );

/**
 * Shims support for emulating HTTP/1.0 requests in wp.apiRequest
 *
 * @see https://core.trac.wordpress.org/ticket/43605
 *
 * @param WP_Scripts $scripts WP_Scripts instance (passed by reference).
 */
function gutenberg_shim_api_request_emulate_http( $scripts ) {
	$api_request_fix = <<<JS
( function( wp ) {
	var oldApiRequest = wp.apiRequest;
	wp.apiRequest = function ( options ) {
		if ( options.method ) {
			if ( [ 'PATCH', 'PUT', 'DELETE' ].indexOf( options.method.toUpperCase() ) >= 0 ) {
				if ( ! options.headers ) {
					options.headers = {};
				}
				options.headers['X-HTTP-Method-Override'] = options.method;
				options.method = 'POST';
			}
		}

		return oldApiRequest( options );
	}
} )( window.wp );
JS;

	$scripts->add_inline_script( 'wp-api-request', $api_request_fix, 'after' );
}
add_action( 'wp_default_scripts', 'gutenberg_shim_api_request_emulate_http' );

/**
 * Disables wpautop behavior in classic editor when post contains blocks, to
 * prevent removep from invalidating paragraph blocks.
 *
 * @param  array $settings Original editor settings.
 * @return array           Filtered settings.
 */
function gutenberg_disable_editor_settings_wpautop( $settings ) {
	$post = get_post();
	if ( is_object( $post ) && gutenberg_post_has_blocks( $post ) ) {
		$settings['wpautop'] = false;
	}

	return $settings;
}
add_filter( 'wp_editor_settings', 'gutenberg_disable_editor_settings_wpautop' );

/**
 * Add rest nonce to the heartbeat response.
 *
 * @param  array $response Original heartbeat response.
 * @return array           New heartbeat response.
 */
function gutenberg_add_rest_nonce_to_heartbeat_response_headers( $response ) {
	$response['rest-nonce'] = wp_create_nonce( 'wp_rest' );
	return $response;
}

add_filter( 'wp_refresh_nonces', 'gutenberg_add_rest_nonce_to_heartbeat_response_headers' );

/**
 * Ensure that the wp-json index contains the `permalink_structure` setting as
 * part of its site info elements.
 *
 * @see https://core.trac.wordpress.org/ticket/42465
 *
 * @param WP_REST_Response $response WP REST API response of the wp-json index.
 * @return WP_REST_Response Response that contains the permalink structure.
 */
function gutenberg_ensure_wp_json_has_permalink_structure( $response ) {
	$site_info = $response->get_data();

	if ( ! array_key_exists( 'permalink_structure', $site_info ) ) {
		$site_info['permalink_structure'] = get_option( 'permalink_structure' );
	}

	$response->set_data( $site_info );

	return $response;
}
add_filter( 'rest_index', 'gutenberg_ensure_wp_json_has_permalink_structure' );

/**
 * As a substitute for the default content `wpautop` filter, applies autop
 * behavior only for posts where content does not contain blocks.
 *
 * @param  string $content Post content.
 * @return string          Paragraph-converted text if non-block content.
 */
function gutenberg_wpautop( $content ) {
	if ( gutenberg_content_has_blocks( $content ) ) {
		return $content;
	}

	return wpautop( $content );
}
remove_filter( 'the_content', 'wpautop' );
add_filter( 'the_content', 'gutenberg_wpautop', 8 );

/**
 * Includes the value for the custom field `post_type_capabities` inside the REST API response of user.
 *
 * TODO: This is a temporary solution. Next step would be to edit the WP_REST_Users_Controller,
 * once merged into Core.
 *
 * @since ?
 *
 * @param array           $user An array containing user properties.
 * @param string          $name The name of the custom field.
 * @param WP_REST_Request $request Full details about the REST API request.
 * @return object The Post Type capabilities.
 */
function gutenberg_get_post_type_capabilities( $user, $name, $request ) {
	$post_type = $request->get_param( 'post_type' );
	$value     = new stdClass;

	if ( ! empty( $user['id'] ) && $post_type && post_type_exists( $post_type ) ) {
		// The Post Type object contains the Post Type's specific caps.
		$post_type_object = get_post_type_object( $post_type );

		// Loop in the Post Type's caps to validate the User's caps for it.
		foreach ( $post_type_object->cap as $post_cap => $post_type_cap ) {
			// Ignore caps requiring a post ID.
			if ( in_array( $post_cap, array( 'edit_post', 'read_post', 'delete_post' ) ) ) {
				continue;
			}

			// Set the User's post type capability.
			$value->{$post_cap} = user_can( $user['id'], $post_type_cap );
		}
	}

	return $value;
}

/**
 * Adds the custom field `post_type_capabities` to the REST API response of user.
 *
 * TODO: This is a temporary solution. Next step would be to edit the WP_REST_Users_Controller,
 * once merged into Core.
 *
 * @since ?
 */
function gutenberg_register_rest_api_post_type_capabilities() {
	register_rest_field( 'user',
		'post_type_capabilities',
		array(
			'get_callback' => 'gutenberg_get_post_type_capabilities',
			'schema'       => array(
				'description' => __( 'Post Type capabilities for the user.', 'gutenberg' ),
				'type'        => 'object',
				'context'     => array( 'edit' ),
				'readonly'    => true,
			),
		)
	);
}
add_action( 'rest_api_init', 'gutenberg_register_rest_api_post_type_capabilities' );

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

			if ( ! $data ) {
				// Not a local post, return the original error.
				return $response;
			}
			$response = (object) $data;
		}

		// Make sure the HTML is run through the oembed sanitisation routines.
		$response->html = wp_oembed_get( $_GET['url'], $_GET );
	}

	return $response;
}
add_filter( 'rest_request_after_callbacks', 'gutenberg_filter_oembed_result', 10, 3 );
