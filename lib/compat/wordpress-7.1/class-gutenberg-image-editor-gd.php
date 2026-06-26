<?php
/**
 * Gutenberg GD image editor.
 *
 * @package gutenberg
 */

/**
 * Extends the Core GD image editor with MVP mask support.
 */
class Gutenberg_Image_Editor_GD extends WP_Image_Editor_GD {
	/**
	 * Checks to see if the current environment supports GD and requested methods.
	 *
	 * @param array $args Test arguments.
	 * @return bool Whether this editor is supported.
	 */
	public static function test( $args = array() ) {
		if ( ! parent::test( $args ) ) {
			return false;
		}

		if ( isset( $args['methods'] ) && in_array( 'mask', $args['methods'], true ) ) {
			return (
				function_exists( 'imagealphablending' ) &&
				function_exists( 'imagecolorallocatealpha' ) &&
				function_exists( 'imagecreatetruecolor' ) &&
				function_exists( 'imagepng' ) &&
				function_exists( 'imagesavealpha' ) &&
				function_exists( 'imagesetpixel' )
			);
		}

		return true;
	}

	/**
	 * Applies an image mask.
	 *
	 * @param array $args Mask arguments.
	 * @return true|WP_Error True on success, WP_Error on failure.
	 */
	public function mask( $args ) {
		$args = _gutenberg_validate_image_mask_args( $args );
		if ( is_wp_error( $args ) ) {
			return $args;
		}

		if ( 'circle' !== $args['shape'] ) {
			return new WP_Error(
				'image_mask_unsupported',
				__( 'Unsupported image mask.', 'gutenberg' )
			);
		}

		if ( function_exists( 'imagepalettetotruecolor' ) ) {
			imagepalettetotruecolor( $this->image );
		}

		imagealphablending( $this->image, false );
		imagesavealpha( $this->image, true );

		$width          = imagesx( $this->image );
		$height         = imagesy( $this->image );
		$transparent    = imagecolorallocatealpha( $this->image, 0, 0, 0, 127 );
		$center_x       = ( $width - 1 ) / 2;
		$center_y       = ( $height - 1 ) / 2;
		$radius         = min( $width, $height ) / 2;
		$radius_squared = $radius * $radius;

		for ( $y = 0; $y < $height; $y++ ) {
			for ( $x = 0; $x < $width; $x++ ) {
				$dx = $x - $center_x;
				$dy = $y - $center_y;

				if ( ( $dx * $dx ) + ( $dy * $dy ) > $radius_squared ) {
					imagesetpixel( $this->image, $x, $y, $transparent );
				}
			}
		}

		$this->mime_type = 'image/png';

		return true;
	}
}
