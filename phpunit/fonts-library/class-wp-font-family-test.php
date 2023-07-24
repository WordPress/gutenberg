<?php
/**
 * Tests for Font Family Utils class
 *
 * @package Gutenberg
 */

class WP_Font_Family_Test extends WP_UnitTestCase {

	const FONT_DATA_1 = array(
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
	);

	const FONT_DATA_2 = array(
		'name'       => 'Arial',
		'slug'       => 'arial',
		'fontFamily' => 'Arial',
	);

	function test_get_data() {
		$font = new WP_Font_Family( self::FONT_DATA_1 );
		$this->assertSame( 'piazzolla', $font->get_data()['slug'] );
		$this->assertCount( 1, $font->get_data()['fontFace'] );
	}

	function test_get_data_as_json() {
		$font = new WP_Font_Family( self::FONT_DATA_1 );
		$this->assertSame( wp_json_encode( self::FONT_DATA_1 ), $font->get_data_as_json() );
	}

	function test_has_font_faces() {
		$font1 = new WP_Font_Family( self::FONT_DATA_1 );
		$this->assertTrue( $font1->has_font_faces() );

		$font2 = new WP_Font_Family( self::FONT_DATA_2 );
		$this->assertFalse( $font2->has_font_faces() );
	}

	function test_install_and_uninstall_google_font() {
		$font = new WP_Font_Family( self::FONT_DATA_1 );
		$font->install();

		// Check that the post was created
		$post = $font->get_font_post();
		$this->assertInstanceof( 'WP_Post', $post );

		// Check that the post has the correct data
		$this->assertSame( 'Piazzolla' , $post->post_title );
		$this->assertSame( 'piazzolla' , $post->post_name );
		$content = json_decode( $post->post_content, true );
		$this->assertSame( 'Piazzolla' , $content['fontFamily'] );
		$this->assertSame( 'piazzolla' , $content['slug'] );
		$this->assertSame( 'Piazzolla' , $content['fontFace'][0]['fontFamily'] );
		$this->assertSame( 'italic' , $content['fontFace'][0]['fontStyle'] );
		$this->assertSame( '400' , $content['fontFace'][0]['fontWeight'] );

		// Check that the font file src was updated to the local font asset
		$this->assertStringEndsWith( '/piazzolla_italic_400.ttf', $content['fontFace'][0]['src'] );

		// Check that the font file was created
		$this->assertTrue( file_exists( WP_FONTS_DIR . '/piazzolla_italic_400.ttf' ) );

		$font->uninstall();

		// Check that the post was deleted
		$post = $font->get_font_post();
		$this->assertNull( $post );

		// Check that the font asset was deleted
		$this->assertFalse( file_exists( WP_FONTS_DIR . '/piazzolla_italic_400.ttf' ) );
	}

	function test_install_and_uninstall_font_without_faces() {
		$font = new WP_Font_Family( self::FONT_DATA_2 );
		$font->install();

		// Check that the post was created
		$post = $font->get_font_post();
		$this->assertInstanceof( 'WP_Post', $post );

		// Check that the post has the correct data
		$this->assertSame( 'Arial', $post->post_title );
		$this->assertSame( 'arial', $post->post_name );
		$content = json_decode( $post->post_content, true );
		$this->assertSame( 'Arial', $content['fontFamily'] );
		$this->assertSame( 'arial', $content['slug'] );
		$this->assertArrayNotHasKey( 'fontFace', $content );

		$font->uninstall();

		// Check that the post was deleted
		$post = $font->get_font_post();
		$this->assertNull( $post );
	}


	function test_install_and_uninstall_local_fonts() {
		// TODO: Fix this test. Is failing because the font file is not being copied from the temp dir to the fonts folder
		// We need to figure out why move_uploaded_file call in the WP_Font_Family::move_font_face_asset function is not working while testing
		$local_font = array(
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
		);

		$files = array(
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
		);

		$font = new WP_Font_Family( $local_font );
		$data = $font->install( $files );

		// Check that the post was created
		$post = $font->get_font_post();
		$this->assertInstanceof( 'WP_Post', $post );

		// Check that the post has the correct data
		$this->assertSame( 'Inter', $post->post_title );
		$this->assertSame( 'inter', $post->post_name );
		$content = json_decode( $post->post_content, true );
		$this->assertSame( 'Inter', $content['fontFamily'] );
		$this->assertSame( 'inter', $content['slug'] );

		// Check that the font file src was updated to the local font asset
		$this->assertStringEndsWith( '/inter_normal_400.ttf', $content['fontFace'][0]['src'] );
		$this->assertStringEndsWith( '/inter_normal_500.ttf', $content['fontFace'][1]['src'] );

		// Check that the font file was created
		$this->assertTrue( file_exists( WP_FONTS_DIR . '/inter_normal_400.ttf' ) );
		$this->assertTrue( file_exists( WP_FONTS_DIR . '/inter_normal_500.ttf' ) );

		$font->uninstall();

		// Check that the post was deleted
		$post = $font->get_font_post();
		$this->assertNull( $post );

		// Check that the font asset was deleted
		$this->assertFalse( file_exists( WP_FONTS_DIR . '/inter_normal_400.ttf' ) );
		$this->assertFalse( file_exists( WP_FONTS_DIR . '/inter_normal_500.ttf' ) );
	}

}
