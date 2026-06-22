<?php
/**
 * Image editor mask validation.
 *
 * @package gutenberg
 */

/**
 * Minimal disposable helper for mask argument validation.
 */
class Gutenberg_Image_Editor_Mask {
	/**
	 * Validates and normalizes mask arguments.
	 *
	 * @param array $args Mask arguments.
	 * @return array|WP_Error Normalized arguments on success, WP_Error on failure.
	 */
	public static function validate_args( $args ) {
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
}
