<?php
/**
 * Compatibility shims for media for WordPress 7.3.
 *
 * @package gutenberg
 */

/**
 * Encodes spaces in attachment URLs returned by the REST API.
 *
 * The media modal (wp_prepare_attachment_for_js()) encodes spaces in attachment
 * URLs as %20, while the REST API returns them as is. Encoding them here lets
 * a URL from the media modal be compared with the REST API's size URLs.
 *
 * @see https://github.com/WordPress/gutenberg/issues/86388
 * @see https://core.trac.wordpress.org/ticket/66531
 *
 * @param WP_REST_Response $response The response object.
 * @return WP_REST_Response The filtered response object.
 */
function gutenberg_encode_attachment_source_urls( $response ) {
	$data = $response->get_data();

	if ( ! empty( $data['source_url'] ) && is_string( $data['source_url'] ) ) {
		$data['source_url'] = str_replace( ' ', '%20', $data['source_url'] );
	}

	// Core sets media_details, and media_details.sizes, to an empty object when there are none.
	if (
		isset( $data['media_details'] ) &&
		is_array( $data['media_details'] ) &&
		! empty( $data['media_details']['sizes'] ) &&
		is_array( $data['media_details']['sizes'] )
	) {
		foreach ( $data['media_details']['sizes'] as $size => $size_data ) {
			if ( ! empty( $size_data['source_url'] ) && is_string( $size_data['source_url'] ) ) {
				$data['media_details']['sizes'][ $size ]['source_url'] = str_replace( ' ', '%20', $size_data['source_url'] );
			}
		}
	}

	$response->set_data( $data );

	return $response;
}
add_filter( 'rest_prepare_attachment', 'gutenberg_encode_attachment_source_urls' );
