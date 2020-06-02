<?php
/**
 * Start: Include for phase 2
 * Image Editor: Image_Editor_Flip class
 *
 * @package gutenberg
 * @since 7.x ?
 */

/**
 * Flip/mirror image modifier.
 */
class Image_Editor_Flip extends Image_Editor_Modifier {
	/**
	 * Direction to flip.
	 *
	 * @var string
	 */
	private $direction = 'vertical';

	/**
	 * Constructor.
	 *
	 * Will populate object properties from the provided arguments.
	 *
	 * @param string $direction 'vertical' or 'horizontal'.
	 */
	public function __construct( $direction ) {
		$this->direction = 'vertical';

		if ( 'horizontal' === $direction ) {
			$this->direction = $direction;
		}
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
		if ( $this->is_vertical() ) {
			$meta['flipv'] = ! $meta['flipv'];
		} elseif ( $this->is_horizontal() ) {
			$meta['flipH'] = ! $meta['flipH'];
		}

		return $meta;
	}

	/**
	 * Apply the modifier to the image
	 *
	 * @access public
	 *
	 * @param WP_Image_Editor $image Image editor.
	 * @return bool|WP_Error True on success, WP_Error object or false on failure.
	 */
	public function apply_to_image( $image ) {
		return $image->flip( $this->is_vertical(), $this->is_horizontal() );
	}

	/**
	 * Checks if the modifier is a vertical flip
	 *
	 * @access private
	 *
	 * @return boolean true if the modifier is vertical
	 */
	private function is_vertical() {
		return 'vertical' === $this->direction;
	}

	/**
	 * Checks if the modifier is a horizontal flip
	 *
	 * @access private
	 *
	 * @return boolean true if the modifier is horizontal
	 */
	private function is_horizontal() {
		return 'horizontal' === $this->direction;
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
		$parts = array();

		if ( $meta['flipH'] ) {
			$parts[] = 'fliph';
		}

		if ( $meta['flipv'] ) {
			$parts[] = 'flipv';
		}

		if ( count( $parts ) > 0 ) {
			return implode( '-', $parts );
		}

		return false;
	}

	/**
	 * Gets the default metadata for the flip modifier.
	 *
	 * @access public
	 *
	 * @return array Default metadata.
	 */
	public static function get_default_meta() {
		return array(
			'flipH' => false,
			'flipv' => false,
		);
	}
}
