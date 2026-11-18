<?php
/**
 * Navigation Menu slug uniqueness tests.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests that `wp_navigation` posts are stored with a unique slug.
 *
 * @group blocks
 * @group navigation-slug
 */
class Navigation_Menu_Unique_Slug_Test extends WP_UnitTestCase {

	/**
	 * Published Navigation Menu with the `header` slug.
	 *
	 * @var int
	 */
	private static $header_menu_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$header_menu_id = $factory->post->create(
			array(
				'post_type'   => 'wp_navigation',
				'post_title'  => 'Header Menu',
				'post_name'   => 'header',
				'post_status' => 'publish',
			)
		);
	}

	public static function wpTearDownAfterClass() {
		wp_delete_post( self::$header_menu_id, true );
	}

	/**
	 * @covers ::gutenberg_block_core_navigation_get_unique_navigation_slug
	 */
	public function test_unique_navigation_slug_is_unchanged_when_it_is_free() {
		$this->assertSame(
			'sidebar',
			gutenberg_block_core_navigation_get_unique_navigation_slug( 'sidebar' )
		);
	}

	/**
	 * @covers ::gutenberg_block_core_navigation_get_unique_navigation_slug
	 */
	public function test_unique_navigation_slug_is_suffixed_when_it_is_taken() {
		$this->assertSame(
			'header-2',
			gutenberg_block_core_navigation_get_unique_navigation_slug( 'header' )
		);
	}

	/**
	 * A menu keeps its own slug when it is updated.
	 *
	 * @covers ::gutenberg_block_core_navigation_get_unique_navigation_slug
	 */
	public function test_unique_navigation_slug_ignores_the_post_being_updated() {
		$this->assertSame(
			'header',
			gutenberg_block_core_navigation_get_unique_navigation_slug( 'header', self::$header_menu_id )
		);
	}

	/**
	 * Draft menus normally share a `post_name`, which would make two blocks
	 * referencing the same slug resolve unpredictably.
	 *
	 * @covers ::gutenberg_block_core_navigation_ensure_unique_navigation_slug
	 */
	public function test_draft_navigation_menu_gets_a_unique_slug() {
		$draft_menu_id = self::factory()->post->create(
			array(
				'post_type'   => 'wp_navigation',
				'post_title'  => 'Another Header',
				'post_name'   => 'header',
				'post_status' => 'draft',
			)
		);

		$this->assertSame( 'header-2', get_post( $draft_menu_id )->post_name );

		wp_delete_post( $draft_menu_id, true );
	}

	/**
	 * @covers ::gutenberg_block_core_navigation_ensure_unique_navigation_slug
	 */
	public function test_other_post_types_are_left_alone() {
		$page_id = self::factory()->post->create(
			array(
				'post_type'   => 'page',
				'post_title'  => 'Header',
				'post_name'   => 'header',
				'post_status' => 'draft',
			)
		);

		$this->assertSame( 'header', get_post( $page_id )->post_name );

		wp_delete_post( $page_id, true );
	}

	/**
	 * @covers ::gutenberg_block_core_navigation_get_unique_navigation_slug
	 */
	public function test_unique_navigation_slug_skips_a_suffix_that_is_taken() {
		$menu_id = self::factory()->post->create(
			array(
				'post_type'   => 'wp_navigation',
				'post_title'  => 'Another Header',
				'post_name'   => 'header-2',
				'post_status' => 'publish',
			)
		);

		$slug = gutenberg_block_core_navigation_get_unique_navigation_slug( 'header' );

		wp_delete_post( $menu_id, true );

		$this->assertSame( 'header-3', $slug );
	}

	/**
	 * An auto draft is the empty record the editor creates before anything is
	 * saved, so suffixing its slug would reserve a slug nobody asked for.
	 *
	 * @covers ::gutenberg_block_core_navigation_ensure_unique_navigation_slug
	 */
	public function test_auto_draft_navigation_menu_keeps_its_requested_slug() {
		$menu_id = self::factory()->post->create(
			array(
				'post_type'   => 'wp_navigation',
				'post_title'  => 'Another Header',
				'post_name'   => 'header',
				'post_status' => 'auto-draft',
			)
		);

		$this->assertSame( 'header', get_post( $menu_id )->post_name );

		wp_delete_post( $menu_id, true );
	}

	/**
	 * @covers ::gutenberg_block_core_navigation_ensure_unique_navigation_slug
	 */
	public function test_navigation_menu_without_a_slug_is_left_alone() {
		$menu_id = self::factory()->post->create(
			array(
				'post_type'   => 'wp_navigation',
				'post_title'  => '',
				'post_name'   => '',
				'post_status' => 'draft',
			)
		);

		$this->assertSame( '', get_post( $menu_id )->post_name );

		wp_delete_post( $menu_id, true );
	}

	/**
	 * Suffixing a menu that is only clashing with itself would break every
	 * block referencing it, on every save.
	 *
	 * @covers ::gutenberg_block_core_navigation_ensure_unique_navigation_slug
	 */
	public function test_updating_a_navigation_menu_keeps_its_slug() {
		wp_update_post(
			array(
				'ID'         => self::$header_menu_id,
				'post_title' => 'Primary Menu',
			)
		);

		$this->assertSame( 'header', get_post( self::$header_menu_id )->post_name );

		wp_update_post(
			array(
				'ID'         => self::$header_menu_id,
				'post_title' => 'Header Menu',
			)
		);
	}

	/**
	 * @covers ::gutenberg_block_core_navigation_ensure_unique_navigation_slug
	 */
	public function test_navigation_menu_slug_is_sanitized_before_it_is_stored() {
		$menu_id = self::factory()->post->create(
			array(
				'post_type'   => 'wp_navigation',
				'post_title'  => 'Sidebar Menu',
				'post_name'   => 'Sidebar Menu',
				'post_status' => 'draft',
			)
		);

		$this->assertSame( 'sidebar-menu', get_post( $menu_id )->post_name );

		wp_delete_post( $menu_id, true );
	}
}
