<?php
/**
 * Tests for Font Family Utils class
 *
 * @package    Gutenberg
 * @subpackage Fonts Library
 */

 /**
  * @coversDefaultClass WP_Font_Family
  */
class WP_Font_Family_Test extends WP_UnitTestCase {

	/**
	 * Test the constructor and the get_data method
	 *
	 * @covers ::__construct
	 * @covers ::get_data
	 *
	 * @dataProvider data_font_fixtures
	 *
	 * @param array $font_data Font family data in theme.json format
	 */
	public function test_get_data( $font_data ) {
		$font = new WP_Font_Family( $font_data );
		$this->assertEquals( $font_data, $font->get_data() );
	}

	/**
	 * Test if the get_data_as_json method returns the correct data
	 *
	 * @covers ::get_data_as_json
	 *
	 * @dataProvider data_font_fixtures
	 *
	 * @param array $font_data Font family data in theme.json format
	 */
	public function test_get_data_as_json( $font_data ) {
		$font = new WP_Font_Family( $font_data );
		$this->assertSame( wp_json_encode( $font_data ), $font->get_data_as_json() );
	}

	/**
	 * Test if the has_font_faces method returns the correct data
	 *
	 * @covers ::has_font_faces
	 *
	 * @dataProvider data_has_font_faces
	 *
	 * @param array $font_data Font family data in theme.json format
	 * @param bool  $expected  Expected result
	 */
	public function test_has_font_faces( $font_data, $expected ) {
		$font = new WP_Font_Family( $font_data );
		$this->assertSame( $expected, $font->has_font_faces() );
	}

	public function data_has_font_faces () {
		return array (
			'with font faces' => array (
				'font_data' => array (
					'slug' => 'piazzolla',
					'fontFace' => [
						array(
							'fontFamily' => 'Piazzolla',
							'fontStyle'  => 'italic',
							'fontWeight' => '400',
						)
					]
				),
				'expected' => true,
			),

			'empty font faces' => array (
				'font_data' => array (
					'slug' => 'piazzolla',
					'fontFace' => [],
				),
				'expected' => false
			),

			'without font faces' => array (
				'font_data' => array (
					'slug' => 'piazzolla',
				),
				'expected' => false,
			),
		);
	}

	/**
	 * @covers ::install
	 * @covers ::uninstall
	 * @covers ::get_font_post
	 *
	 * @dataProvider data_font_fixtures
	 *
	 * @param array $font_data Font family data in theme.json format
	 * @param array $installed_font_data Font family data in theme.json format expected data after installation
	 * @param array $files_data Optional. Files data in $_FILES format (Used only if the font has local files). Default: empty array.
	 */
	public function test_install_and_uninstall( $font_data, $installed_font_data, $files_data = array() ) {
		$font = new WP_Font_Family( $font_data );
		$font->install( $files_data );

		// Check that the post was created
		$post = $font->get_font_post();
		$this->assertInstanceof( 'WP_Post', $post, 'The font post was not created.' );

		// Check that the post has the correct data
		$this->assertSame( $installed_font_data['name'], $post->post_title, 'The font post has the wrong title.' );
		$this->assertSame( $installed_font_data['slug'], $post->post_name, 'The font post has the wrong slug.' );

		$content = json_decode( $post->post_content, true );
		$this->assertSame( $installed_font_data['fontFamily'], $content['fontFamily'], 'The font post content has the wrong font family.' );
		$this->assertSame( $installed_font_data['slug'], $content['slug'], 'The font post content has the wrong slug.' );

		if ( $font->has_font_faces() ) {
			$font_face_index = 0;
			foreach ( $content['fontFace'] as $font_face ) {
				$source_index = 0;
				if ( is_array( $font_face['src'] ) ) {
					foreach ( $font_face['src'] as $src ) {
						$this->assertStringEndsWith( $installed_font_data[ $font_face_index ]['src'][ $source_index ], $src, 'The font post content has the wrong src.' );
						$this->assertFileExists( WP_FONTS_DIR . DIRECTORY_SEPARATOR . $installed_font_data['fontFace'][ $font_face_index ]['src'][ $source_index ], 'The font asset was not created.' );
					}
				} else {
					$this->assertStringEndsWith( $installed_font_data['fontFace'][ $font_face_index ]['src'], $font_face['src'], 'The font post content has the wrong src.' );
					$this->assertFileExists( WP_FONTS_DIR . DIRECTORY_SEPARATOR . $installed_font_data['fontFace'][ $font_face_index ]['src'], 'The font asset was not created.' );
				}
				$font_face_index++;
				$source_index++;
			}
		}

		$font->uninstall();

		// Check that the post was deleted
		$post = $font->get_font_post();
		$this->assertNull( $post, 'The font post was not deleted' );

		// Check that the font asset was deleted
		if ( $font->has_font_faces() ) {
			$font_face_index = 0;
			foreach ( $content['fontFace'] as $font_face ) {
				$source_index = 0;
				if ( is_array( $font_face['src'] ) ) {
					foreach ( $font_face['src'] as $src ) {
						$this->assertFileDoesNotExist( WP_FONTS_DIR . DIRECTORY_SEPARATOR . $installed_font_data['fontFace'][ $font_face_index ]['src'][ $source_index ], 'The font face asset was not removed' );
					}
				} else {
					$this->assertFileDoesNotExist( WP_FONTS_DIR . DIRECTORY_SEPARATOR . $installed_font_data['fontFace'][ $font_face_index ]['src'], 'The font face asset was not removed' );
				}
				$font_face_index++;
				$source_index++;
			}
		}
	}

	public function data_font_fixtures() {
		return array(
			'with_one_google_font_face' => array(
				'font_data'           => array(
					'name'       => 'Piazzolla',
					'slug'       => 'piazzolla',
					'fontFamily' => 'Piazzolla',
					'fontFace'   => array(
						array(
							'fontFamily' => 'Piazzolla',
							'fontStyle'  => 'italic',
							'fontWeight' => '400',
							'src'        => 'http://fonts.gstatic.com/s/piazzolla/v33/N0b72SlTPu5rIkWIZjVgI-TckS03oGpPETyEJ88Rbvi0_TzOzKcQhZqx3gX9BRy5m5M.ttf',
						),
					),
				),
				'installed_font_data' => array(
					'name'       => 'Piazzolla',
					'slug'       => 'piazzolla',
					'fontFamily' => 'Piazzolla',
					'fontFace'   => array(
						array(
							'fontFamily' => 'Piazzolla',
							'fontStyle'  => 'italic',
							'fontWeight' => '400',
							'src'        => 'piazzolla_italic_400.ttf', // This is just filename of the font asset and not the entire URL because we can't know the URL of the asset in the test
						),
					),
				),
			),
			'with_no_font_faces'        => array(
				'font_data'           => array(
					'name'       => 'Arial',
					'slug'       => 'arial',
					'fontFamily' => 'Arial',
				),
				'installed_font_data' => array(
					'name'       => 'Arial',
					'slug'       => 'arial',
					'fontFamily' => 'Arial',
				),
			),
			'with_local_files'          => array(
				'font_data'           => array(
					'name'       => 'Inter',
					'slug'       => 'inter',
					'fontFamily' => 'Inter',
					'fontFace'   => array(
						array(
							'fontFamily' => 'Inter',
							'fontStyle'  => 'normal',
							'fontWeight' => '400',
							'file'       => 'files0',
						),
						array(
							'fontFamily' => 'Inter',
							'fontStyle'  => 'normal',
							'fontWeight' => '500',
							'file'       => 'files1',
						),
					),
				),
				'installed_font_data' => array(
					'name'       => 'Inter',
					'slug'       => 'inter',
					'fontFamily' => 'Inter',
					'fontFace'   => array(
						array(
							'fontFamily' => 'Inter',
							'fontStyle'  => 'normal',
							'fontWeight' => '400',
							'src'        => 'https://example.com/wp-content/fonts/inter_normal_400.ttf',
						),
						array(
							'fontFamily' => 'Inter',
							'fontStyle'  => 'normal',
							'fontWeight' => '500',
							'src'        => 'https://example.com/wp-content/fonts/inter_normal_500.ttf',
						),
					),
				),
				'files_data'          => array(
					'files0' => array(
						'name'      => 'inter1.ttf',
						'full_path' => 'inter1.ttf',
						'type'      => 'font/ttf',
						'tmp_name'  => tempnam( sys_get_temp_dir(), 'Inter-' ),
						'error'     => 0,
						'size'      => 156764,
					),
					'files1' => array(
						'name'      => 'inter2.ttf',
						'full_path' => 'inter2.ttf',
						'type'      => 'font/ttf',
						'tmp_name'  => tempnam( sys_get_temp_dir(), 'Inter-' ),
						'error'     => 0,
						'size'      => 156524,
					),
				),
			),
		);
	}
}
