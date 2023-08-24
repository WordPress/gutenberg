<?php
/**
 * Test WP_Font_Family::uninstall().
 *
 * @package WordPress
 * @subpackage Font Library
 */

require_once __DIR__ . '/base.php';

/**
 * @group fonts
 * @group font-library
 *
 * @covers WP_Font_Family::uninstall
 */
class Tests_Fonts_WpFontFamily_Uninstall extends WP_Font_Family_UnitTestCase {

	public function test_should_return_error_when_font_not_found() {
		// Set up.
		$font = new WP_Font_Family( $this->merriweather['font_data'] );

		// Test.
		$actual = $font->uninstall();
		$this->assertWPError( $actual, 'WP_Error should have been returned' );
		$this->assertSame(
			array( 'font_family_not_found' => array( 'The font family could not be found.' ) ),
			$actual->errors,
			'WP_Error should have "fonts_must_have_same_slug" error'
		);
	}

	/**
	 * @dataProvider data_should_return_error_when_not_able_to_uninstall
	 *
	 * @param string $failure_to_mock The filter name to mock the failure.
	 */
	public function test_should_return_error_when_not_able_to_uninstall( $failure_to_mock ) {
		// Set up the font.
		add_filter( $failure_to_mock, '__return_empty_string' );
		$font = new WP_Font_Family( $this->merriweather['font_data'] );
		$font->install( $this->merriweather['files_data'] );

		// Test.
		$actual = $font->uninstall();
		$this->assertWPError( $actual, 'WP_Error should be returned' );
		$this->assertSame(
			array( 'font_family_not_deleted' => array( 'The font family could not be deleted.' ) ),
			$actual->errors,
			'WP_Error should have "font_family_not_deleted" error'
		);
	}

	/**
	 * Data provider.
	 *
	 * @return string[][]
	 */
	public function data_should_return_error_when_not_able_to_uninstall() {
		return array(
			'When delete file fails' => array( 'wp_delete_file' ),
			'when delete post fails' => array( 'pre_delete_post' ),
		);
	}

	/**
	 * @dataProvider data_should_uninstall
	 *
	 * @param array $font_data  Font family data in theme.json format.
	 * @param array $files_data Files data in $_FILES format.
	 */
	public function test_should_uninstall( $font_data, array $files_data ) {
		// Set up.
		foreach ( $files_data as $file ) {
			file_put_contents( $file['tmp_name'], 'Mocking file content' );
		}
		$font = new WP_Font_Family( $font_data );
		$font->install( $files_data );

		// Pre-checks to ensure the starting point is as expected.
		$this->assertInstanceOf( WP_Post::class, $font->get_font_post(), 'Font post should exist' );
		$this->assertNotEmpty( $this->files_in_dir( static::$fonts_dir ), 'Fonts should be installed' );

		// Uninstall.
		$this->assertTrue( $font->uninstall() );

		// Test the post and font file(s) were uninstalled.
		$this->assertNull( $font->get_font_post(), 'Font post should be deleted after uninstall' );
		$this->assertEmpty( $this->files_in_dir( static::$fonts_dir ), 'Fonts should be uninstalled' );
	}

	/**
	 * @dataProvider data_should_uninstall
	 *
	 * @param array $font_data          Font family data in theme.json format.
	 * @param array $files_data         Files data in $_FILES format.
	 * @param array $files_to_uninstall Files to uninstall.
	 */
	public function test_should_uninstall_only_its_font_family( $font_data, array $files_data, array $files_to_uninstall ) {
		// Set up a different font family instance. This font family should not be uninstalled.
		$merriweather = new WP_Font_Family( $this->merriweather['font_data'] );
		$merriweather->install( $this->merriweather['files_data'] );

		// Set up the font family to be uninstalled.
		foreach ( $files_data as $file ) {
			file_put_contents( $file['tmp_name'], 'Mocking file content' );
		}
		$font = new WP_Font_Family( $font_data );
		$font->install( $files_data );

		$this->assertTrue( $font->uninstall() );

		// Check that the files were uninstalled.
		foreach ( $files_to_uninstall as $font_file ) {
			$font_file = static::$fonts_dir . $font_file;
			$this->assertFileDoesNotExist( $font_file, "Font file [{$font_file}] should not exists in the uploads/fonts/ directory after uninstalling" );
		}
		// Check that the Merriweather file was not uninstalled.
		$this->assertFileExists( $this->merriweather['font_filename'], 'The other font family [Merriweather] should not have been uninstalled.' );
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public function data_should_uninstall() {
		return array(
			'1 local font'  => array(
				'font_data'          => array(
					'name'       => 'Inter',
					'slug'       => 'inter',
					'fontFamily' => 'Inter',
					'fontFace'   => array(
						array(
							'fontFamily'   => 'Inter',
							'fontStyle'    => 'italic',
							'fontWeight'   => '900',
							'uploadedFile' => 'files0',
						),
					),
				),
				'files_data'         => array(
					'files0' => array(
						'name'     => 'inter1.ttf',
						'type'     => 'font/ttf',
						'tmp_name' => wp_tempnam( 'Inter-' ),
						'error'    => 0,
						'size'     => 123,
					),
				),
				'files_to_uninstall' => array( 'inter_italic_900.ttf' ),
			),
			'2 local fonts' => array(
				'font_data'          => array(
					'name'       => 'Lato',
					'slug'       => 'lato',
					'fontFamily' => 'Lato',
					'fontFace'   => array(
						array(
							'fontFamily'   => 'Lato',
							'fontStyle'    => 'normal',
							'fontWeight'   => '400',
							'uploadedFile' => 'files1',
						),
						array(
							'fontFamily'   => 'Lato',
							'fontStyle'    => 'normal',
							'fontWeight'   => '500',
							'uploadedFile' => 'files2',
						),
					),
				),
				'files_data'         => array(
					'files1' => array(
						'name'     => 'lato1.ttf',
						'type'     => 'font/ttf',
						'tmp_name' => wp_tempnam( 'Lato-' ),
						'error'    => 0,
						'size'     => 123,
					),
					'files2' => array(
						'name'     => 'lato2.ttf',
						'type'     => 'font/ttf',
						'tmp_name' => wp_tempnam( 'Lato-' ),
						'error'    => 0,
						'size'     => 123,
					),
				),
				'files_to_uninstall' => array( 'lato_normal_400.ttf', 'lato_normal_500.ttf' ),
			),
		);
	}
}
