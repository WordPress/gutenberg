<?php

/**
 * Test cases for deprecated functions, arguments, and files
 *
 * @package    WordPress
 * @subpackage Unit Tests
 * @since      3.5
 * @group      deprecated
 */
class Test_Functions_Deprecated extends WP_UnitTestCase {

	/**
	 * List of functions that have been passed through _deprecated_function()
	 * @var string[]
	 */
	protected $_deprecated_functions = array();

	/**
	 * List of arguments that have been passed through _deprecated_argument()
	 * @var string[]
	 */
	protected $_deprecated_arguments = array();

	/**
	 * List of files that have been passed through _deprecated_file()
	 * @var string[]
	 */
	protected $_deprecated_files = array();

	/**
	 * Set up the test fixture
	 * @return void
	 */
	public function setUp() {
		parent::setUp();
		$this->_deprecated_functions = array();
		$this->_deprecated_arguments = array();
		$this->_deprecated_files = array();
		add_action( 'deprecated_function_run' , array( $this, 'deprecated_function' ), 10, 3 );
		add_action( 'deprecated_function_trigger_error', '__return_false' );
		add_action( 'deprecated_argument_run' , array( $this, 'deprecated_argument' ), 10, 3 );
		add_action( 'deprecated_argument_trigger_error', '__return_false' );
		add_action( 'deprecated_file_included' , array( $this, 'deprecated_file' ), 10, 4 );
		add_action( 'deprecated_file_trigger_error', '__return_false' );
	}

	/**
	 * Tear down the test fixture
	 * @return void
	 */
	public function teardown() {
		remove_action( 'deprecated_function_run' , array( $this, 'deprecated_function' ), 10, 3 );
		remove_action( 'deprecated_function_trigger_error', '__return_false' );
		remove_action( 'deprecated_argument_run' , array( $this, 'deprecated_argument' ), 10, 3 );
		remove_action( 'deprecated_argument_trigger_error', '__return_false' );
		remove_action( 'deprecated_file_included' , array( $this, 'deprecated_argument' ), 10, 4 );
		remove_action( 'deprecated_file_trigger_error', '__return_false' );
		parent::tearDown();
	}

	/**
	 * Catch functions that have passed through _deprecated_function
	 * @param string $function
	 * @param string $replacement
	 * @param float $version
	 * @return void
	 */
	public function deprecated_function( $function, $replacement, $version ) {
		$this->_deprecated_functions[] = array(
			'function'    => $function,
			'replacement' => $replacement,
			'version'     => $version
		);
	}

	/**
	 * Catch arguments that have passed through _deprecated_argument
	 * @param string $argument
	 * @param string $message
	 * @param float $version
	 * @return void
	 */
	public function deprecated_argument( $argument, $message, $version ) {
		$this->_deprecated_arguments[] = array(
			'argument' => $argument,
			'message'  => $message,
			'version'  => $version
		);
	}

	/**
	 * Catch arguments that have passed through _deprecated_argument
	 * @param string $argument
	 * @param string $message
	 * @param float $version
	 * @return void
	 */
	public function deprecated_file( $file, $version, $replacement, $message ) {
		$this->_deprecated_files[] = array(
			'file'        => $file,
			'version'     => $version,
			'replacement' => $replacement,
			'message'     => $message
		);
	}

	/**
	 * Check if something was deprecated
	 * @param string $type argument|function|file
	 * @param string $name
	 * @return array|false
	 */
	protected function was_deprecated( $type, $name ) {
		switch ( $type ) {
			case 'argument' :
				$search = $this->_deprecated_arguments;
				$key    = 'argument';
				break;
			case 'function' :
				$search = $this->_deprecated_functions;
				$key    = 'function';
				break;
			default :
				$search = $this->_deprecated_files;
				$key    = 'file';
		}
		foreach ( $search as $v ) {
			if ( $name == $v[$key] ) {
				return $v;
			}
		}
		return false;
	}

	/**
	 * Test that wp_save_image_file has a deprecated argument when passed a GD resource
	 * @ticket 6821
	 * @expectedDeprecated wp_save_image_file
	 */
	public function test_wp_save_image_file_deprecated_with_gd_resource() {
		if ( !function_exists( 'imagejpeg' ) )
			$this->markTestSkipped( 'jpeg support unavailable' );

		// Call wp_save_image_file
		include_once( ABSPATH . 'wp-admin/includes/image-edit.php' );
		$file = wp_tempnam();
		$img = imagecreatefromjpeg( DIR_TESTDATA . '/images/canola.jpg' );
		wp_save_image_file( $file, $img, 'image/jpeg', 1 );
		imagedestroy( $img );
		unlink( $file );

		// Check if the arg was deprecated
		$check = $this->was_deprecated( 'argument', 'wp_save_image_file' );
		$this->assertNotEmpty( $check );
	}

	/**
	 * Test that wp_save_image_file doesn't have a deprecated argument when passed a WP_Image_Editor
	 * @ticket 6821
	 */
	public function test_wp_save_image_file_not_deprecated_with_wp_image_editor() {
		if ( !function_exists( 'imagejpeg' ) )
			$this->markTestSkipped( 'jpeg support unavailable' );

		// Call wp_save_image_file
		include_once( ABSPATH . 'wp-admin/includes/image-edit.php' );
		$file = wp_tempnam();
		$img = wp_get_image_editor( DIR_TESTDATA . '/images/canola.jpg' );
		wp_save_image_file( $file, $img, 'image/jpeg', 1 );
		unset( $img );
		unlink( $file );

		// Check if the arg was deprecated
		$check = $this->was_deprecated( 'argument', 'wp_save_image_file' );
		$this->assertFalse( $check );
	}
}
