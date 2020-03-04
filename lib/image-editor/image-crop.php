<?php

class Image_Editor_Crop extends Image_Editor_Modifier {
	private $crop_x = 0;
	private $crop_y = 0;
	private $width = 0;
	private $height = 0;

	public function __construct( $crop_x, $crop_y, $width, $height ) {
		$this->crop_x = floatval( $crop_x );
		$this->crop_y = floatval( $crop_y );
		$this->width = floatval( $width );
		$this->height = floatval( $height );
	}

	public function apply_to_meta( array $meta ) {
		$meta['cropX'] = $this->crop_x;
		$meta['cropY'] = $this->crop_y;
		$meta['cropWidth'] = $this->width;
		$meta['cropHeight'] = $this->height;

		return $meta;
	}

	public function apply_to_image( $image, array $info, $target_file ) {
		$size = $image->get_size();

		$crop_x = round( ( $size['width'] * $this->crop_x ) / 100.0 );
		$crop_y = round( ( $size['height'] * $this->crop_y ) / 100.0 );
		$width = round( ( $size['width'] * $this->width ) / 100.0 );
		$height = round( ( $size['height'] * $this->height ) / 100.0 );

		$image->crop( $crop_x, $crop_y, $width, $height );

		// We need to change the original name to include the crop. This way if it's cropped again we won't clash
		$info['meta']['original_name'] = $target_file;

		return $info;
	}

	public static function get_filename( array $meta ) {
		if ( isset( $meta['cropWidth'] ) && $meta['cropWidth'] > 0 ) {
			return sprintf( 'crop-%d-%d-%d-%d', round( $meta['cropX'], 2 ), round( $meta['cropY'], 2 ), round( $meta['cropWidth'], 2 ), round( $meta['cropHeight'], 2 ) );
		}

		return false;
	}

	public static function get_default_meta() {
		return [];
	}
}
