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

	public function setUp() {
		parent::setUp();
		$this->callback = $this->createMock( WP_Navigation_Page_Test_Callback::class );
		add_filter( 'navigation_editor_preload_paths', array( $this->callback, 'preload_paths_callback' ) );
		add_filter( 'wp_get_nav_menus', array( $this->callback, 'wp_nav_menus_callback' ) );
	}

	public function tearDown() {
		parent::tearDown();
		remove_filter( 'navigation_editor_preload_paths', array( $this->callback, 'preload_paths_callback' ) );
		remove_filter( 'wp_get_nav_menus', array( $this->callback, 'wp_nav_menus_callback' ) );
	}

	public function test_gutenberg_navigation_init_function_generates_correct_preload_paths() {
		$menu_id                = mt_rand( 1, 1000 );
		$expected_preload_paths = array(
			'/__experimental/menu-locations',
			array(
				'/wp/v2/pages',
				'OPTIONS',
			),
			array(
				'/wp/v2/posts',
				'OPTIONS',
			),
			'/__experimental/menus?per_page=100&context=edit&_locale=user',
			'/wp/v2/types?context=edit',
			"/__experimental/menu-items?context=edit&menus={$menu_id}&per_page=100&_locale=user",
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

	public function test_gutenberg_navigation_editor_preload_menus_function_returns_correct_data() {
		$menus_endpoint = gutenberg_navigation_get_menus_endpoint();
		$preload_data   = array(
			'/__experimental/menu-locations' => array( 'some menu locations' ),
			'OPTIONS'                        => array(
				array( 'some options requests' ),
			),
			$menus_endpoint                  => ( 'some menus' ),
		);

		$result = gutenberg_navigation_editor_preload_menus( $preload_data, 'navigation_editor' );
		$this->assertArrayHasKey( '/__experimental/menu-locations', $result );
		$this->assertArrayHasKey( 'OPTIONS', $result );
		$this->assertArrayNotHasKey( $menus_endpoint, $result );
	}
}


/**
 * This is a utility test class for creating mocks of the callback functions
 */
class WP_Navigation_Page_Test_Callback {

	public function preload_paths_callback() {}
	public function wp_nav_menus_callback() {}
}
