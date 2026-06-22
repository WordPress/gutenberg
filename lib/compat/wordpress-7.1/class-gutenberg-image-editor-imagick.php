<?php
/**
 * Gutenberg Imagick image editor.
 *
 * @package gutenberg
 */

/**
 * Extends the Core Imagick image editor with MVP mask support.
 */
class Gutenberg_Image_Editor_Imagick extends WP_Image_Editor_Imagick {
	/**
	 * Checks to see if the current environment supports Imagick and requested methods.
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
				class_exists( 'ImagickDraw', false ) &&
				( defined( 'Imagick::ALPHACHANNEL_SET' ) || defined( 'Imagick::ALPHACHANNEL_ACTIVATE' ) ) &&
				defined( 'Imagick::COMPOSITE_DSTIN' ) &&
				method_exists( 'ImagickDraw', 'ellipse' ) &&
				method_exists( 'ImagickDraw', 'setFillColor' ) &&
				method_exists( 'Imagick', 'compositeImage' ) &&
				method_exists( 'Imagick', 'drawImage' ) &&
				method_exists( 'Imagick', 'getImageGeometry' ) &&
				method_exists( 'Imagick', 'newImage' ) &&
				method_exists( 'Imagick', 'setImageAlphaChannel' ) &&
				method_exists( 'Imagick', 'setImageFormat' )
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
		$args = Gutenberg_Image_Editor_Mask::validate_args( $args );
		if ( is_wp_error( $args ) ) {
			return $args;
		}

		if ( 'circle' !== $args['shape'] ) {
			return new WP_Error(
				'image_mask_unsupported',
				__( 'Unsupported image mask.', 'gutenberg' )
			);
		}

		try {
			if ( defined( 'Imagick::ALPHACHANNEL_SET' ) ) {
				$this->image->setImageAlphaChannel( Imagick::ALPHACHANNEL_SET );
			} elseif ( defined( 'Imagick::ALPHACHANNEL_ACTIVATE' ) ) {
				$this->image->setImageAlphaChannel( Imagick::ALPHACHANNEL_ACTIVATE );
			}

			$geometry = $this->image->getImageGeometry();
			$width    = (int) $geometry['width'];
			$height   = (int) $geometry['height'];

			$mask = new Imagick();
			$mask->newImage( $width, $height, new ImagickPixel( 'transparent' ), 'png' );

			$draw = new ImagickDraw();
			$draw->setFillColor( new ImagickPixel( 'white' ) );
			$draw->ellipse(
				( $width - 1 ) / 2,
				( $height - 1 ) / 2,
				min( $width, $height ) / 2,
				min( $width, $height ) / 2,
				0,
				360
			);
			$mask->drawImage( $draw );

			$this->image->compositeImage( $mask, Imagick::COMPOSITE_DSTIN, 0, 0 );
			$this->image->setImageFormat( 'PNG' );
			$this->mime_type = 'image/png';

			$mask->clear();
			$mask->destroy();
		} catch ( Exception $e ) {
			return new WP_Error(
				'image_mask_error',
				$e->getMessage(),
				$this->file
			);
		}

		return true;
	}
}
