<?php
/**
 * Image editor mask support.
 *
 * @package gutenberg
 */

/**
 * Registers Gutenberg image editors that include MVP mask support.
 *
 * @param string[] $editors Image editor class names.
 * @return string[] Filtered image editor class names.
 */
function gutenberg_register_mask_image_editors( $editors ) {
	require_once __DIR__ . '/image-editor-mask-validation.php';

	$mask_editors = array();

	if ( class_exists( 'WP_Image_Editor_Imagick' ) ) {
		require_once __DIR__ . '/class-gutenberg-image-editor-imagick.php';
		$mask_editors[] = 'Gutenberg_Image_Editor_Imagick';
	}

	if ( class_exists( 'WP_Image_Editor_GD' ) ) {
		require_once __DIR__ . '/class-gutenberg-image-editor-gd.php';
		$mask_editors[] = 'Gutenberg_Image_Editor_GD';
	}

	return array_values( array_unique( array_merge( $mask_editors, $editors ) ) );
}
add_filter( 'wp_image_editors', 'gutenberg_register_mask_image_editors' );
