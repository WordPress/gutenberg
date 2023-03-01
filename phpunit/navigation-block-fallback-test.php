<?php
/**
 * Tests Fallback Behavior for Navigation block
 *
 * @package WordPress
 */

class Tests_Block_Navigation_Fallbacks extends WP_UnitTestCase {

	/**
	 * @var WP_Post
	 */
	protected static $navigation_post;




	public function set_up() {
		parent::set_up();
		switch_theme( 'emptytheme' );
	}

	public static function wpSetUpBeforeClass() {

	}

	public static function wpTearDownAfterClass() {
		if ( ! empty( self::$post_with_comments_disabled->ID ) ) {
			wp_delete_post( self::$navigation_post->ID, true );
		}
	}



	public function test_gets_fallback_navigation_with_existing_navigation_menu_if_found() {

		self::$navigation_post = self::factory()->post->create_and_get(
			array(
				'post_type'    => 'wp_navigation',
				'post_title'   => 'Existing Navigation Menu',
				'post_content' => '<!-- wp:page-list /-->',
			)
		);

		$fallback = gutenberg_block_core_navigation_create_fallback();

		$this->assertEquals( $fallback->post_title, self::$navigation_post->post_title );
		$this->assertEquals( $fallback->post_type, self::$navigation_post->post_type );
		$this->assertEquals( $fallback->post_content, self::$navigation_post->post_content );
		$this->assertEquals( $fallback->post_status, self::$navigation_post->post_status );
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

		// Cleanup.
		wp_delete_nav_menu( $menu_id );
	}

	public function test_creates_fallback_navigation_with_page_list_by_default() {
		$fallback = gutenberg_block_core_navigation_create_fallback();

		$this->assertEquals( 'wp_navigation', $fallback->post_type );
		$this->assertEquals( 'Navigation', $fallback->post_title, );
		$this->assertEquals( '<!-- wp:page-list /-->', $fallback->post_content );
		$this->assertEquals( 'publish', $fallback->post_status );
	}

	public function test_should_skip_if_filter_returns_truthy() {
		add_filter( 'block_core_navigation_skip_fallback', '__return_true' );

		$actual = gutenberg_block_core_navigation_create_fallback();

		// Asserr no fallback is created.
		$this->assertEquals( $actual, null );

		remove_filter( 'block_core_navigation_skip_fallback', '__return_true' );
	}
}


