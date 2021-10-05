<?php

class WP_Navigation_Page_Test extends WP_UnitTestCase {
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

	function test_gutenberg_navigation_get_menus_endpoint() {
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
		);

		$this->callback->expects( $this->once() )
			->method( 'preload_paths_callback' )
			->with( $expected_preload_paths )
			->willReturn( array() );

		$menu_id       = mt_rand( 1, 1000 );
		$menu          = new StdClass;
		$menu->term_id = $menu_id;
		$this->callback->expects( $this->once() )
			->method( 'wp_nav_menus_callback' )
			->willReturn( new WP_Term() );

		set_current_screen( 'gutenberg_page_gutenberg-navigation' );
		gutenberg_navigation_init( 'gutenberg_page_gutenberg-navigation' );
	}
}

class WP_Navigation_Page_Test_Callback {

	public function preload_paths_callback() {}
	public function wp_nav_menus_callback() {}
}
