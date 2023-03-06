<?php
/**
 * Tests Fallback Behavior for Navigation block
 *
 * @package    Gutenberg
 * @subpackage block-library
 * @group     Navigation block
 */

class Block_Library_Navigation_Fallbacks_Test extends WP_UnitTestCase {

	public function set_up() {
		parent::set_up();
		// Navigation menu will be created on Theme switch. Therefore in order to test
		// the behaviour of `gutenberg_block_core_navigation_create_fallback`
		// the auto-creation of a fallback must be disabled for this initial
		// theme switch.
		add_filter( 'block_core_navigation_skip_fallback', '__return_true' );
		switch_theme( 'emptytheme' );
		remove_filter( 'block_core_navigation_skip_fallback', '__return_true' );
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

	private function mock_wp_install() {
		$user = get_current_user();
		do_action( 'wp_install', $user );
	}

	/**
	 * @covers ::block_core_navigation_create_fallback
	 */
	public function test_should_auto_create_navigation_menu_on_wp_install() {
		$this->mock_wp_install();

		$navs_in_db = $this->get_navigations_in_database();
		$this->assertCount( 1, $navs_in_db, 'No Navigation Menu was found.' );
	}

	/**
	 * @covers ::block_core_navigation_create_fallback
	 */
	public function test_should_auto_create_navigation_menu_on_theme_switch() {
		// Remove any existing disabling filters.
		remove_filter( 'block_core_navigation_skip_fallback', '__return_true' );

		$navs_in_db = $this->get_navigations_in_database();
		$this->assertCount( 0, $navs_in_db, 'Navigation Menu should not exist before switching Theme.' );

		// Should trigger creation of Navigation Menu if one does not already exist.
		switch_theme( 'emptytheme' );

		$navs_in_db = $this->get_navigations_in_database();
		$this->assertCount( 1, $navs_in_db, 'No Navigation Menu was found.' );
	}

	/**
	 * @covers ::block_core_navigation_create_fallback
	 */
	public function test_should_not_auto_create_navigation_menu_on_theme_switch_to_classic_theme() {

		$navs_in_db = $this->get_navigations_in_database();
		$this->assertCount( 0, $navs_in_db, 'Navigation Menu should not exist before switching Theme.' );

		// Should trigger creation of Navigation Menu if one does not already exist.
		switch_theme( 'twentytwenty' );

		$navs_in_db = $this->get_navigations_in_database();
		$this->assertCount( 0, $navs_in_db, 'A Navigation Menu should not exist.' );
	}

	/**
	 * @covers ::block_core_navigation_create_fallback
	 */
	public function test_should_not_auto_create_navigation_menu_on_theme_switch_if_one_already_exists() {

		// Pre-add a Navigation Menu to simulate when a user already has a menu.
		self::factory()->post->create_and_get(
			array(
				'post_type'    => 'wp_navigation',
				'post_title'   => 'Existing Navigation Menu',
				'post_content' => '<!-- wp:navigation-link {"label":"Hello world","type":"post","id":1,"url":"/hello-world","kind":"post-type"} /-->',
			)
		);

		// Remove any existing disabling filters.
		remove_filter( 'block_core_navigation_skip_fallback', '__return_true' );

		// Should trigger creation of Navigation Menu if one does not already exist.
		switch_theme( 'emptytheme' );

		$navs_in_db = $this->get_navigations_in_database();

		// There should still only be one Navigation Menu.
		$this->assertCount( 1, $navs_in_db, 'A single Navigation Menu should exist.' );

		// The existing Navigation Menu should be unchanged.
		$this->assertEquals( 'Existing Navigation Menu', $navs_in_db[0]->post_title, 'The title of the Navigation Menu should match the existing Navigation Menu' );
	}

	/**
	 * @covers ::block_core_navigation_create_fallback
	 */
	public function test_creates_fallback_navigation_with_existing_navigation_menu_if_found() {

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

		$fallback = gutenberg_block_core_navigation_create_fallback();

		$this->assertEquals( $fallback->post_title, $most_recently_published_nav->post_title, 'The title of the fallback Navigation Menu should match the title of the most recently published Navigation Menu.' );
		$this->assertEquals( $fallback->post_type, $most_recently_published_nav->post_type, 'The post type of the fallback Navigation Menu should match the post type of the most recently published Navigation Menu.' );
		$this->assertEquals( $fallback->post_content, $most_recently_published_nav->post_content, 'The contents of the fallback Navigation Menu should match the contents of the most recently published Navigation Menu.' );
		$this->assertEquals( $fallback->post_status, $most_recently_published_nav->post_status, 'The status of the fallback Navigation Menu should match the status of the most recently published Navigation Menu.' );

		$navs_in_db = $this->get_navigations_in_database();
		$this->assertCount( 2, $navs_in_db, '2 Navigation Menus should exist.' );
	}

	/**
	 * @covers ::block_core_navigation_create_fallback
	 */
	public function test_creates_fallback_navigation_with_existing_classic_menu_if_found() {

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

		$fallback = gutenberg_block_core_navigation_create_fallback();

		$this->assertEquals( 'Existing Classic Menu', $fallback->post_title, 'The title of the fallback Navigation Menu should match the name of the Classic menu.' );

		// Assert that the fallback contains a navigation-link block.
		$this->assertStringContainsString( '<!-- wp:navigation-link', $fallback->post_content, 'The fallback Navigation Menu should contain a `core/navigation-link` block.' );

		// Assert that fallback post_content contains the expected menu item title.
		$this->assertStringContainsString( '"label":"Classic Menu Item 1"', $fallback->post_content, 'The fallback Navigation Menu should contain menu item with a label matching the title of the menu item from the Classic Menu.' );

		// Assert that fallback post_content contains the expected menu item url.
		$this->assertStringContainsString( '"url":"/classic-menu-item-1"', $fallback->post_content, 'The fallback Navigation Menu should contain menu item with a url matching the slug of the menu item from the Classic Menu.' );

		$navs_in_db = $this->get_navigations_in_database();
		$this->assertCount( 1, $navs_in_db, 'A single Navigation Menu should exist.' );

		// Cleanup.
		wp_delete_nav_menu( $menu_id );
	}

	/**
	 * @covers ::block_core_navigation_create_fallback
	 */
	public function test_creates_fallback_navigation_with_page_list_by_default() {
		$fallback = gutenberg_block_core_navigation_create_fallback();

		$this->assertEquals( 'wp_navigation', $fallback->post_type, 'The fallback Navigation Menu should be of the expected Post type.' );
		$this->assertEquals( 'Navigation', $fallback->post_title, 'The fallback Navigation Menu should be have the expected title.' );
		$this->assertEquals( '<!-- wp:page-list /-->', $fallback->post_content, 'The fallback Navigation Menu should contain a Page List block.' );
		$this->assertEquals( 'publish', $fallback->post_status, 'The fallback Navigation Menu should be published.' );

		$navs_in_db = $this->get_navigations_in_database();
		$this->assertCount( 1, $navs_in_db, 'A single Navigation Menu should exist.' );
	}

	/**
	 * @covers ::block_core_navigation_create_fallback
	 */
	public function test_creates_fallback_from_existing_navigation_menu_even_if_classic_menu_exists() {

		// Create a Navigation Post.
		$navigation_post = self::factory()->post->create_and_get(
			array(
				'post_type'    => 'wp_navigation',
				'post_title'   => 'Existing Navigation Menu',
				'post_content' => '<!-- wp:page-list /-->',
			)
		);

		// Also create a Classic Menu - this should be ignored.
		$menu_id = wp_create_nav_menu( 'Existing Classic Menu' );

		$fallback = gutenberg_block_core_navigation_create_fallback();

		$this->assertEquals( $fallback->post_title, $navigation_post->post_title, 'The title of the fallback Navigation Menu should match that of the existing Navigation Menu.' );
		$this->assertEquals( $fallback->post_type, $navigation_post->post_type, 'The post type of the fallback Navigation Menu should match that of the existing Navigation Menu.' );
		$this->assertEquals( $fallback->post_content, $navigation_post->post_content, 'The contents of the fallback Navigation Menu should match that of the existing Navigation Menu.' );
		$this->assertEquals( $fallback->post_status, $navigation_post->post_status, 'The status of the fallback Navigation Menu should match that of the existing Navigation Menu.' );

		$navs_in_db = $this->get_navigations_in_database();
		$this->assertCount( 1, $navs_in_db, 'A single Navigation Menu should exist.' );

		// Cleanup.
		wp_delete_nav_menu( $menu_id );
	}

	/**
	 * @covers ::block_core_navigation_create_fallback
	 */
	public function test_should_skip_if_filter_returns_truthy() {
		add_filter( 'block_core_navigation_skip_fallback', '__return_true' );

		gutenberg_block_core_navigation_create_fallback();

		$navs_in_db = $this->get_navigations_in_database();
		$this->assertCount( 0, $navs_in_db, 'No Navigation Menus should have been created.' );

		remove_filter( 'block_core_navigation_skip_fallback', '__return_true' );
	}


	/**
	 * @covers ::gutenberg_block_core_navigation_get_fallback_blocks
	 */
	public function test_should_get_fallback_blocks_when_no_navigations_exist() {
		$fallback_blocks = gutenberg_block_core_navigation_get_fallback_blocks();

		$this->assertIsArray( $fallback_blocks, 'Fallback blocks should be an array.' );
		$this->assertEmpty( $fallback_blocks, 'Fallback blocks should be empty.' );
	}

	/**
	 * @covers ::gutenberg_block_core_navigation_get_fallback_blocks
	 */
	public function test_should_get_blocks_from_most_recently_created_navigation() {

		// Create a fallback navigation.
		self::factory()->post->create_and_get(
			array(
				'post_type'    => 'wp_navigation',
				'post_title'   => 'Existing Navigation Menu 1',
				'post_content' => '<!-- wp:page-list /-->',
			)
		);

		// Create another fallback navigation.
		self::factory()->post->create_and_get(
			array(
				'post_type'    => 'wp_navigation',
				'post_title'   => 'Existing Navigation Menu 2',
				'post_content' => '<!-- wp:navigation-link {"label":"Hello world","type":"post","id":1,"url":"/hello-world","kind":"post-type"} /-->',
			)
		);

		$fallback_blocks = gutenberg_block_core_navigation_get_fallback_blocks();

		$block = $fallback_blocks[0];

		// Check blocks match most recently Navigation Post data.
		$this->assertEquals( $block['blockName'], 'core/navigation-link', '1st fallback block should match expected type.' );
		$this->assertEquals( $block['attrs']['label'], 'Hello world', '1st fallback block\'s label should match.' );
		$this->assertEquals( $block['attrs']['url'], '/hello-world', '1st fallback block\'s url should match.' );

	}

	/**
	 * @covers ::gutenberg_block_core_navigation_get_fallback_blocks
	 */
	public function test_should_get_empty_array_if_most_recently_created_navigation_is_empty() {

		self::factory()->post->create_and_get(
			array(
				'post_type'    => 'wp_navigation',
				'post_title'   => 'Existing Navigation Menu',
				'post_content' => '', // empty.
			)
		);

		$fallback_blocks = gutenberg_block_core_navigation_get_fallback_blocks();

		$this->assertIsArray( $fallback_blocks, 'Fallback blocks should be an array.' );
		$this->assertEmpty( $fallback_blocks, 'Fallback blocks should be empty.' );
	}

	/**
	 * @covers ::gutenberg_block_core_navigation_get_fallback_blocks
	 */
	public function test_should_filter_out_empty_blocks_from_fallbacks() {

		// Create a fallback navigation.
		self::factory()->post->create_and_get(
			array(
				'post_type'    => 'wp_navigation',
				'post_title'   => 'Existing Navigation Menu',
				'post_content' => '    <!-- wp:page-list /-->         ',
			)
		);

		$fallback_blocks = gutenberg_block_core_navigation_get_fallback_blocks();

		$first_block = $fallback_blocks[0];

		// There should only be a single page list block and no "null" blocks.
		$this->assertCount( 1, $fallback_blocks, 'Fallback blocks should contain a single block.' );
		$this->assertEquals( $first_block['blockName'], 'core/page-list', 'Fallback block should be a page list.' );

		// Check that no "empty" blocks exist with a blockName of 'null'.
		// If the block parser encounters whitespace it will return a block with a blockName of null.
		// This is an intentional feature, but is undesirable for our fallbacks.
		$null_blocks = array_filter(
			$fallback_blocks,
			function( $block ) {
				return null === $block['blockName'];
			}
		);
		$this->assertEmpty( $null_blocks, 'Fallback blocks should not contain any null blocks.' );
	}

	/**
	 * @covers ::gutenberg_block_core_navigation_get_fallback_blocks
	 */
	public function test_should_get_filtered_blocks_if_fallback_is_filtered() {

		function use_site_logo() {
			return parse_blocks( '<!-- wp:site-logo /-->' );
		}

		add_filter( 'block_core_navigation_render_fallback', 'use_site_logo' );

		self::factory()->post->create_and_get(
			array(
				'post_type'    => 'wp_navigation',
				'post_title'   => 'Existing Navigation Menu',
				'post_content' => '<!-- wp:navigation-link {"label":"Hello world","type":"post","id":1,"url":"/hello-world","kind":"post-type"} /-->',
			)
		);

		$fallback_blocks = gutenberg_block_core_navigation_get_fallback_blocks();

		$block = $fallback_blocks[0];

		// Check blocks match most recently Navigation Post data.
		$this->assertEquals( $block['blockName'], 'core/site-logo', '1st fallback block should match expected type.' );

		remove_filter( 'block_core_navigation_render_fallback', 'use_site_logo' );
	}
}


