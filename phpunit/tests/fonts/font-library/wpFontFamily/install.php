<?php
/**
 * Test WP_Font_Family::install().
 *
 * @package WordPress
 * @subpackage Font Library
 */

require_once __DIR__ . '/base.php';

/**
 * @group fonts
 * @group font-library
 *
 * @covers WP_Font_Family::install
 */
class Tests_Fonts_WpFontFamily_Install extends WP_Font_Family_UnitTestCase {

	/**
	 * @dataProvider data_should_not_download_when_no_fontface
	 *
	 * @param array $font_data Font family data in theme.json format.
	 */
	public function test_should_not_download_when_no_fontface( $font_data ) {
		$font = new WP_Font_Family( $font_data );

		// Test.
		$font->install();
		$this->assertEmpty( $this->files_in_dir( static::$fonts_dir ), 'Font directory should be empty' );
		$this->assertInstanceOf( WP_Post::class, $font->get_font_post(), 'Font post should exist after install' );
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public function data_should_not_download_when_no_fontface() {
		return array(
			'wrong fontFace key' => array(
				array(
					'name'       => 'Piazzolla',
					'slug'       => 'piazzolla',
					'fontFamily' => 'Piazzolla',
					'fontFaces'  => array(
						array(
							'fontFamily' => 'Piazzolla',
							'fontStyle'  => 'italic',
							'fontWeight' => '400',
						),
					),
				),
			),
			'without font faces' => array(
				array(
					'name'       => 'Piazzolla',
					'slug'       => 'piazzolla',
					'fontFamily' => 'Piazzolla',
				),
			),
			'empty array'        => array(
				array(
					'name'       => 'Piazzolla',
					'slug'       => 'piazzolla',
					'fontFamily' => 'Piazzolla',
					'fontFace'   => array(),
				),
			),
			'null'               => array(
				array(
					'name'       => 'Piazzolla',
					'slug'       => 'piazzolla',
					'fontFamily' => 'Piazzolla',
					'fontFace'   => null,
				),
			),
		);
	}

	/**
	 * @dataProvider data_should_download_fontfaces
	 *
	 * @param array $font_data Font family data in theme.json format.
	 * @param array $expected  Expected font filename(s).
	 */
	public function test_should_download_fontfaces_and_create_post( $font_data, array $expected ) {
		// Pre-checks to ensure starting conditions.
		foreach ( $expected as $font_file ) {
			$font_file = path_join( static::$fonts_dir, $font_file );
			$this->assertFileDoesNotExist( $font_file, "Font file [{$font_file}] should not exist in the fonts/ directory after installing" );
		}
		$font = new WP_Font_Family( $font_data );

		// Test.
		$font->install();
		foreach ( $expected as $font_file ) {
			$font_file = path_join( static::$fonts_dir, $font_file );
			$this->assertFileExists( $font_file, "Font file [{$font_file}] should exists in the fonts/ directory after installing" );
		}
		$this->assertInstanceOf( WP_Post::class, $font->get_font_post(), 'Font post should exist after install' );
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public function data_should_download_fontfaces() {
		return array(
			'1 font face to download'  => array(
				'font_data' => array(
					'name'       => 'Piazzolla',
					'slug'       => 'piazzolla',
					'fontFamily' => 'Piazzolla',
					'fontFace'   => array(
						array(
							'fontFamily'      => 'Piazzolla',
							'fontStyle'       => 'italic',
							'fontWeight'      => '400',
							'src'             => 'http://fonts.gstatic.com/s/piazzolla/v33/N0b72SlTPu5rIkWIZjVgI-TckS03oGpPETyEJ88Rbvi0_TzOzKcQhZqx3gX9BRy5m5M.ttf',
							'downloadFromUrl' => 'http://fonts.gstatic.com/s/piazzolla/v33/N0b72SlTPu5rIkWIZjVgI-TckS03oGpPETyEJ88Rbvi0_TzOzKcQhZqx3gX9BRy5m5M.ttf',
						),
					),
				),
				'expected'  => array( 'piazzolla_italic_400.ttf' ),
			),
			'2 font faces to download' => array(
				'font_data' => array(
					'name'       => 'Lato',
					'slug'       => 'lato',
					'fontFamily' => 'Lato',
					'fontFace'   => array(
						array(
							'fontFamily'      => 'Lato',
							'fontStyle'       => 'normal',
							'fontWeight'      => '400',
							'src'             => 'http://fonts.gstatic.com/s/lato/v24/S6uyw4BMUTPHvxk6XweuBCY.ttf',
							'downloadFromUrl' => 'http://fonts.gstatic.com/s/lato/v24/S6uyw4BMUTPHvxk6XweuBCY.ttf',
						),
						array(
							'fontFamily'      => 'Lato',
							'fontStyle'       => 'italic',
							'fontWeight'      => '400',
							'src'             => 'http://fonts.gstatic.com/s/lato/v24/S6u8w4BMUTPHjxswWyWrFCbw7A.ttf',
							'downloadFromUrl' => 'http://fonts.gstatic.com/s/lato/v24/S6u8w4BMUTPHjxswWyWrFCbw7A.ttf',
						),
					),
				),
				'expected'  => array( 'lato_normal_400.ttf', 'lato_italic_400.ttf' ),
			),
		);
	}

	/**
	 * @dataProvider data_should_move_local_fontfaces
	 *
	 * @param array $font_data  Font family data in theme.json format.
	 * @param array $files_data Files data in $_FILES format.
	 * @param array $expected   Expected font filename(s).
	 */
	public function test_should_move_local_fontfaces( $font_data, array $files_data, array $expected ) {
		// Set up the temporary files.
		foreach ( $files_data as $file ) {
			if ( 'font/ttf' === $file['type'] ) {
				copy( __DIR__ . '/../../../data/fonts/Merriweather.ttf', $file['tmp_name'] );
			} elseif ( 'font/woff' === $file['type'] ) {
				copy( __DIR__ . '/../../../data/fonts/cooper-hewitt.woff', $file['tmp_name'] );
			} elseif ( 'font/woff2' === $file['type'] ) {
				copy( __DIR__ . '/../../../data/fonts/DMSans.woff2', $file['tmp_name'] );
			} elseif ( 'application/vnd.ms-opentype' === $file['type'] ) {
				copy( __DIR__ . '/../../../data/fonts/gilbert-color.otf', $file['tmp_name'] );
			}
		}

		$font = new WP_Font_Family( $font_data );
		$font->install( $files_data );

		foreach ( $expected as $font_file ) {
			$font_file = path_join( static::$fonts_dir, $font_file );
			$this->assertFileExists( $font_file, "Font file [{$font_file}] should exists in the fonts/ directory after installing" );
		}
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public function data_should_move_local_fontfaces() {
		return array(
			// ttf font type.
			'1 local font'     => array(
				'font_data'  => array(
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
				'files_data' => array(
					'files0' => array(
						'name'     => 'inter1.ttf',
						'type'     => 'font/ttf',
						'tmp_name' => wp_tempnam( 'Inter-' ),
						'error'    => 0,
						'size'     => 123,
					),
				),
				'expected'   => array( 'inter_italic_900.ttf' ),
			),
			'2 local fonts'    => array(
				'font_data'  => array(
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
				'files_data' => array(
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
				'expected'   => array( 'lato_normal_400.ttf', 'lato_normal_500.ttf' ),
			),
			// woff font type.
			'woff local font'  => array(
				'font_data'  => array(
					'name'       => 'Cooper Hewitt',
					'slug'       => 'cooper-hewitt',
					'fontFamily' => 'Cooper Hewitt',
					'fontFace'   => array(
						array(
							'fontFamily'   => 'Cooper Hewitt',
							'fontStyle'    => 'italic',
							'fontWeight'   => '900',
							'uploadedFile' => 'files0',
						),
					),
				),
				'files_data' => array(
					'files0' => array(
						'name'     => 'cooper-hewitt.woff',
						'type'     => 'font/woff',
						'tmp_name' => wp_tempnam( 'Cooper-' ),
						'error'    => 0,
						'size'     => 123,
					),
				),
				'expected'   => array( 'cooper-hewitt_italic_900.woff' ),
			),
			// woff2 font type.
			'woff2 local font' => array(
				'font_data'  => array(
					'name'       => 'DM Sans',
					'slug'       => 'dm-sans',
					'fontFamily' => 'DM Sans',
					'fontFace'   => array(
						array(
							'fontFamily'   => 'DM Sans',
							'fontStyle'    => 'regular',
							'fontWeight'   => '500',
							'uploadedFile' => 'files0',
						),
					),
				),
				'files_data' => array(
					'files0' => array(
						'name'     => 'DMSans.woff2',
						'type'     => 'font/woff2',
						'tmp_name' => wp_tempnam( 'DMSans-' ),
						'error'    => 0,
						'size'     => 123,
					),
				),
				'expected'   => array( 'dm-sans_regular_500.woff2' ),
			),
			// otf font type.
			'otf local font'   => array(
				'font_data'  => array(
					'name'       => 'Gilbert Color',
					'slug'       => 'gilbert-color',
					'fontFamily' => 'Gilbert Color',
					'fontFace'   => array(
						array(
							'fontFamily'   => 'Gilbert Color',
							'fontStyle'    => 'regular',
							'fontWeight'   => '500',
							'uploadedFile' => 'files0',
						),
					),
				),
				'files_data' => array(
					'files0' => array(
						'name'     => 'gilbert-color.otf',
						'type'     => 'application/vnd.ms-opentype',
						'tmp_name' => wp_tempnam( 'Gilbert-' ),
						'error'    => 0,
						'size'     => 123,
					),
				),
				'expected'   => array( 'gilbert-color_regular_500.otf' ),
			),
		);
	}

	/**
	 * @dataProvider data_should_not_install_duplicate_fontfaces
	 *
	 * @param array $font_data  Font family data in theme.json format.
	 * @param array $files_data Files data in $_FILES format.
	 * @param array $expected   Expected font filename(s).
	 */
	public function test_should_not_install_duplicate_fontfaces( $font_data, array $files_data, array $expected ) {
		// Set up the temporary files.
		foreach ( $files_data as $file ) {
			copy( __DIR__ . '/../../../data/fonts/Merriweather.ttf', $file['tmp_name'] );
		}

		$font = new WP_Font_Family( $font_data );
		$font->install( $files_data );

		$this->assertCount( count( $expected ), $this->files_in_dir( static::$fonts_dir ), 'Font directory should contain the same number of files as expected' );

		foreach ( $expected as $font_file ) {
			$font_file = path_join( static::$fonts_dir, $font_file );
			$this->assertFileExists( $font_file, "Font file [{$font_file}] should exists in the fonts/ directory after installing" );
		}
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public function data_should_not_install_duplicate_fontfaces() {
		return array(
			'single unique font face'    => array(
				'font_data'  => array(
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
						array(
							'fontFamily'   => 'Inter',
							'fontStyle'    => 'italic',
							'fontWeight'   => '900',
							'uploadedFile' => 'files1',
						),
					),
				),
				'files_data' => array(
					'files0' => array(
						'name'     => 'inter1.ttf',
						'type'     => 'font/ttf',
						'tmp_name' => wp_tempnam( 'Inter-' ),
						'error'    => 0,
						'size'     => 123,
					),
					'files1' => array(
						'name'     => 'inter1.woff',
						'type'     => 'font/woff',
						'tmp_name' => wp_tempnam( 'Inter-' ),
						'error'    => 0,
						'size'     => 123,
					),
				),
				'expected'   => array( 'inter_italic_900.ttf' ),
			),
			'multiple unique font faces' => array(
				'font_data'  => array(
					'name'       => 'Lato',
					'slug'       => 'lato',
					'fontFamily' => 'Lato',
					'fontFace'   => array(
						array(
							'fontFamily'   => 'Lato',
							'fontStyle'    => 'normal',
							'fontWeight'   => '400',
							'uploadedFile' => 'files0',
						),
						array(
							'fontFamily'   => 'Lato',
							'fontStyle'    => 'normal',
							'fontWeight'   => '500',
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
				'files_data' => array(
					'files0' => array(
						'name'     => 'lato1.ttf',
						'type'     => 'font/ttf',
						'tmp_name' => wp_tempnam( 'Lato-' ),
						'error'    => 0,
						'size'     => 123,
					),
					'files1' => array(
						'name'     => 'lato2.ttf',
						'type'     => 'font/ttf',
						'tmp_name' => wp_tempnam( 'Lato-' ),
						'error'    => 0,
						'size'     => 123,
					),
					'files2' => array(
						'name'     => 'lato2.woff',
						'type'     => 'font/woff',
						'tmp_name' => wp_tempnam( 'Lato-' ),
						'error'    => 0,
						'size'     => 123,
					),
				),
				'expected'   => array( 'lato_normal_400.ttf', 'lato_normal_500.ttf' ),
			),
		);
	}

	public function test_should_overwrite_fontface_with_different_extension() {
		$font_data_initial    = array(
			'name'       => 'Inter',
			'slug'       => 'inter',
			'fontFamily' => 'Inter',
			'fontFace'   => array(
				array(
					'fontFamily'   => 'Inter',
					'fontStyle'    => 'italic',
					'fontWeight'   => '500',
					'uploadedFile' => 'files0',
				),
				array(
					'fontFamily'   => 'Inter',
					'fontStyle'    => 'italic',
					'fontWeight'   => '900',
					'uploadedFile' => 'files1',
				),
			),
		);
		$files_data_initial   = array(
			'files0' => array(
				'name'     => 'inter1.ttf',
				'type'     => 'font/woff',
				'tmp_name' => wp_tempnam( 'Inter-' ),
				'error'    => 0,
				'size'     => 123,
			),
			'files1' => array(
				'name'     => 'inter1.woff',
				'type'     => 'font/woff',
				'tmp_name' => wp_tempnam( 'Inter-' ),
				'error'    => 0,
				'size'     => 123,
			),
		);
		$font_data_overwrite  = array(
			'name'       => 'Inter',
			'slug'       => 'inter',
			'fontFamily' => 'Inter',
			'fontFace'   => array(
				array(
					'fontFamily'   => 'Inter',
					'fontStyle'    => 'italic',
					'fontWeight'   => '500',
					'uploadedFile' => 'files0',
				),
				array(
					'fontFamily'   => 'Inter',
					'fontStyle'    => 'italic',
					'fontWeight'   => '900',
					'uploadedFile' => 'files1',
				),
			),
		);
		$files_data_overwrite = array(
			'files0' => array(
				'name'     => 'inter1.woff',
				'type'     => 'font/woff',
				'tmp_name' => wp_tempnam( 'Inter-' ),
				'error'    => 0,
				'size'     => 123,
			),
			'files1' => array(
				'name'     => 'inter1.ttf',
				'type'     => 'font/ttf',
				'tmp_name' => wp_tempnam( 'Inter-' ),
				'error'    => 0,
				'size'     => 123,
			),
		);

		$expected = array( 'inter_italic_500.woff', 'inter_italic_900.ttf' );

		// Set up the temporary files.
		foreach ( $files_data_initial as $file ) {
			if ( 'font/ttf' === $file['type'] ) {
				copy( __DIR__ . '/../../../data/fonts/Merriweather.ttf', $file['tmp_name'] );
			} elseif ( 'font/woff' === $file['type'] ) {
				copy( __DIR__ . '/../../../data/fonts/cooper-hewitt.woff', $file['tmp_name'] );
			}
		}
		foreach ( $files_data_overwrite as $file ) {
			if ( 'font/ttf' === $file['type'] ) {
				copy( __DIR__ . '/../../../data/fonts/Merriweather.ttf', $file['tmp_name'] );
			} elseif ( 'font/woff' === $file['type'] ) {
				copy( __DIR__ . '/../../../data/fonts/cooper-hewitt.woff', $file['tmp_name'] );
			}
		}

		$font = new WP_Font_Family( $font_data_initial );
		$font->install( $files_data_initial );

		$font = new WP_Font_Family( $font_data_overwrite );
		$font->install( $files_data_overwrite );

		$this->assertCount( count( $expected ), $this->files_in_dir( static::$fonts_dir ), 'Font directory should contain the same number of files as expected' );

		foreach ( $expected as $font_file ) {
			$font_file = path_join( static::$fonts_dir, $font_file );
			$this->assertFileExists( $font_file, "Font file [{$font_file}] should exists in the fonts/ directory after installing" );
		}
	}
}
