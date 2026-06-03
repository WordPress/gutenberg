<?php
/**
 * Plugin Name: Lightbox EXIF Metadata
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-lightbox-exif-metadata
 */

/**
 * Injects predictable EXIF metadata into attachment metadata so the image
 * lightbox's metadata panel can be exercised on the front end, without
 * depending on a binary fixture that carries real EXIF data.
 *
 * @param array|false $data Attachment metadata, or false if none.
 * @return array|false Filtered metadata.
 */
function gutenberg_test_lightbox_exif_metadata( $data ) {
	if ( ! is_array( $data ) ) {
		return $data;
	}

	$data['image_meta'] = array(
		'camera'        => 'Test Camera',
		'aperture'      => '2.8',
		'shutter_speed' => '0.004',
		'focal_length'  => '23',
		'copyright'     => 'Test Photographer',
	);

	return $data;
}
add_filter( 'wp_get_attachment_metadata', 'gutenberg_test_lightbox_exif_metadata' );
