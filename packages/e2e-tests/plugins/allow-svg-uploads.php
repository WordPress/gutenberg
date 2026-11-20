<?php
/**
 * Plugin Name: Gutenberg Test Allow SVG Uploads
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-allow-svg-uploads
 */

add_filter(
	'upload_mimes',
	static function ( $mimes ) {
		$mimes['svg'] = 'image/svg+xml';
		return $mimes;
	}
);

/*
 * Core treats SVGs as images, so the REST API reads their width and height
 * from the attachment metadata. Store them from the SVG's viewBox.
 */
add_filter(
	'wp_generate_attachment_metadata',
	static function ( $metadata, $attachment_id ) {
		if ( 'image/svg+xml' !== get_post_mime_type( $attachment_id ) ) {
			return $metadata;
		}
		$svg                        = simplexml_load_file( get_attached_file( $attachment_id ) );
		list( , , $width, $height ) = explode( ' ', (string) $svg['viewBox'] );
		$metadata['width']          = (int) $width;
		$metadata['height']         = (int) $height;
		return $metadata;
	},
	10,
	2
);
