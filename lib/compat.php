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

/**
 * Add `srcset` to the image meta `sizes` array in the REST API response.
 *
 * @param WP_REST_Response $response Response object.
 * @param WP_Post $attachment Attachment post object.
 * @return WP_REST_Response Response object.
 */
function gutenberg_rest_prepare_attachment( $response, $attachment ) {
	if ( $response->data['media_type'] === 'image' && ! empty( $response->data['media_details']['sizes'] ) ) {
		$meta = wp_get_attachment_metadata( $attachment->ID );
		$sizes = $response->data['media_details']['sizes'];

		foreach ( $sizes as $size_name => $size ) {
			$srcset = wp_calculate_image_srcset( array( $size['width'], $size['height'] ), $size['source_url'], $meta, $attachment->ID );

			if ( $srcset ) {
				$sizes[ $size_name ]['srcset'] = $srcset;
			}
		}

		$response->data['media_details']['sizes'] = $sizes;
	}

	return $response;
}
add_filter( 'rest_prepare_attachment', 'gutenberg_rest_prepare_attachment', 10, 2 );

/**
 * Add `srcset` to the prepared attachment data for the Media Library.
 *
 * @param array   $response   Array of prepared attachment data.
 * @param WP_Post $attachment Attachment object.
 * @param array   $meta       Array of attachment meta data.
 * @return array Array of prepared attachment data.
 */
function gutenberg_prepare_attachment_for_js( $response, $attachment, $meta ) {
	if ( ! empty( $response['type'] ) && $response['type'] === 'image' && ! empty( $response['sizes'] ) ) {
		foreach ( $response['sizes'] as $size_name => $size ) {
			$srcset = wp_calculate_image_srcset( array( $size['width'], $size['height'] ), $size['url'], $meta, $attachment->ID );

			if ( $srcset ) {
				$response['sizes'][ $size_name ]['srcset'] = $srcset;
			}
		}
	}

	return $response;
}
add_filter( 'wp_prepare_attachment_for_js', 'gutenberg_prepare_attachment_for_js', 10, 3 );
