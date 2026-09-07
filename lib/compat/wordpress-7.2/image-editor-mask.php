<?php
/**
 * Image editor mask support.
 *
 * @package gutenberg
 */

/**
 * Registers Gutenberg image editors that include MVP mask support.
 *
 * This is not registered on `wp_image_editors` globally. The attachment
 * controller adds it as a filter only around the editor selection for a mask
 * request and removes it immediately after, so the site's default image editor
 * is left untouched for all other image operations.
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
