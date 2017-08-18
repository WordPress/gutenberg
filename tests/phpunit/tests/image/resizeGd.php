<?php

/**
 * @group image
 * @group media
 * @group upload
 * @group resize
 */
require_once( dirname( __FILE__ ) . '/resize.php' );

class Test_Image_Resize_GD extends WP_Tests_Image_Resize_UnitTestCase {

	/**
	 * Use the GD image editor engine
	 * @var string
	 */
	public $editor_engine = 'WP_Image_Editor_GD';

	public function setUp() {
		require_once( ABSPATH . WPINC . '/class-wp-image-editor.php' );
		require_once( ABSPATH . WPINC . '/class-wp-image-editor-gd.php' );

		parent::setUp();
	}

	/**
	 * Try resizing a php file (bad image)
	 * @ticket 6821
	 */
	public function test_resize_bad_image() {

		$image = $this->resize_helper( DIR_TESTDATA.'/export/crazy-cdata.xml', 25, 25 );
		$this->assertInstanceOf( 'WP_Error', $image );
		$this->assertEquals( 'invalid_image', $image->get_error_code() );
	}

}
