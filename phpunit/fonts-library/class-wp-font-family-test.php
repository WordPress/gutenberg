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
	 * Tests that an exception is thrown when the font family is missing a slug.
	 *
	 * @covers ::__construct
	 */
	public function test_constructor_throws_exception_when_font_family_has_no_slug() {
		$font_data = array(
			'fontFamily' => 'Piazzolla',
			'name'       => 'Piazzolla',
		);
		$this->expectException( 'Exception' );
		$this->expectExceptionMessage( 'Font family data is missing the slug.' );
		new WP_Font_Family( $font_data );
	}

	/**
	 * Tests that data is set by the constructor and retrieved by the get_data() method.
	 *
	 * @covers ::__construct
	 * @covers ::get_data
	 *
	 * @dataProvider data_font_fixtures
	 *
	 * @param array $font_data Font family data in theme.json format.
	 */
	public function test_get_data( $font_data ) {
		$font = new WP_Font_Family( $font_data );
		$this->assertSame( $font_data, $font->get_data() );
	}

	/**
	 * Tests that the get_data_as_json() method returns the expected data in JSON format.
	 *
	 * @covers ::get_data_as_json
	 *
	 * @dataProvider data_get_data_as_json
	 *
	 * @param array  $font_data Font family data in theme.json format.
	 * @param string $expected  Expected font family data as JSON string.
	 */
	public function test_get_data_as_json( $font_data, $expected ) {
		$font = new WP_Font_Family( $font_data );
		$this->assertSame( $expected, $font->get_data_as_json() );
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public function data_get_data_as_json() {
		return array(
			'piazzolla'  => array(
				'font_data' => array(
					'slug'       => 'piazzolla',
					'fontFamily' => 'Piazzolla',
					'name'       => 'Piazzolla',
					'fontFace'   => array(
						array(
							'fontFamily' => 'Piazzolla',
							'src'        => 'https://example.com/fonts/piazzolla_italic_400.ttf',
							'fontStyle'  => 'italic',
							'fontWeight' => '400',
						),
					),
				),
				'expected'  => '{"slug":"piazzolla","fontFamily":"Piazzolla","name":"Piazzolla","fontFace":[{"fontFamily":"Piazzolla","src":"https:\/\/example.com\/fonts\/piazzolla_italic_400.ttf","fontStyle":"italic","fontWeight":"400"}]}',
			),
			'piazzolla2' => array(
				'font_data' => array(
					'slug'       => 'piazzolla',
					'fontFamily' => 'Piazzolla',
					'name'       => 'Piazzolla',
					'fontFace'   => array(
						array(
							'fontFamily' => 'Piazzolla',
							'src'        => 'https://example.com/fonts/piazzolla_italic_400.ttf',
							'fontStyle'  => 'italic',
							'fontWeight' => '400',
						),
					),
				),
				'expected'  => '{"slug":"piazzolla","fontFamily":"Piazzolla","name":"Piazzolla","fontFace":[{"fontFamily":"Piazzolla","src":"https:\/\/example.com\/fonts\/piazzolla_italic_400.ttf","fontStyle":"italic","fontWeight":"400"}]}',
			),
		);
	}

	/**
	 * Tests that the has_font_faces() method correctly determines whether a font family has font faces.
	 *
	 * @covers ::has_font_faces
	 *
	 * @dataProvider data_has_font_faces
	 *
	 * @param array $font_data Font family data in theme.json format.
	 * @param bool  $expected  Expected result.
	 */
	public function test_has_font_faces( $font_data, $expected ) {
		$font = new WP_Font_Family( $font_data );
		$this->assertSame( $expected, $font->has_font_faces() );
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public function data_has_font_faces() {
		return array(
			'with font faces'    => array(
				'font_data' => array(
					'slug'     => 'piazzolla',
					'fontFace' => array(
						array(
							'fontFamily' => 'Piazzolla',
							'fontStyle'  => 'italic',
							'fontWeight' => '400',
						),
					),
				),
				'expected'  => true,
			),

			'empty font faces'   => array(
				'font_data' => array(
					'slug'     => 'piazzolla',
					'fontFace' => array(),
				),
				'expected'  => false,
			),

			'without font faces' => array(
				'font_data' => array(
					'slug' => 'piazzolla',
				),
				'expected'  => false,
			),
		);
	}

	/**
	 * Tests that the install() and uninstall() methods work as expected
	 * It uses different types of font families: with local, remote or no files.
	 *
	 * @covers ::install
	 * @covers ::uninstall
	 * @covers ::get_font_post
	 *
	 * @dataProvider data_font_fixtures
	 *
	 * @param array $font_data Font family data in theme.json format.
	 * @param array $installed_font_data Font family data in theme.json format expected data after installation.
	 * @param array $files_data Optional. Files data in $_FILES format (Used only if the font has local files). Default: empty array.
	 */
	public function test_install_and_uninstall( $font_data, $installed_font_data, $files_data = array() ) {
		$font = new WP_Font_Family( $font_data );
		$font->install( $files_data );

		// Check that the post was created.
		$post = $font->get_font_post();
		$this->assertInstanceof( 'WP_Post', $post, 'The font post was not created.' );

		// Check that the post has the correct data.
		$this->assertSame( $installed_font_data['name'], $post->post_title, 'The font post has the wrong title.' );
		$this->assertSame( $installed_font_data['slug'], $post->post_name, 'The font post has the wrong slug.' );

		$content = json_decode( $post->post_content, true );
		$this->assertSame( $installed_font_data['fontFamily'], $content['fontFamily'], 'The font post content has the wrong font family.' );
		$this->assertSame( $installed_font_data['slug'], $content['slug'], 'The font post content has the wrong slug.' );

		$this->assertArrayNotHasKey( 'download_from_url', $content, 'The installed font should not have the url from where it was downloaded.' );
		$this->assertArrayNotHasKey( 'uploaded_file', $content, 'The installed font should not have the reference to the file from it was installed.' );

		$this->assertCount( count( $installed_font_data['fontFace'] ), $content['fontFace'], 'One or more font faces could not be installed.' );

		$font->uninstall();

		// Check that the post was deleted.
		$post = $font->get_font_post();
		$this->assertNull( $post, 'The font post was not deleted' );
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public function data_font_fixtures() {
		$temp_file_path1 = wp_tempnam( 'Inter-' );
		file_put_contents( $temp_file_path1, 'Mocking file content' );
		$temp_file_path2 = wp_tempnam( 'Inter-' );
		file_put_contents( $temp_file_path2, 'Mocking file content' );

		return array(
			'with_one_google_font_face_to_be_downloaded' => array(
				'font_data'           => array(
					'name'       => 'Piazzolla',
					'slug'       => 'piazzolla',
					'fontFamily' => 'Piazzolla',
					'fontFace'   => array(
						array(
							'fontFamily'        => 'Piazzolla',
							'fontStyle'         => 'italic',
							'fontWeight'        => '400',
							'src'               => 'http://fonts.gstatic.com/s/piazzolla/v33/N0b72SlTPu5rIkWIZjVgI-TckS03oGpPETyEJ88Rbvi0_TzOzKcQhZqx3gX9BRy5m5M.ttf',
							'download_from_url' => 'http://fonts.gstatic.com/s/piazzolla/v33/N0b72SlTPu5rIkWIZjVgI-TckS03oGpPETyEJ88Rbvi0_TzOzKcQhZqx3gX9BRy5m5M.ttf',
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
							'src'        => 'piazzolla_italic_400.ttf', // This is just filename of the font asset and not the entire URL because we can't know the URL of the asset in the test.
						),
					),
				),
				'files_data'          => null,
			),
			'with_one_google_font_face_to_not_be_downloaded' => array(
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
							'src'        => 'piazzolla_italic_400.ttf', // This is just filename of the font asset and not the entire URL because we can't know the URL of the asset in the test.
						),
					),
				),
				'files_data'          => null,
			),
			'without_font_faces'                         => array(
				'font_data'           => array(
					'name'       => 'Arial',
					'slug'       => 'arial',
					'fontFamily' => 'Arial',
					'fontFace'   => array(),
				),
				'installed_font_data' => array(
					'name'       => 'Arial',
					'slug'       => 'arial',
					'fontFamily' => 'Arial',
					'fontFace'   => array(),
				),
				'files_data'          => null,
			),
			'with_local_files'                           => array(
				'font_data'           => array(
					'name'       => 'Inter',
					'slug'       => 'inter',
					'fontFamily' => 'Inter',
					'fontFace'   => array(
						array(
							'fontFamily'    => 'Inter',
							'fontStyle'     => 'normal',
							'fontWeight'    => '400',
							'uploaded_file' => 'files0',
						),
						array(
							'fontFamily'    => 'Inter',
							'fontStyle'     => 'normal',
							'fontWeight'    => '500',
							'uploaded_file' => 'files1',
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
							'src'        => 'inter_normal_400.ttf',
						),
						array(
							'fontFamily' => 'Inter',
							'fontStyle'  => 'normal',
							'fontWeight' => '500',
							'src'        => 'inter_normal_500.ttf',
						),
					),
				),
				'files_data'          => array(
					'files0' => array(
						'name'     => 'inter1.ttf',
						'type'     => 'font/ttf',
						'tmp_name' => $temp_file_path1,
						'error'    => 0,
						'size'     => 123,
					),
					'files1' => array(
						'name'     => 'inter2.ttf',
						'type'     => 'font/ttf',
						'tmp_name' => $temp_file_path2,
						'error'    => 0,
						'size'     => 123,
					),
				),
			),
		);
	}
}
