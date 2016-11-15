<?php
/**
 * @group themes
 */
class Tests_Theme_Custom_Header extends WP_UnitTestCase {

	static $post;

	public static function wpSetUpBeforeClass( $factory ) {
		self::$post = self::factory()->post->create( array(
			'post_status' => 'publish',
		) );
	}

	function tearDown() {
		remove_theme_support( 'custom-header' );
		parent::tearDown();
	}

	/**
	 * @ticket 38738
	 */
	function test_video_header_callback_front_page_from_front_page() {
		$this->_add_theme_support( array(
			'video' => true,
		) );

		$this->go_to( home_url() );

		$result = is_header_video_active();

		$this->assertTrue( $result );
	}

	/**
	 * @ticket 38738
	 */
	function test_video_header_callback_front_page_from_elsewhere() {
		$this->_add_theme_support( array(
			'video' => true,
		) );

		$this->go_to( get_permalink( self::$post ) );

		$result = is_header_video_active();

		$this->assertFalse( $result );
	}

	/**
	 * @ticket 38738
	 */
	function test_video_header_callback_globally_from_front_page() {
		$this->_add_theme_support( array(
			'video' => true,
			'video-active-callback' => '__return_true',
		) );

		$this->go_to( home_url() );

		$result = is_header_video_active();

		$this->assertTrue( $result );
	}

	/**
	 * @ticket 38738
	 */
	function test_video_header_callback_globally_from_elsewhere() {
		$this->_add_theme_support( array(
			'video' => true,
			'video-active-callback' => '__return_true',
		) );

		$this->go_to( get_permalink( self::$post ) );

		$result = is_header_video_active();

		$this->assertTrue( $result );
	}

	/**
	 * @ticket 38738
	 */
	function test_video_header_callback_globally_with_negative_filter() {
		$this->_add_theme_support( array(
			'video' => true,
			'video-active-callback' => '__return_true',
		) );

		$this->go_to( get_permalink( self::$post ) );

		add_filter( 'is_header_video_active', '__return_false' );
		$result = is_header_video_active();
		remove_filter( 'is_header_video_active', '__return_false' );

		$this->assertFalse( $result );
	}

	/**
	 * Adds arguments directly to the $_wp_theme_features global. Calling
	 * add_theme_support( 'custom-header' ) will poison subsequent tests since
	 * it defines constants.
	 */
	function _add_theme_support( $args = array() ) {
		global $_wp_theme_features;

		$_wp_theme_features['custom-header'][0] = wp_parse_args( $args, array(
			'default-image' => '',
			'random-default' => false,
			'width' => 0,
			'height' => 0,
			'flex-height' => false,
			'flex-width' => false,
			'default-text-color' => '',
			'header-text' => true,
			'uploads' => true,
			'wp-head-callback' => '',
			'admin-head-callback' => '',
			'admin-preview-callback' => '',
			'video' => false,
			'video-active-callback' => 'is_front_page',
		) );
	}
}
