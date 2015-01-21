<?php

/**
 * @group image
 * @group media
 * @group upload
 * @group resize
 */
require_once( dirname( __FILE__ ) . '/base.php' );

abstract class WP_Tests_Image_Resize_UnitTestCase extends WP_Image_UnitTestCase {

	function test_resize_jpg() {
		$image = $this->resize_helper( DIR_TESTDATA.'/images/test-image.jpg', 25, 25 );

		$this->assertEquals( 'test-image-25x25.jpg', basename( $image ) );
		list($w, $h, $type) = getimagesize($image);
		$this->assertEquals( 25, $w );
		$this->assertEquals( 25, $h );
		$this->assertEquals( IMAGETYPE_JPEG, $type );

		unlink( $image );
	}

	function test_resize_png() {
		$image = $this->resize_helper( DIR_TESTDATA.'/images/test-image.png', 25, 25 );

		if ( ! is_string( $image ) ) {  // WP_Error, stop GLib-GObject-CRITICAL assertion
			$this->markTestSkipped( sprintf( 'No PNG support in the editor engine %s on this system', $this->editor_engine ) );
			return;
		}

		$this->assertEquals( 'test-image-25x25.png', basename( $image ) );
		list($w, $h, $type) = getimagesize($image);
		$this->assertEquals( 25, $w );
		$this->assertEquals( 25, $h );
		$this->assertEquals( IMAGETYPE_PNG, $type );

		unlink( $image );
	}

	function test_resize_gif() {
		$image = $this->resize_helper( DIR_TESTDATA.'/images/test-image.gif', 25, 25 );

		if ( ! is_string( $image ) ) {  // WP_Error, stop GLib-GObject-CRITICAL assertion
			$this->markTestSkipped( sprintf( 'No GIF support in the editor engine %s on this system', $this->editor_engine ) );
			return;
		}

		$this->assertEquals( 'test-image-25x25.gif', basename( $image ) );
		list($w, $h, $type) = getimagesize($image);
		$this->assertEquals( 25, $w );
		$this->assertEquals( 25, $h );
		$this->assertEquals( IMAGETYPE_GIF, $type );

		unlink( $image );
	}

	function test_resize_larger() {
		// image_resize() should refuse to make an image larger
		$image = $this->resize_helper( DIR_TESTDATA.'/images/test-image.jpg', 100, 100 );

		$this->assertInstanceOf( 'WP_Error', $image );
		$this->assertEquals( 'error_getting_dimensions', $image->get_error_code() );
	}

	function test_resize_thumb_128x96() {
		$image = $this->resize_helper( DIR_TESTDATA.'/images/2007-06-17DSC_4173.JPG', 128, 96 );

		$this->assertEquals( '2007-06-17DSC_4173-64x96.jpg', basename( $image ) );
		list($w, $h, $type) = getimagesize($image);
		$this->assertEquals( 64, $w );
		$this->assertEquals( 96, $h );
		$this->assertEquals( IMAGETYPE_JPEG, $type );

		unlink( $image );
	}

	function test_resize_thumb_128x0() {
		$image = $this->resize_helper( DIR_TESTDATA.'/images/2007-06-17DSC_4173.JPG', 128, 0 );

		$this->assertEquals( '2007-06-17DSC_4173-128x193.jpg', basename( $image ) );
		list($w, $h, $type) = getimagesize($image);
		$this->assertEquals( 128, $w );
		$this->assertEquals( 193, $h );
		$this->assertEquals( IMAGETYPE_JPEG, $type );

		unlink( $image );
	}

	function test_resize_thumb_0x96() {
		$image = $this->resize_helper( DIR_TESTDATA.'/images/2007-06-17DSC_4173.JPG', 0, 96 );

		$this->assertEquals( '2007-06-17DSC_4173-64x96.jpg', basename( $image ) );
		list($w, $h, $type) = getimagesize($image);
		$this->assertEquals( 64, $w );
		$this->assertEquals( 96, $h );
		$this->assertEquals( IMAGETYPE_JPEG, $type );

		unlink( $image );
	}

	function test_resize_thumb_150x150_crop() {
		$image = $this->resize_helper( DIR_TESTDATA.'/images/2007-06-17DSC_4173.JPG', 150, 150, true );

		$this->assertEquals( '2007-06-17DSC_4173-150x150.jpg', basename( $image ) );
		list($w, $h, $type) = getimagesize($image);
		$this->assertEquals( 150, $w );
		$this->assertEquals( 150, $h );
		$this->assertEquals( IMAGETYPE_JPEG, $type );

		unlink( $image );
	}

	function test_resize_thumb_150x100_crop() {
		$image = $this->resize_helper( DIR_TESTDATA.'/images/2007-06-17DSC_4173.JPG', 150, 100, true );

		$this->assertEquals( '2007-06-17DSC_4173-150x100.jpg', basename( $image ) );
		list($w, $h, $type) = getimagesize($image);
		$this->assertEquals( 150, $w );
		$this->assertEquals( 100, $h );
		$this->assertEquals( IMAGETYPE_JPEG, $type );

		unlink( $image );
	}

	function test_resize_thumb_50x150_crop() {
		$image = $this->resize_helper( DIR_TESTDATA.'/images/2007-06-17DSC_4173.JPG', 50, 150, true );

		$this->assertEquals( '2007-06-17DSC_4173-50x150.jpg', basename( $image ) );
		list($w, $h, $type) = getimagesize($image);
		$this->assertEquals( 50, $w );
		$this->assertEquals( 150, $h );
		$this->assertEquals( IMAGETYPE_JPEG, $type );

		unlink( $image );
	}

	/**
	 * Try resizing a non-existent image
	 * @ticket 6821
	 */
	public function test_resize_non_existent_image() {
		$image = $this->resize_helper( DIR_TESTDATA.'/images/test-non-existent-image.jpg', 25, 25 );

		$this->assertInstanceOf( 'WP_Error', $image );
		$this->assertEquals( 'error_loading_image', $image->get_error_code() );
	}

	/**
	 * Function to help out the tests
	 */
	protected function resize_helper( $file, $width, $height, $crop = false ) {
		$editor = wp_get_image_editor( $file );

		if ( is_wp_error( $editor ) )
			return $editor;

		$resized = $editor->resize( $width, $height, $crop );
		 if ( is_wp_error( $resized ) )
			return $resized;

		$dest_file = $editor->generate_filename();
		$saved = $editor->save( $dest_file );

		if ( is_wp_error( $saved ) )
			return $saved;

		return $dest_file;
	}
}
