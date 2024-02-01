<?php
/**
 * Test wp_get_font_dir().
 *
 * @package WordPress
 * @subpackage Font Library
 *
 * @group fonts
 * @group font-library
 *
 * @covers ::wp_get_font_dir
 */
class Tests_Fonts_WpFontDir extends WP_UnitTestCase {
	private static $dir_defaults;

	public static function set_up_before_class() {
		parent::set_up_before_class();

		static::$dir_defaults = array(
			'path'    => path_join( WP_CONTENT_DIR, 'fonts' ),
			'url'     => content_url( 'fonts' ),
			'subdir'  => '',
			'basedir' => path_join( WP_CONTENT_DIR, 'fonts' ),
			'baseurl' => content_url( 'fonts' ),
			'error'   => false,
		);
	}

	public function test_fonts_dir() {
		$font_dir = wp_get_font_dir();

		$this->assertSame( $font_dir, static::$dir_defaults );
	}

	public function test_fonts_dir_with_filter() {
		// Define a callback function to pass to the filter.
		function set_new_values( $defaults ) {
			$defaults['path']    = '/custom-path/fonts/my-custom-subdir';
			$defaults['url']     = 'http://example.com/custom-path/fonts/my-custom-subdir';
			$defaults['subdir']  = 'my-custom-subdir';
			$defaults['basedir'] = '/custom-path/fonts';
			$defaults['baseurl'] = 'http://example.com/custom-path/fonts';
			$defaults['error']   = false;
			return $defaults;
		}

		// Add the filter.
		add_filter( 'font_dir', 'set_new_values' );

		// Gets the fonts dir.
		$font_dir = wp_get_font_dir();

		$expected = array(
			'path'    => '/custom-path/fonts/my-custom-subdir',
			'url'     => 'http://example.com/custom-path/fonts/my-custom-subdir',
			'subdir'  => 'my-custom-subdir',
			'basedir' => '/custom-path/fonts',
			'baseurl' => 'http://example.com/custom-path/fonts',
			'error'   => false,
		);

		// Remove the filter.
		remove_filter( 'font_dir', 'set_new_values' );

		$this->assertSame( $expected, $font_dir, 'The wp_get_font_dir() method should return the expected values.' );

		// Gets the fonts dir.
		$font_dir = wp_get_font_dir();

		$this->assertSame( static::$dir_defaults, $font_dir, 'The wp_get_font_dir() method should return the default values.' );
	}
}
