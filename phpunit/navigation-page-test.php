<?php
/**
 * This class is supposed to test the functionality of the navigation-page.php
 *
 * @package Gutenberg
 */

class WP_Navigation_Page_Test extends WP_UnitTestCase {
	/**
	 * @var WP_Navigation_Page_Test_Callback
	 */
	private $callback;

	/** @var WP_Scripts */
	private static $wp_scripts;

	public static function setUpBeforeClass() {
		parent::setUpBeforeClass();
		global $wp_scripts;
		static::$wp_scripts = clone $wp_scripts;
	}

	public static function tearDownAfterClass() {
		parent::tearDownAfterClass();
		global $wp_scripts;
		$wp_scripts = static::$wp_scripts;
	}

	public function setUp() {
		parent::setUp();
		$this->callback = $this->createMock( WP_Navigation_Page_Test_Callback::class );
	}

	public function tearDown() {
		parent::tearDown();
		remove_filter( 'navigation_editor_preload_paths', array( $this->callback, 'preload_paths_callback' ) );
		remove_filter( 'wp_get_nav_menus', array( $this->callback, 'wp_nav_menus_callback' ) );
		remove_filter( 'rest_pre_dispatch', array( $this->callback, 'preload_menus_rest_pre_dispatch_callback' ) );
	}

	public function test_gutenberg_navigation_init_function_generates_correct_preload_paths() {
		add_filter( 'navigation_editor_preload_paths', array( $this->callback, 'preload_paths_callback' ) );
		add_filter( 'wp_get_nav_menus', array( $this->callback, 'wp_nav_menus_callback' ) );

		$menu_id                = mt_rand( 1, 1000 );
		$expected_preload_paths = array(
			'/wp/v2/menu-locations',
			array(
				'/wp/v2/pages',
				'OPTIONS',
			),
			array(
				'/wp/v2/posts',
				'OPTIONS',
			),
			'/wp/v2/types?context=edit',
			"/wp/v2/menu-items?context=edit&menus={$menu_id}&per_page=100&_locale=user",
		);

		$this->callback->expects( $this->once() )
			->method( 'preload_paths_callback' )
			->with( $expected_preload_paths )
			->willReturn( array() );

		$menu          = new stdClass();
		$menu->term_id = $menu_id;
		$this->callback->expects( $this->once() )
			->method( 'wp_nav_menus_callback' )
			->with( array() )
			->willReturn( array( new WP_Term( $menu ) ) );

		set_current_screen( 'gutenberg_page_gutenberg-navigation' );
		gutenberg_navigation_init( 'gutenberg_page_gutenberg-navigation' );
	}

	public function test_gutenberg_navigation_editor_preload_menus_initializes_createMenuPreloadingMiddleware() {
		add_filter( 'rest_pre_dispatch', array( $this->callback, 'preload_menus_rest_pre_dispatch_callback' ) );
		$scripts = wp_scripts();
		$handle  = 'wp-edit-navigation';
		$scripts->remove( $handle );
		$scripts->add( $handle, 'https://test.test/test.js' );
		$response = new WP_REST_Response( array( 'someData' ) );
		$this->callback
			->expects( $this->once() )
			->method( 'preload_menus_rest_pre_dispatch_callback' )
			->willReturn( new $response );

		gutenberg_navigation_editor_preload_menus();

		/** @var _WP_Dependency $result */
		$result = $scripts->get_data( $handle, 'after' );
		$this->assertIsArray( $result );
		$this->assertArrayHasKey( 1, $result );
		$this->assertStringContainsString( 'wp.editNavigation.__unstableCreateMenuPreloadingMiddleware', $result[1] );
	}
}

/**
 * This is a utility test class for creating mocks of the callback functions
 */
class WP_Navigation_Page_Test_Callback {

	public function preload_paths_callback() {}
	public function wp_nav_menus_callback() {}
	public function preload_menus_rest_pre_dispatch_callback() {}
}
