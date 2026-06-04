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

/**
 * Enables the EXIF lightbox experiment while this test plugin is active, so the
 * feature (which is otherwise behind a flag) is rendered on the front end and
 * exposed in the editor.
 *
 * @param mixed $experiments The stored experiments option value.
 * @return array Experiments with the EXIF lightbox flag enabled.
 */
function gutenberg_test_enable_lightbox_exif_experiment( $experiments ) {
	if ( ! is_array( $experiments ) ) {
		$experiments = array();
	}
	$experiments['gutenberg-gallery-lightbox-default'] = 1;
	return $experiments;
}
add_filter( 'option_gutenberg-experiments', 'gutenberg_test_enable_lightbox_exif_experiment' );
add_filter( 'default_option_gutenberg-experiments', 'gutenberg_test_enable_lightbox_exif_experiment' );
