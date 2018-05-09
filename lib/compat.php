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
 * Shims fix for apiRequest on sites configured to use plain permalinks and add Preloading support.
 *
 * @see https://core.trac.wordpress.org/ticket/42382
 *
 * @param WP_Scripts $scripts WP_Scripts instance (passed by reference).
 */
function gutenberg_shim_api_request( $scripts ) {
	$api_request_fix = <<<JS
( function( wp, wpApiSettings ) {

	// Fix plain permalinks sites
	var buildAjaxOptions;
	if ( 'string' === typeof wpApiSettings.root && -1 !== wpApiSettings.root.indexOf( '?' ) ) {
		buildAjaxOptions = wp.apiRequest.buildAjaxOptions;
		wp.apiRequest.buildAjaxOptions = function( options ) {
			if ( 'string' === typeof options.path ) {
				options.path = options.path.replace( '?', '&' );
			}

			return buildAjaxOptions.call( wp.apiRequest, options );
		};
	}

	function getStablePath( path ) {
		var splitted = path.split( '?' );
		var query = splitted[ 1 ];
		var base = splitted[ 0 ];
		if ( ! query ) {
			return base;
		}

		// 'b=1&c=2&a=5'
		return base + '?' + query
			// [ 'b=1', 'c=2', 'a=5' ]
			.split( '&' )
			// [ [ 'b, '1' ], [ 'c', '2' ], [ 'a', '5' ] ]
			.map( function ( entry ) {
				return entry.split( '=' );
			 } )
			// [ [ 'a', '5' ], [ 'b, '1' ], [ 'c', '2' ] ]
			.sort( function ( a, b ) {
				return a[ 0 ].localeCompare( b[ 0 ] );
			 } )
			// [ 'a=5', 'b=1', 'c=2' ]
			.map( function ( pair ) {
				return pair.join( '=' );
			 } )
			// 'a=5&b=1&c=2'
			.join( '&' );
	};

	// Add preloading support
	var previousApiRequest = wp.apiRequest;
	wp.apiRequest = function( request ) {
		var method, path;

		if ( typeof request.path === 'string' && window._wpAPIDataPreload ) {
			method = request.method || 'GET';
			path = getStablePath( request.path );

			if ( 'GET' === method && window._wpAPIDataPreload[ path ] ) {
				var deferred = jQuery.Deferred();
				deferred.resolve( window._wpAPIDataPreload[ path ].body );
				return deferred.promise();
			}
		}

		return previousApiRequest.call( previousApiRequest, request );
	}
	for ( var name in previousApiRequest ) {
		if ( previousApiRequest.hasOwnProperty( name ) ) {
			wp.apiRequest[ name ] = previousApiRequest[ name ];
		}
	}

} )( window.wp, window.wpApiSettings );
JS;

	$scripts->add_inline_script( 'wp-api-request', $api_request_fix, 'after' );
}
add_action( 'wp_default_scripts', 'gutenberg_shim_api_request' );

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

				options.contentType = 'application/json';
				options.data = JSON.stringify( options.data );
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
