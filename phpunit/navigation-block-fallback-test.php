<?php
/**
 * Tests Fallback Behavior for Navigation block
 *
 * @package WordPress
 */

class Tests_Block_Navigation_Fallbacks extends WP_UnitTestCase {

	public function set_up() {
		parent::set_up();
		switch_theme( 'emptytheme' );
	}

	public function get_navigations_in_database() {
		$navs_in_db = new WP_Query(
			array(
				'post_type'      => 'wp_navigation',
				'post_status'    => 'publish',
				'posts_per_page' => -1,
				'orderby'        => 'date',
				'order'          => 'DESC',
			)
		);

		return $navs_in_db->posts ?? array();
	}

	public function test_gets_fallback_navigation_with_existing_navigation_menu_if_found() {

		$navigation_post_1 = self::factory()->post->create_and_get(
			array(
				'post_type'    => 'wp_navigation',
				'post_title'   => 'Existing Navigation Menu 1',
				'post_content' => '<!-- wp:page-list /-->',
			)
		);

		$navigation_post_2 = self::factory()->post->create_and_get(
			array(
				'post_type'    => 'wp_navigation',
				'post_title'   => 'Existing Navigation Menu 2',
				'post_content' => '<!-- wp:navigation-link {"label":"Hello world","type":"post","id":1,"url":"/hello-world","kind":"post-type"} /-->',
			)
		);

		$most_recently_published_nav = $navigation_post_2;

		$fallback = gutenberg_block_core_navigation_create_fallback();

		$this->assertEquals( $fallback->post_title, $most_recently_published_nav->post_title );
		$this->assertEquals( $fallback->post_type, $most_recently_published_nav->post_type );
		$this->assertEquals( $fallback->post_content, $most_recently_published_nav->post_content );
		$this->assertEquals( $fallback->post_status, $most_recently_published_nav->post_status );

		$navs_in_db = $this->get_navigations_in_database();
		$this->assertCount( 2, $navs_in_db );
	}

	public function test_gets_fallback_navigation_with_existing_classic_menu_if_found() {

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

		$this->assertEquals( 'Existing Classic Menu', $fallback->post_title, );
		$this->assertEquals( 'wp_navigation', $fallback->post_type, );
		$this->assertEquals( 'publish', $fallback->post_status );

		// Assert that the fallback contains a navigation-link block.
		$this->assertStringContainsString( '<!-- wp:navigation-link', $fallback->post_content );

		// Assert that fallback post_content contains the expected menu item title.
		$this->assertStringContainsString( '"label":"Classic Menu Item 1"', $fallback->post_content );

		// Assert that fallback post_content contains the expected menu item url.
		$this->assertStringContainsString( '"url":"/classic-menu-item-1"', $fallback->post_content );

		$navs_in_db = $this->get_navigations_in_database();
		$this->assertCount( 1, $navs_in_db );

		// Cleanup.
		wp_delete_nav_menu( $menu_id );
	}

	public function test_creates_fallback_navigation_with_page_list_by_default() {
		$fallback = gutenberg_block_core_navigation_create_fallback();

		$this->assertEquals( 'wp_navigation', $fallback->post_type );
		$this->assertEquals( 'Navigation', $fallback->post_title, );
		$this->assertEquals( '<!-- wp:page-list /-->', $fallback->post_content );
		$this->assertEquals( 'publish', $fallback->post_status );

		$navs_in_db = $this->get_navigations_in_database();
		$this->assertCount( 1, $navs_in_db );
	}

	public function test_creates_fallback_from_existing_navigation_menu_even_if_classic_menu_exists() {

		// Create a Navigation Post
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

		$this->assertEquals( $fallback->post_title, $navigation_post->post_title );
		$this->assertEquals( $fallback->post_type, $navigation_post->post_type );
		$this->assertEquals( $fallback->post_content, $navigation_post->post_content );
		$this->assertEquals( $fallback->post_status, $navigation_post->post_status );

		$navs_in_db = $this->get_navigations_in_database();
		$this->assertCount( 1, $navs_in_db );

		// Cleanup.
		wp_delete_nav_menu( $menu_id );
	}

	public function test_should_skip_if_filter_returns_truthy() {
		add_filter( 'block_core_navigation_skip_fallback', '__return_true' );

		$actual = gutenberg_block_core_navigation_create_fallback();

		// Assert no fallback is created.
		$this->assertEquals( $actual, null );

		$navs_in_db = $this->get_navigations_in_database();
		$this->assertCount( 0, $navs_in_db );

		remove_filter( 'block_core_navigation_skip_fallback', '__return_true' );
	}

	public function test_should_return_empty_fallback_blocks_when_no_navigations_exist() {
		$fallback_blocks = gutenberg_block_core_navigation_get_fallback_blocks();

		$this->assertIsArray( $fallback_blocks );
		$this->assertEmpty( $fallback_blocks );
	}

	public function test_should_return_blocks_from_most_recently_created_navigation() {

		$navigation_post_1 = self::factory()->post->create_and_get(
			array(
				'post_type'    => 'wp_navigation',
				'post_title'   => 'Existing Navigation Menu 1',
				'post_content' => '<!-- wp:page-list /-->',
			)
		);

		$navigation_post_2 = self::factory()->post->create_and_get(
			array(
				'post_type'    => 'wp_navigation',
				'post_title'   => 'Existing Navigation Menu 2',
				'post_content' => '<!-- wp:navigation-link {"label":"Hello world","type":"post","id":1,"url":"/hello-world","kind":"post-type"} /-->',
			)
		);

		$most_recently_published_nav = $navigation_post_2;

		$fallback_blocks = gutenberg_block_core_navigation_get_fallback_blocks();

		$block = $fallback_blocks[0];

		// Check blocks match most recently Navigation Post data.
		$this->assertEquals( $block['blockName'], 'core/navigation-link' );
		$this->assertEquals( $block['attrs']['label'], 'Hello world' );
		$this->assertEquals( $block['attrs']['url'], '/hello-world' );

	}

	public function test_should_return_empty_array_if_most_recently_created_navigation_is_empty() {

		$navigation_post_2 = self::factory()->post->create_and_get(
			array(
				'post_type'    => 'wp_navigation',
				'post_title'   => 'Existing Navigation Menu',
				'post_content' => '', // empty.
			)
		);

		$fallback_blocks = gutenberg_block_core_navigation_get_fallback_blocks();

		$this->assertIsArray( $fallback_blocks );
		$this->assertEmpty( $fallback_blocks );
	}

	public function test_should_filter_out_empty_blocks_from_fallbacks() {

		$navigation_post = self::factory()->post->create_and_get(
			array(
				'post_type'    => 'wp_navigation',
				'post_title'   => 'Existing Navigation Menu',
				'post_content' => '    <!-- wp:page-list /-->         ',
			)
		);

		$fallback_blocks = gutenberg_block_core_navigation_get_fallback_blocks();

		$first_block = $fallback_blocks[0];

		// There should only be a single page list block and no "null" blocks.
		$this->assertCount( 1, $fallback_blocks );
		$this->assertEquals( $first_block['blockName'], 'core/page-list' );

		// Check that no "empty" blocks exist with a blockName of 'null'.
		// If the block parser encounters whitespace it will return a block with a blockName of null.
		// This is an intentional feature, but is undesirable for our fallbacks.
		$null_blocks = array_filter(
			$fallback_blocks,
			function( $block ) {
				return $block['blockName'] === null;
			}
		);
		$this->assertEmpty( $null_blocks );
	}

	public function test_should_return_filtered_blocks_fallback_is_filtered() {

		function use_site_logo() {
			return parse_blocks( '<!-- wp:site-logo /-->' );
		}

		add_filter( 'block_core_navigation_render_fallback', 'use_site_logo' );

		$navigation_post_2 = self::factory()->post->create_and_get(
			array(
				'post_type'    => 'wp_navigation',
				'post_title'   => 'Existing Navigation Menu',
				'post_content' => '<!-- wp:navigation-link {"label":"Hello world","type":"post","id":1,"url":"/hello-world","kind":"post-type"} /-->',
			)
		);

		$fallback_blocks = gutenberg_block_core_navigation_get_fallback_blocks();

		$block = $fallback_blocks[0];

		// Check blocks match most recently Navigation Post data.
		$this->assertEquals( $block['blockName'], 'core/site-logo' );

		remove_filter( 'block_core_navigation_render_fallback', 'use_site_logo' );
	}
}


