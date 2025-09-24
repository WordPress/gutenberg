<?php

if ( class_exists( 'WP_Image_Editor' ) ) :

	class WP_Image_Editor_Mock extends WP_Image_Editor {

		public static $load_return = true;
		public static $test_return = true;
		public static $save_return = array();
		public static $spy         = array();
		public static $edit_return = array();
		public static $size_return = null;

		// Allow testing of jpeg_quality filter.
		public function set_mime_type( $mime_type = null ) {
			$this->mime_type = $mime_type;
		}

		public function load() {
			return self::$load_return;
		}
		public static function test( $args = array() ) {
			return self::$test_return;
		}
		public static function supports_mime_type( $mime_type ) {
			return true;
		}
		public function resize( $max_w, $max_h, $crop = false ) {
			self::$spy[ __FUNCTION__ ][] = func_get_args();
			if ( isset( self::$edit_return[ __FUNCTION__ ] ) ) {
				return self::$edit_return[ __FUNCTION__ ];
			}
		}
		public function multi_resize( $sizes ) {
			self::$spy[ __FUNCTION__ ][] = func_get_args();
			if ( isset( self::$edit_return[ __FUNCTION__ ] ) ) {
				return self::$edit_return[ __FUNCTION__ ];
			}
		}
		public function crop( $src_x, $src_y, $src_w, $src_h, $dst_w = null, $dst_h = null, $src_abs = false ) {
			self::$spy[ __FUNCTION__ ][] = func_get_args();
			if ( isset( self::$edit_return[ __FUNCTION__ ] ) ) {
				return self::$edit_return[ __FUNCTION__ ];
			}
		}
		public function rotate( $angle ) {
			self::$spy[ __FUNCTION__ ][] = func_get_args();
			if ( isset( self::$edit_return[ __FUNCTION__ ] ) ) {
				return self::$edit_return[ __FUNCTION__ ];
			}
		}
		public function flip( $horz, $vert ) {
			self::$spy[ __FUNCTION__ ][] = func_get_args();
			if ( isset( self::$edit_return[ __FUNCTION__ ] ) ) {
				return self::$edit_return[ __FUNCTION__ ];
			}
		}
		public function save( $destfilename = null, $mime_type = null ) {
			// Set new mime-type and quality if converting the image.
			$this->get_output_format( $destfilename, $mime_type );
			return self::$save_return;
		}
		public function stream( $mime_type = null ) {
		}

		public function get_size() {
			if ( self::$size_return ) {
				return self::$size_return;
			}

			return parent::get_size();
		}
	}

endif;
