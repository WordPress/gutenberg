<?php

/**
 * @group image
 * @group media
 * @group upload
 */
class Test_Image_Resize_Imagick extends WP_Tests_Image_Resize_UnitTestCase {

	/**
	 * Use the Imagick image editor engine
	 * @var string
	 */
	public $editor_engine = 'WP_Image_Editor_Imagick';
}