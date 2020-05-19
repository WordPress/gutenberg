<?php

class Image_Editor_Flip extends Image_Editor_Modifier {
	private $direction = 'vertical';

	public function __construct( $direction ) {
		$this->direction = 'vertical';

		if ( $direction === 'horizontal' ) {
			$this->direction = $direction;
		}
	}

	public function apply_to_meta( $meta ) {
		if ( $this->is_vertical() ) {
			$meta['flipv'] = ! $meta['flipv'];
		} elseif ( $this->is_horizontal() ) {
			$meta['flipH'] = ! $meta['flipH'];
		}

		return $meta;
	}

	public function apply_to_image( $image, array $info, $target_file ) {
		$image->flip( $this->is_vertical(), $this->is_horizontal() );

		return $info;
	}

	private function is_vertical() {
		return $this->direction === 'vertical';
	}

	private function is_horizontal() {
		return $this->direction === 'horizontal';
	}

	public static function get_filename( array $meta ) {
		$parts = [];

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

	public static function get_default_meta() {
		return [
			'flipH' => false,
			'flipv' => false,
		];
	}
}
