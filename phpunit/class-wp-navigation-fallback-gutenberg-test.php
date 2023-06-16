<?php
/**
 * Tests WP_Navigation_Fallback_Gutenberg
 *
 * @package WordPress
 */

/**
 * Tests for the WP_Navigation_Fallback_Gutenberg class.
 */
class WP_Navigation_Fallback_Gutenberg_Test extends WP_UnitTestCase {

	protected static $admin_user;
	protected static $editor_user;

	public static function wpSetUpBeforeClass( $factory ) {
		self::$admin_user = $factory->user->create( array( 'role' => 'administrator' ) );

		self::$editor_user = $factory->user->create( array( 'role' => 'editor' ) );
	}

	public function set_up() {
		parent::set_up();

		wp_set_current_user( self::$admin_user );
	}

	/**
	 * @covers WP_REST_Navigation_Fallback_Controller
	 */
	public function test_it_exists() {
		$this->assertTrue( class_exists( 'WP_Navigation_Fallback_Gutenberg' ), 'WP_Navigation_Fallback_Gutenberg class should exist.' );
	}


	/**
	 * @covers WP_REST_Navigation_Fallback_Controller::get_fallback
	 */
	public function test_should_return_a_default_fallback_navigation_menu_in_absence_of_other_fallbacks() {
		$data = WP_Navigation_Fallback_Gutenberg::get_fallback();

		$this->assertInstanceOf( 'WP_Post', $data, 'Response should be of the correct type.' );

		$this->assertEquals( 'wp_navigation', $data->post_type, 'Fallback menu type should be `wp_navigation`' );

		$this->assertEquals( 'Navigation', $data->post_title, 'Fallback menu title should be the default fallback title' );

		$this->assertEquals( 'navigation', $data->post_name, 'Fallback menu slug (post_name) should be the default slug' );

		$this->assertEquals( '<!-- wp:page-list /-->', $data->post_content );

		$navs_in_db = $this->get_navigations_in_database();

		$this->assertCount( 1, $navs_in_db, 'The fallback Navigation post should be the only one in the database.' );
	}

	/**
	 * @covers WP_REST_Navigation_Fallback_Controller::get_fallback
	 */
	public function test_should_return_a_default_fallback_navigation_menu_with_no_blocks_if_page_list_block_is_not_registered() {

		$original_page_list_block = WP_Block_Type_Registry::get_instance()->get_registered( 'core/page-list' );

		unregister_block_type( 'core/page-list' );

		$data = WP_Navigation_Fallback_Gutenberg::get_fallback();

		$this->assertInstanceOf( 'WP_Post', $data, 'Response should be of the correct type.' );

		$this->assertNotEquals( '<!-- wp:page-list /-->', $data->post_content, 'Navigation Menu should not contain a Page List block.' );

		$this->assertEmpty( $data->post_content, 'Menu should be empty.' );

		register_block_type( 'core/page-list', $original_page_list_block );
	}

	/**
	 * @covers WP_REST_Navigation_Fallback_Controller::get_fallback
	 */
	public function test_should_handle_consecutive_invocations() {
		// Invoke the method multiple times to ensure that it doesn't create a new fallback menu on each invocation.
		WP_Navigation_Fallback_Gutenberg::get_fallback();
		WP_Navigation_Fallback_Gutenberg::get_fallback();

		// Assert on the final invocation.
		$data = WP_Navigation_Fallback_Gutenberg::get_fallback();

		$this->assertInstanceOf( 'WP_Post', $data, 'Response should be of the correct type.' );

		$this->assertEquals( 'Navigation', $data->post_title, 'Fallback menu title should be the default title' );

		$navs_in_db = $this->get_navigations_in_database();

		$this->assertCount( 1, $navs_in_db, 'The fallback Navigation post should be the only one in the database.' );
	}

	/**
	 * @covers WP_REST_Navigation_Fallback_Controller::get_fallback
	 */
	public function test_should_return_the_most_recently_created_navigation_menu() {

		self::factory()->post->create_and_get(
			array(
				'post_type'    => 'wp_navigation',
				'post_title'   => 'Existing Navigation Menu 1',
				'post_content' => '<!-- wp:page-list /-->',
			)
		);

		$most_recently_published_nav = self::factory()->post->create_and_get(
			array(
				'post_type'    => 'wp_navigation',
				'post_title'   => 'Existing Navigation Menu 2',
				'post_content' => '<!-- wp:navigation-link {"label":"Hello world","type":"post","id":1,"url":"/hello-world","kind":"post-type"} /-->',
			)
		);

		$data = WP_Navigation_Fallback_Gutenberg::get_fallback();

		$this->assertInstanceOf( 'WP_Post', $data, 'Response should be of the correct type.' );

		$this->assertEquals( $most_recently_published_nav->post_title, $data->post_title, 'Fallback menu title should be the same as the most recently created menu.' );

		$this->assertEquals( $most_recently_published_nav->post_name, $data->post_name, 'Post name should be the same as the most recently created menu.' );

		$this->assertEquals( $most_recently_published_nav->post_content, $data->post_content, 'Post content should be the same as the most recently created menu.' );

		// Check that no new Navigation menu was created.
		$navs_in_db = $this->get_navigations_in_database();

		$this->assertCount( 2, $navs_in_db, 'Only the existing Navigation menus should be present in the database.' );
	}

	/**
	 * @covers WP_REST_Navigation_Fallback_Controller::get_fallback
	 */
	public function test_should_return_fallback_navigation_from_existing_classic_menu_if_no_navigation_menus_exist() {
		$menu_id = wp_create_nav_menu( 'Existing Classic Menu' );

		wp_update_nav_menu_item(
			$menu_id,
			0,
			array(
				'menu-item-title'  => 'Classic Menu Item 1',
				'menu-item-url'    => '/classic-menu-item-1',
				'menu-item-status' => 'publish',
			)
		);

		$data = WP_Navigation_Fallback_Gutenberg::get_fallback();

		$this->assertInstanceOf( 'WP_Post', $data, 'Response should be of the correct type.' );

		$this->assertEquals( 'Existing Classic Menu', $data->post_title, 'Fallback menu title should be the same as the classic menu.' );

		// Assert that the fallback contains a navigation-link block.
		$this->assertStringContainsString( '<!-- wp:navigation-link', $data->post_content, 'The fallback Navigation Menu should contain a `core/navigation-link` block.' );

		// Assert that fallback post_content contains the expected menu item title.
		$this->assertStringContainsString( '"label":"Classic Menu Item 1"', $data->post_content, 'The fallback Navigation Menu should contain menu item with a label matching the title of the menu item from the Classic Menu.' );

		// Assert that fallback post_content contains the expected menu item url.
		$this->assertStringContainsString( '"url":"/classic-menu-item-1"', $data->post_content, 'The fallback Navigation Menu should contain menu item with a url matching the slug of the menu item from the Classic Menu.' );

		// Check that only a single Navigation fallback was created.
		$navs_in_db = $this->get_navigations_in_database();
		$this->assertCount( 1, $navs_in_db, 'A single Navigation menu should be present in the database.' );

	}

	/**
	 * @covers WP_REST_Navigation_Fallback_Controller::get_fallback
	 */
	public function test_should_prioritise_fallback_to_classic_menu_in_primary_location() {
		$pl_menu_id = wp_create_nav_menu( 'Classic Menu in Primary Location' );

		wp_update_nav_menu_item(
			$pl_menu_id,
			0,
			array(
				'menu-item-title'  => 'PL Classic Menu Item',
				'menu-item-url'    => '/pl-classic-menu-item',
				'menu-item-status' => 'publish',
			)
		);

		$another_menu_id = wp_create_nav_menu( 'Another Classic Menu' );

		wp_update_nav_menu_item(
			$another_menu_id,
			0,
			array(
				'menu-item-title'  => 'Another Classic Menu Item',
				'menu-item-url'    => '/another-classic-menu-item',
				'menu-item-status' => 'publish',
			)
		);

		$locations            = get_nav_menu_locations();
		$locations['primary'] = $pl_menu_id;
		$locations['header']  = $another_menu_id;
		set_theme_mod( 'nav_menu_locations', $locations );

		$data = WP_Navigation_Fallback_Gutenberg::get_fallback();

		$this->assertInstanceOf( 'WP_Post', $data, 'Response should be of the correct type.' );

		$this->assertEquals( 'Classic Menu in Primary Location', $data->post_title, 'Fallback menu title should match the menu in the "primary" location.' );
	}

	/**
	 * @covers WP_REST_Navigation_Fallback_Controller::get_fallback
	 */
	public function test_should_fallback_to_classic_menu_with_primary_slug() {

		// Creates a classic menu with the slug "primary".
		$primary_menu_id = wp_create_nav_menu( 'Primary' );

		wp_update_nav_menu_item(
			$primary_menu_id,
			0,
			array(
				'menu-item-title'  => 'Classic Menu Item',
				'menu-item-url'    => '/classic-menu-item',
				'menu-item-status' => 'publish',
			)
		);

		$another_menu_id = wp_create_nav_menu( 'Another Classic Menu' );

		wp_update_nav_menu_item(
			$another_menu_id,
			0,
			array(
				'menu-item-title'  => 'Another Classic Menu Item',
				'menu-item-url'    => '/another-classic-menu-item',
				'menu-item-status' => 'publish',
			)
		);

		$data = WP_Navigation_Fallback_Gutenberg::get_fallback();

		$this->assertInstanceOf( 'WP_Post', $data, 'Response should be of the correct type.' );

		$this->assertEquals( 'Primary', $data->post_title, 'Fallback menu title should match the menu with the slug "primary".' );
	}

	/**
	 * @covers WP_REST_Navigation_Fallback_Controller::get_fallback
	 */
	public function test_should_fallback_to_most_recently_created_classic_menu() {

		// Creates a classic menu with the slug "primary".
		$primary_menu_id = wp_create_nav_menu( 'Older Classic Menu' );

		wp_update_nav_menu_item(
			$primary_menu_id,
			0,
			array(
				'menu-item-title'  => 'Classic Menu Item',
				'menu-item-url'    => '/classic-menu-item',
				'menu-item-status' => 'publish',
			)
		);

		$most_recent_menu_id = wp_create_nav_menu( 'Most Recent Classic Menu' );

		wp_update_nav_menu_item(
			$most_recent_menu_id,
			0,
			array(
				'menu-item-title'  => 'Another Classic Menu Item',
				'menu-item-url'    => '/another-classic-menu-item',
				'menu-item-status' => 'publish',
			)
		);

		$data = WP_Navigation_Fallback_Gutenberg::get_fallback();

		$this->assertInstanceOf( 'WP_Post', $data, 'Response should be of the correct type.' );

		$this->assertEquals( 'Most Recent Classic Menu', $data->post_title, 'Fallback menu title should match the menu that was created most recently.' );
	}

	/**
	 * @covers WP_REST_Navigation_Fallback_Controller::get_fallback
	 */
	public function test_should_not_create_fallback_from_classic_menu_if_a_navigation_menu_already_exists() {
		$menu_id = wp_create_nav_menu( 'Existing Classic Menu' );

		wp_update_nav_menu_item(
			$menu_id,
			0,
			array(
				'menu-item-title'  => 'Classic Menu Item 1',
				'menu-item-url'    => '/classic-menu-item-1',
				'menu-item-status' => 'publish',
			)
		);

		$existing_navigation_menu = self::factory()->post->create_and_get(
			array(
				'post_type'    => 'wp_navigation',
				'post_title'   => 'Existing Navigation Menu 1',
				'post_content' => '<!-- wp:page-list /-->',
			)
		);

		$data = WP_Navigation_Fallback_Gutenberg::get_fallback();

		$this->assertInstanceOf( 'WP_Post', $data, 'Response should be of the correct type.' );

		$this->assertEquals( $existing_navigation_menu->post_title, $data->post_title, 'Fallback menu title should be the same as the existing Navigation menu.' );

		$this->assertNotEquals( 'Existing Classic Menu', $data->post_title, 'Fallback menu title should not be the same as the Classic Menu.' );

		// Check that only a single Navigation fallback was created.
		$navs_in_db = $this->get_navigations_in_database();

		$this->assertCount( 1, $navs_in_db, 'Only the existing Navigation menus should be present in the database.' );

	}

	private function get_navigations_in_database() {
		$navs_in_db = new WP_Query(
			array(
				'post_type'      => 'wp_navigation',
				'post_status'    => 'publish',
				'posts_per_page' => -1,
				'orderby'        => 'date',
				'order'          => 'DESC',
			)
		);

		return $navs_in_db->posts ? $navs_in_db->posts : array();
	}

}
