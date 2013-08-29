<?php

/**
 * Test the WP_Image_Editor_GD class
 * @group image
 * @group media
 * @group wp-image-editor-gd
 */

class Tests_Image_Editor_GD extends WP_Image_UnitTestCase {
	public $editor_engine = 'WP_Image_Editor_GD';

	public function setup() {
		require_once( ABSPATH . WPINC . '/class-wp-image-editor.php' );
		require_once( ABSPATH . WPINC . '/class-wp-image-editor-gd.php' );
		parent::setUp();
	}

	/**
	 * Check support for GD compatible mime types.
	 * 
	 */
	public function test_supports_mime_type() {
		$gd_image_editor = new WP_Image_Editor_GD( null );

		$this->assertTrue( $gd_image_editor->supports_mime_type( 'image/jpeg' ), 'Does not support image/jpeg' );
		$this->assertTrue( $gd_image_editor->supports_mime_type( 'image/png' ), 'Does not support image/png' );
		$this->assertTrue( $gd_image_editor->supports_mime_type( 'image/gif' ), 'Does not support image/gif' );
	}

	/**
	 * Test resizing an image, not using crop
	 * 
	 */
	public function test_resize() {

		$file = DIR_TESTDATA . '/images/gradient-square.jpg';

		$gd_image_editor = new WP_Image_Editor_GD( $file );
		$gd_image_editor->load();

		$gd_image_editor->resize( 100, 50 );

		$this->assertEquals( array( 'width' => 50, 'height' => 50 ), $gd_image_editor->get_size() );
	}

	/**
	 * Test resizing an image including cropping
	 * 
	 */
	public function test_resize_and_crop() {

		$file = DIR_TESTDATA . '/images/gradient-square.jpg';

		$gd_image_editor = new WP_Image_Editor_GD( $file );
		$gd_image_editor->load();

		$gd_image_editor->resize( 100, 50, true );

		$this->assertEquals( array( 'width' => 100, 'height' => 50 ), $gd_image_editor->get_size() );
	}

	/**
	 * Test cropping an image
	 */
	public function test_crop() {

		$file = DIR_TESTDATA . '/images/gradient-square.jpg';

		$gd_image_editor = new WP_Image_Editor_GD( $file );
		$gd_image_editor->load();

		$gd_image_editor->crop( 0, 0, 50, 50 );

		$this->assertEquals( array( 'width' => 50, 'height' => 50 ), $gd_image_editor->get_size() );

	}

	/**
	 * Test rotating an image 180 deg
	 */
	public function test_rotate() {

		$file = DIR_TESTDATA . '/images/gradient-square.jpg';

		$gd_image_editor = new WP_Image_Editor_GD( $file );
		$gd_image_editor->load();

		$property = new ReflectionProperty( $gd_image_editor, 'image' );
		$property->setAccessible( true );

		$color_top_left = imagecolorat( $property->getValue( $gd_image_editor ), 0, 0 );

		$gd_image_editor->rotate( 180 );

		$this->assertEquals( $color_top_left, imagecolorat( $property->getValue( $gd_image_editor ), 99, 99 ) );
	}

	/**
	 * Test flipping an image
	 */
	public function test_flip() {

		$file = DIR_TESTDATA . '/images/gradient-square.jpg';

		$gd_image_editor = new WP_Image_Editor_GD( $file );
		$gd_image_editor->load();

		$property = new ReflectionProperty( $gd_image_editor, 'image' );
		$property->setAccessible( true );

		$color_top_left = imagecolorat( $property->getValue( $gd_image_editor ), 0, 0 );

		$gd_image_editor->flip( true, false );

		$this->assertEquals( $color_top_left, imagecolorat( $property->getValue( $gd_image_editor ), 0, 99 ) );
	}

	/**
	 * Test the image created with WP_Image_Edior_GD preserves alpha when resizing
	 * 
	 * @ticket 23039
	 */
	public function test_image_preserves_alpha_on_resize() {

		$file = DIR_TESTDATA . '/images/transparent.png';

		$editor = wp_get_image_editor( $file );
		$editor->load();
		$editor->resize(5,5);
		$save_to_file = tempnam( get_temp_dir(), '' ) . '.png';
		
		$editor->save( $save_to_file );

		$this->assertImageAlphaAtPoint( $save_to_file, array( 0,0 ), 127 );

	}
	
	/**
	 * Test the image created with WP_Image_Edior_GD preserves alpha with no resizing etc
	 * 
	 * @ticket 23039
	 */
	public function test_image_preserves_alpha() {

		$file = DIR_TESTDATA . '/images/transparent.png';

		$editor = wp_get_image_editor( $file );
		$editor->load();

		$save_to_file = tempnam( get_temp_dir(), '' ) . '.png';
		
		$editor->save( $save_to_file );

		$this->assertImageAlphaAtPoint( $save_to_file, array( 0,0 ), 127 );
	}

}
