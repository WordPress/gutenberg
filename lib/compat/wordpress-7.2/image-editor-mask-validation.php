<?php
/**
 * Image editor mask validation.
 *
 * @package gutenberg
 */

/**
 * Validates and normalizes mask arguments.
 *
 * @access private
 *
 * @param array $args Mask arguments.
 * @return array|WP_Error Normalized arguments on success, WP_Error on failure.
 */
function _gutenberg_validate_image_mask_args( $args ) {
	if ( ! is_array( $args ) || 'circle' !== ( $args['shape'] ?? null ) ) {
		return new WP_Error(
			'image_mask_unsupported',
			__( 'Unsupported image mask.', 'gutenberg' )
		);
	}

	return array(
		'shape' => 'circle',
	);
}
