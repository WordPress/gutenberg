<?php
/**
 * Image Editor: Image_Editor_Crop class
 *
 * @package gutenberg
 * @since 7.x ?
 */

/**
 * Crop image modifier.
 */
class Image_Editor_Crop extends Image_Editor_Modifier {
	/**
	 * Pixels from the left for the crop.
	 *
	 * @var integer
	 */
	private $crop_x = 0;

	/**
	 * Pixels from the top for the crop.
	 *
	 * @var integer
	 */
	private $crop_y = 0;

	/**
	 * Width in pixels for the crop.
	 *
	 * @var integer
	 */
	private $width = 0;

	/**
	 * Height in pixels for the crop.
	 *
	 * @var integer
	 */
	private $height = 0;

	/**
	 * Constructor.
	 *
	 * Will populate object properties from the provided arguments.
	 *
	 * @param integer $crop_x Pixels from the left for the crop.
	 * @param integer $crop_y Pixels from the top for the crop.
	 * @param integer $width  Width in pixels for the crop.
	 * @param integer $height Height in pixels for the crop.
	 */
	public function __construct( $crop_x, $crop_y, $width, $height ) {
		$this->crop_x = floatval( $crop_x );
		$this->crop_y = floatval( $crop_y );
		$this->width  = floatval( $width );
		$this->height = floatval( $height );
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
		$meta['cropX']      = $this->crop_x;
		$meta['cropY']      = $this->crop_y;
		$meta['cropWidth']  = $this->width;
		$meta['cropHeight'] = $this->height;

		return $meta;
	}

	/**
	 * Apply the modifier to the image
	 *
	 * @access public
	 *
	 * @param WP_Image_Editor $image Image editor.
	 * @param array           $info Metadata for the image.
	 * @param string          $target_file File name to save the edited image as.
	 * @return array Metadata for the image.
	 */
	public function apply_to_image( $image, $info, $target_file ) {
		$size = $image->get_size();

		$crop_x = round( ( $size['width'] * $this->crop_x ) / 100.0 );
		$crop_y = round( ( $size['height'] * $this->crop_y ) / 100.0 );
		$width  = round( ( $size['width'] * $this->width ) / 100.0 );
		$height = round( ( $size['height'] * $this->height ) / 100.0 );

		$image->crop( $crop_x, $crop_y, $width, $height );

		// We need to change the original name to include the crop. This way if it's cropped again we won't clash.
		$info['meta']['original_name'] = $target_file;

		return $info;
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
		if ( isset( $meta['cropWidth'] ) && $meta['cropWidth'] > 0 ) {
			return sprintf( 'crop-%d-%d-%d-%d', round( $meta['cropX'], 2 ), round( $meta['cropY'], 2 ), round( $meta['cropWidth'], 2 ), round( $meta['cropHeight'], 2 ) );
		}

		return false;
	}

	/**
	 * Gets the default metadata for the crop modifier.
	 *
	 * @access public
	 *
	 * @return array Default metadata.
	 */
	public static function get_default_meta() {
		return array();
	}
}
