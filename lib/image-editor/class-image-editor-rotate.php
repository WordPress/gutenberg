<?php

class Image_Editor_Rotate extends Image_Editor_Modifier {
	private $angle = 0;

	public function __construct( $angle ) {
		$this->angle = $this->restrict_angle( intval( $angle, 10 ) );
	}

	public function apply_to_meta( $meta ) {
		$meta['rotate'] += $this->angle;
		$meta['rotate'] = $this->restrict_angle( $meta['rotate'] );

		return $meta;
	}

	public function apply_to_image( $image, array $info, $target_file ) {
		$image->rotate( 0 - $this->angle );

		return $info;
	}

	private function restrict_angle( $angle ) {
		if ( $angle >= 360 ) {
			$angle = $angle % 360;
		} elseif ( $angle < 0 ) {
			$angle = 360 - ( abs( $angle ) % 360 );
		}

		return $angle;
	}

	public static function get_filename( array $meta ) {
		if ( $meta['rotate'] > 0 ) {
			return 'rotate-' . intval( $meta['rotate'], 10 );
		}

		return false;
	}

	public static function get_default_meta() {
		return array( 'rotate' => 0 );
	}
}
