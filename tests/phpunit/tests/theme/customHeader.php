<?php
/**
 * @group themes
 */
class Tests_Theme_Custom_Header extends WP_UnitTestCase {

	static $post;

	protected static $header_video_id;

	public static function wpSetUpBeforeClass( $factory ) {
		self::$post = self::factory()->post->create( array(
			'post_status' => 'publish',
		) );

		$file = DIR_TESTDATA . '/uploads/small-video.mp4';
		self::$header_video_id = $factory->attachment->create_upload_object( $file );
	}

	function setUp() {
		parent::setUp();

		require_once( ABSPATH . WPINC . '/class-wp-customize-manager.php' );
		$GLOBALS['wp_customize'] = new WP_Customize_Manager();
		$this->customize_manager = $GLOBALS['wp_customize'];

		wp_dequeue_script( 'wp-custom-header' );
	}

	function tearDown() {
		$this->customize_manager = null;
		unset( $GLOBALS['wp_customize'] );

		remove_theme_support( 'custom-header' );
		remove_theme_mod( 'header_image' );
		remove_theme_mod( 'header_image_data' );
		remove_theme_mod( 'header_video' );
		remove_theme_mod( 'external_header_video' );

		parent::tearDown();
	}

	function test_add_and_remove_theme_support() {
		$this->_add_theme_support();
		$this->assertTrue( current_theme_supports( 'custom-header' ) );
		remove_theme_support( 'custom-header' );
		$this->assertFalse( current_theme_supports( 'custom-header' ) );
	}

	function test_get_header_image_without_registered_default() {
		$this->_add_theme_support();
		$image = get_header_image();
		$this->assertFalse( has_header_image() );
		$this->assertEmpty( $image );
	}

	function test_get_header_image_with_registered_default() {
		$default = 'http://localhost/default-header.jpg';
		$this->_add_theme_support( array( 'default-image' => $default ) );

		$image = get_header_image();
		$this->assertTrue( has_header_image() );
		$this->assertEquals( $default, $image );
	}

	function test_get_header_image_from_theme_mod() {
		$default = 'http://localhost/default-header.jpg';
		$custom = 'http://localhost/custom-header.jpg';
		$this->_add_theme_support( array( 'default-image' => $default ) );

		set_theme_mod( 'header_image', $custom );
		$image = get_header_image();
		$this->assertEquals( $custom, $image );
		$this->assertTrue( has_header_image() );

		set_theme_mod( 'header_image', 'remove-header' );
		$image = get_header_image();
		$this->assertFalse( has_header_image() );
		$this->assertFalse( $image );
	}

	function test_get_header_image_tag_without_registered_default_image() {
		$this->_add_theme_support();
		$html = get_header_image_tag();
		$this->assertEmpty( $html );
	}

	function test_get_header_image_tag_with_registered_default_image() {
		$default = 'http://localhost/default-header.jpg';
		$this->_add_theme_support( array( 'default-image' => $default ) );

		$html = get_header_image_tag();
		$this->assertStringStartsWith( '<img ', $html );
		$this->assertContains( sprintf( 'src="%s"', $default ), $html );
	}

	/**
	 * @ticket 38633
	 */
	function test_get_header_image_tag_with_registered_default_image_and_remove_header_theme_mod() {
		$default = 'http://localhost/default-header.jpg';
		$this->_add_theme_support( array( 'default-image' => $default ) );

		set_theme_mod( 'header_image', 'remove-header' );
		$html = get_header_image_tag();
		$this->assertEmpty( $html );
	}

	function test_get_header_image_tag_with_registered_default_image_and_custom_theme_mod() {
		$default = 'http://localhost/default-header.jpg';
		$custom = 'http://localhost/custom-header.jpg';
		$this->_add_theme_support( array( 'default-image' => $default ) );

		set_theme_mod( 'header_image', $custom );
		$html = get_header_image_tag();
		$this->assertStringStartsWith( '<img ', $html );
		$this->assertContains( sprintf( 'src="%s"', $custom ), $html );
	}

	function test_get_custom_header_markup_without_registered_default_image() {
		$this->_add_theme_support();

		$html = get_custom_header_markup();
		$this->assertFalse( has_custom_header() );
		$this->assertEmpty( $html );

		// The container should always be returned in the Customizer preview.
		$this->_set_customize_previewing( true );
		$html = get_custom_header_markup();
		$this->assertEquals( '<div id="wp-custom-header" class="wp-custom-header"></div>', $html );
	}

	function test_get_custom_header_markup_with_registered_default_image() {
		$default = 'http://localhost/default-header.jpg';
		$this->_add_theme_support( array( 'default-image' => $default ) );
		$html = get_custom_header_markup();
		$this->assertTrue( has_custom_header() );
		$this->assertStringStartsWith( '<div id="wp-custom-header" class="wp-custom-header">', $html );
		$this->assertContains( sprintf( 'src="%s"', $default ), $html );
	}

	function test_get_header_video_url() {
		$this->_add_theme_support( array( 'video' => true ) );

		$this->assertFalse( has_header_video() );
		set_theme_mod( 'header_video', self::$header_video_id );
		$this->assertTrue( has_header_video() );
		$this->assertEquals( wp_get_attachment_url( self::$header_video_id ), get_header_video_url() );
	}

	function test_get_external_header_video_url() {
		$external = 'http://example.com/custom-video.mp4';
		$this->_add_theme_support( array( 'video' => true ) );

		$this->assertFalse( has_header_video() );
		set_theme_mod( 'external_header_video', $external );
		$this->assertTrue( has_header_video() );
		$this->assertEquals( $external, get_header_video_url() );
	}

	function test_get_header_video_url_prefers_local_video() {
		$external = 'http://example.com/custom-video.mp4';
		$this->_add_theme_support( array( 'video' => true ) );

		set_theme_mod( 'header_video', self::$header_video_id );
		set_theme_mod( 'external_header_video', $external );
		$this->assertEquals( wp_get_attachment_url( self::$header_video_id ), get_header_video_url() );
	}

	function test_get_custom_header_markup_with_video_and_without_an_image() {
		$custom = 'http://localhost/custom-video.mp4';
		$this->_add_theme_support( array( 'video' => true, 'video-active-callback' => '__return_true' ) );

		set_theme_mod( 'external_header_video', $custom );
		$html = get_custom_header_markup();
		$this->assertTrue( has_header_video() );
		$this->assertTrue( has_custom_header() );
		$this->assertEquals( '<div id="wp-custom-header" class="wp-custom-header"></div>', $html );
	}

	function test_header_script_is_not_enqueued_by_the_custom_header_markup_without_video() {
		$this->_add_theme_support( array( 'video' => true, 'video-active-callback' => '__return_true' ) );

		ob_start();
		the_custom_header_markup();
		ob_end_clean();
		$this->assertFalse( wp_script_is( 'wp-custom-header', 'enqueued' ) );

		set_theme_mod( 'header_image', 'http://localhost/custom-header.jpg' );

		ob_start();
		the_custom_header_markup();
		ob_end_clean();
		$this->assertFalse( wp_script_is( 'wp-custom-header', 'enqueued' ) );
	}

	function test_header_script_is_not_enqueued_by_the_custom_header_markup_when_active_callback_is_false() {
		$this->_add_theme_support( array( 'video' => true, 'video-active-callback' => '__return_false' ) );
		set_theme_mod( 'external_header_video', 'http://localhost/custom-video.mp4' );

		ob_start();
		the_custom_header_markup();
		ob_end_clean();
		$this->assertFalse( wp_script_is( 'wp-custom-header', 'enqueued' ) );
	}

	function test_header_script_is_enqueued_by_the_custom_header_markup_without_video_when_previewing_in_customizer() {
		$this->_add_theme_support( array( 'video' => true, 'video-active-callback' => '__return_true' ) );
		$this->_set_customize_previewing( true );

		ob_start();
		the_custom_header_markup();
		ob_end_clean();
		$this->assertTrue( wp_script_is( 'wp-custom-header', 'enqueued' ) );
	}

	function test_header_script_is_enqueued_by_the_custom_header_markup_with_video() {
		$this->_add_theme_support( array( 'video' => true, 'video-active-callback' => '__return_true' ) );
		set_theme_mod( 'external_header_video', 'http://localhost/custom-video.mp4' );

		ob_start();
		the_custom_header_markup();
		ob_end_clean();
		$this->assertTrue( wp_script_is( 'wp-custom-header', 'enqueued' ) );
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

	function _set_customize_previewing( $value ) {
		$class = new ReflectionClass( 'WP_Customize_Manager' );
		$property = $class->getProperty( 'previewing' );
		$property->setAccessible( true );
		$property->setValue( $this->customize_manager, $value );
	}
}
