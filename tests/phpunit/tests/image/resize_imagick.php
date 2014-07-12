<?php

/**
 * @group image
 * @group media
 * @group upload
 * @group resize
 */
require_once( dirname( __FILE__ ) . '/resize.php' );

class Test_Image_Resize_Imagick extends WP_Tests_Image_Resize_UnitTestCase {

	/**
	 * Use the Imagick image editor engine
	 * @var string
	 */
	public $editor_engine = 'WP_Image_Editor_Imagick';

	public function setUp() {
		require_once( ABSPATH . WPINC . '/class-wp-image-editor.php' );
		require_once( ABSPATH . WPINC . '/class-wp-image-editor-imagick.php' );

		parent::setUp();
	}
}