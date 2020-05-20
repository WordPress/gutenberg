<?php
/**
 * Image Editor: Image_Editor_Rotate class
 *
 * @package gutenberg
 * @since 7.x ?
 */

/**
 * Rotate image modifier.
 */
class Image_Editor_Rotate extends Image_Editor_Modifier {

	/**
	 * Angle to rotate by.
	 *
	 * @var integer
	 */
	private $angle = 0;

	/**
	 * Constructor.
	 *
	 * Will populate object properties from the provided arguments.
	 *
	 * @param float $angle Angle to rotate by.
	 */
	public function __construct( $angle ) {
		$this->angle = $this->restrict_angle( intval( $angle, 10 ) );
	}

	/**
	 * Update the image metadata with the modifier.
	 *
	 * @access public
	 *
	 * @param array $meta Metadata to update.
	 * @return array Updated metadata.
	 */
	public function apply_to_meta( $meta ) {
		$meta['rotate'] += $this->angle;
		$meta['rotate']  = $this->restrict_angle( $meta['rotate'] );

		return $meta;
	}

	/**
	 * Apply the rotate modifier to the image
	 *
	 * @access public
	 *
	 * @param WP_Image_Editor $image Image editor.
	 * @param array           $info Metadata for the image.
	 * @param string          $target_file File name to save the edited image as.
	 * @return array Metadata for the image.
	 */
	public function apply_to_image( $image, $info, $target_file ) {
		$image->rotate( 0 - $this->angle );

		return $info;
	}

	/**
	 * Puts the angle in the range [ 0, 360 ).
	 *
	 * @access private
	 *
	 * @param integer $angle Angle to restrict.
	 * @return integer Restricted angle.
	 */
	private function restrict_angle( $angle ) {
		if ( $angle >= 360 ) {
			$angle = $angle % 360;
		} elseif ( $angle < 0 ) {
			$angle = 360 - ( abs( $angle ) % 360 );
		}

		return $angle;
	}

	/**
	 * Gets the new filename based on metadata.
	 *
	 * @access public
	 *
	 * @param array $meta Image metadata.
	 * @return string Filename for the edited image.
	 */
	public static function get_filename( $meta ) {
		if ( $meta['rotate'] > 0 ) {
			return 'rotate-' . intval( $meta['rotate'], 10 );
		}

		return false;
	}

	/**
	 * Gets the default metadata for the rotate modifier.
	 *
	 * @access public
	 *
	 * @return array Default metadata.
	 */
	public static function get_default_meta() {
		return array( 'rotate' => 0 );
	}
}
