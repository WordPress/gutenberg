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
				function_exists( 'imagefilledrectangle' ) &&
				function_exists( 'imagepng' ) &&
				function_exists( 'imagesavealpha' )
			);
		}

		return true;
	}

	/**
	 * Applies an image mask.
	 *
	 * The mask introduces transparency, so the caller must save the result in
	 * an alpha-capable format (PNG, WebP, or AVIF). This method mutates the
	 * pixels only and leaves the output format to the caller, like the other
	 * editor transforms.
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

		/*
		 * Clear the pixels outside the inscribed circle one scanline at a time.
		 * For each row the circle spans the horizontal range
		 * [center_x - half, center_x + half]; everything outside that span is
		 * filled transparent with at most two rectangle fills. This keeps the
		 * cost at O(height) rectangle fills rather than O(width * height)
		 * per-pixel writes. `ceil()`/`floor()` preserve the same boundary as the
		 * `dx^2 + dy^2 <= radius^2` test, so a pixel exactly on the radius stays
		 * opaque and no seam appears at the rim.
		 */
		for ( $y = 0; $y < $height; $y++ ) {
			$dy     = $y - $center_y;
			$inside = $radius_squared - ( $dy * $dy );

			// Row lies entirely outside the circle.
			if ( $inside < 0 ) {
				imagefilledrectangle( $this->image, 0, $y, $width - 1, $y, $transparent );
				continue;
			}

			$half    = sqrt( $inside );
			$x_left  = (int) ceil( $center_x - $half );
			$x_right = (int) floor( $center_x + $half );

			if ( $x_left > 0 ) {
				imagefilledrectangle( $this->image, 0, $y, $x_left - 1, $y, $transparent );
			}
			if ( $x_right < $width - 1 ) {
				imagefilledrectangle( $this->image, $x_right + 1, $y, $width - 1, $y, $transparent );
			}
		}

		return true;
	}
}
