<?php

/**
 * Test the WP_Image_Editor base class
 * @group image
 * @group media
 */
class Tests_Image_Editor extends WP_Image_UnitTestCase {
	public $editor_engine = 'WP_Image_Editor_Mock';

	/**
	 * Setup test fixture
	 */
	public function setup() {
		require_once( ABSPATH . WPINC . '/class-wp-image-editor.php' );

		include_once( DIR_TESTDATA . '/../includes/mock-image-editor.php' );

		parent::setUp();
	}

	/**
	 * Test wp_get_image_editor() where load returns true
	 * @ticket 6821
	 */
	public function test_get_editor_load_returns_true() {
		$editor = wp_get_image_editor( DIR_TESTDATA . '/images/canola.jpg' );

		$this->assertInstanceOf( 'WP_Image_Editor_Mock', $editor );
	}

	/**
	 * Test wp_get_image_editor() where load returns false
	 * @ticket 6821
	 */
	public function test_get_editor_load_returns_false() {
		WP_Image_Editor_Mock::$load_return = new WP_Error();

		$editor = wp_get_image_editor( DIR_TESTDATA . '/images/canola.jpg' );

		$this->assertInstanceOf( 'WP_Error', $editor );

		WP_Image_Editor_Mock::$load_return = true;
	}

	/**
	 * Test test_quality
	 * @ticket 6821
	 */
	public function test_set_quality() {

		// Get an editor
		$editor = wp_get_image_editor( DIR_TESTDATA . '/images/canola.jpg' );

		// Ensure set_quality works
		$this->assertTrue( $editor->set_quality( 75 ) );
		$this->assertEquals( 75, $editor->get_quality() );

		// Ensure the quality filter works
		$func = create_function( '', "return 100;");
		add_filter( 'wp_editor_set_quality', $func );
		$this->assertTrue( $editor->set_quality( 75 ) );
		$this->assertEquals( 75, $editor->get_quality() );

		// Clean up
		remove_filter( 'wp_editor_set_quality', $func );
	}

	/**
	 * Test generate_filename
	 * @ticket 6821
	 */
	public function test_generate_filename() {

		// Get an editor
		$editor = wp_get_image_editor( DIR_TESTDATA . '/images/canola.jpg' );

		$property = new ReflectionProperty( $editor, 'size' );
		$property->setAccessible( true );
		$property->setValue( $editor, array(
			'height' => 50,
			'width'  => 100
		));

		// Test with no parameters
		$this->assertEquals( 'canola-100x50.jpg', basename( $editor->generate_filename() ) );

		// Test with a suffix only
		$this->assertEquals( 'canola-new.jpg', basename( $editor->generate_filename( 'new' ) ) );

		// Test with a destination dir only
		$this->assertEquals(trailingslashit( realpath( get_temp_dir() ) ), trailingslashit( realpath( dirname( $editor->generate_filename( null, get_temp_dir() ) ) ) ) );

		// Test with a suffix only
		$this->assertEquals( 'canola-100x50.png', basename( $editor->generate_filename( null, null, 'png' ) ) );

		// Combo!
		$this->assertEquals( trailingslashit( realpath( get_temp_dir() ) ) . 'canola-new.png', $editor->generate_filename( 'new', realpath( get_temp_dir() ), 'png' ) );
	}

	/**
	 * Test get_size
	 * @ticket 6821
	 */
	public function test_get_size() {

		$editor = wp_get_image_editor( DIR_TESTDATA . '/images/canola.jpg' );

		// Size should be false by default
		$this->assertNull( $editor->get_size() );

		// Set a size
		$size = array(
			'height' => 50,
			'width'  => 100
		);
		$property = new ReflectionProperty( $editor, 'size' );
		$property->setAccessible( true );
		$property->setValue( $editor, $size );

		$this->assertEquals( $size, $editor->get_size() );
	}

	/**
	 * Test get_suffix
	 * @ticket 6821
	 */
	public function test_get_suffix() {
		$editor = wp_get_image_editor( DIR_TESTDATA . '/images/canola.jpg' );

		// Size should be false by default
		$this->assertFalse( $editor->get_suffix() );

		// Set a size
		$size = array(
			'height' => 50,
			'width'  => 100
		);
		$property = new ReflectionProperty( $editor, 'size' );
		$property->setAccessible( true );
		$property->setValue( $editor, $size );

		$this->assertEquals( '100x50', $editor->get_suffix() );
	}
}
