<?php
/**
 * Tests for Fonts Library class
 *
 * @package    Gutenberg
 * @subpackage Fonts Library
 */

/**
 * @coversDefaultClass WP_Fonts_Library
 */
class WP_Fonts_Library_Test extends WP_UnitTestCase {

	/**
	 * @covers ::get_fonts_dir
	 */
	public function test_get_fonts_dir() {
		$this->assertStringEndsWith( '/wp-content/uploads/fonts', WP_Fonts_Library::get_fonts_dir() );
	}

	/**
	 * @covers ::set_upload_dir
	 *
	 * @dataProvider data_set_upload_dir
	 *
	 * @param array $defaults Default upload directory data.
	 * @param array $expected Modified upload directory data.
	 */
	public function test_set_upload_dir( $defaults, $expected ) {
		$this->assertSame( $expected, WP_Fonts_Library::set_upload_dir( $defaults ) );
	}

	public function data_set_upload_dir() {
		return array(
			'fonts_subdir' => array(
				'defaults' => array(
					'subdir'  => '/abc',
					'basedir' => '/var/www/html/wp-content/uploads',
					'baseurl' => 'http://example.com/wp-content/uploads',
				),
				'expected' => array(
					'subdir'  => '/fonts',
					'basedir' => '/var/www/html/wp-content/uploads',
					'baseurl' => 'http://example.com/wp-content/uploads',
					'path'    => '/var/www/html/wp-content/uploads/fonts',
					'url'     => 'http://example.com/wp-content/uploads/fonts',
				),
			),
		);
	}

}
