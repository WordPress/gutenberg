<?php
/**
 * Tests for choosing the navigation menus a page is added to when it is published.
 *
 * @package gutenberg
 */

/**
 * @covers ::gutenberg_navigation_add_post_link
 * @covers ::gutenberg_register_navigation_menus_page_field
 * @covers ::gutenberg_navigation_stash_publish_menu_choice
 * @covers ::gutenberg_navigation_auto_add_page_on_publish
 */
class Gutenberg_Navigation_Choose_Menus_On_Publish_Test extends WP_Test_REST_TestCase {
	const META_KEY = 'wp_navigation_auto_add_pages';

	protected static $admin_id;
	protected static $editor_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$admin_id  = $factory->user->create( array( 'role' => 'administrator' ) );
		self::$editor_id = $factory->user->create( array( 'role' => 'editor' ) );
		if ( is_multisite() ) {
			grant_super_admin( self::$admin_id );
		}
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$admin_id );
		self::delete_user( self::$editor_id );
	}

	public function set_up() {
		parent::set_up();
		// The test framework unregisters every meta key after each test.
		gutenberg_register_navigation_auto_add_pages_meta();
	}

	public function tear_down() {
		foreach ( array( 'wp_navigation', 'page', 'post' ) as $post_type ) {
			$posts = get_posts(
				array(
					'post_type'      => $post_type,
					'post_status'    => 'any',
					'posts_per_page' => -1,
					'fields'         => 'ids',
				)
			);
			foreach ( $posts as $post_id ) {
				wp_delete_post( $post_id, true );
			}
		}
		parent::tear_down();
	}

	private function create_menu( $content, $auto_add = null ) {
		$menu_id = self::factory()->post->create(
			array(
				'post_type'    => 'wp_navigation',
				'post_status'  => 'publish',
				'post_title'   => 'Menu',
				'post_content' => wp_slash( $content ),
			)
		);
		if ( null !== $auto_add ) {
			update_post_meta( $menu_id, self::META_KEY, $auto_add );
		}
		return $menu_id;
	}

	private function get_menu_blocks( $menu_id ) {
		$blocks = parse_blocks( get_post( $menu_id )->post_content );
		return array_values(
			array_filter(
				$blocks,
				static function ( $block ) {
					return null !== $block['blockName'];
				}
			)
		);
	}

	private function create_draft_page( $args = array() ) {
		return self::factory()->post->create(
			array_merge(
				array(
					'post_type'   => 'page',
					'post_status' => 'draft',
					'post_title'  => 'New Page',
				),
				$args
			)
		);
	}

	private function page_link( $page_id ) {
		$page = get_post( $page_id );
		return '<!-- wp:navigation-link {"label":"' . $page->post_title . '","type":"page","id":' . $page_id . ',"url":"' . get_permalink( $page ) . '","kind":"post-type"} /-->';
	}

	private function publish_through_rest( $page_id, $menus = null ) {
		$request = new WP_REST_Request( 'POST', '/wp/v2/pages/' . $page_id );
		$request->set_body_params( array( 'status' => 'publish' ) );
		if ( null !== $menus ) {
			$request->set_param( 'navigation_menus', $menus );
		}
		return rest_get_server()->dispatch( $request );
	}

	/*
	 * gutenberg_navigation_add_post_link().
	 */

	public function test_add_post_link_appends_a_link_to_a_top_level_page() {
		$menu_id = $this->create_menu( '<!-- wp:navigation-link {"label":"Home","url":"https://example.com","kind":"custom"} /-->' );
		$page_id = $this->create_draft_page( array( 'post_title' => 'About us' ) );

		$this->assertTrue( gutenberg_navigation_add_post_link( $menu_id, $page_id ) );

		$blocks = $this->get_menu_blocks( $menu_id );
		$this->assertCount( 2, $blocks );
		$this->assertSame( 'Home', $blocks[0]['attrs']['label'] );
		$this->assertSame( 'core/navigation-link', $blocks[1]['blockName'] );
		$this->assertSame( $page_id, $blocks[1]['attrs']['id'] );
		$this->assertSame( 'About us', $blocks[1]['attrs']['label'] );
		$this->assertSame( 'page', $blocks[1]['attrs']['type'] );
		$this->assertSame( 'post-type', $blocks[1]['attrs']['kind'] );
		$this->assertSame( 'core/post-data', $blocks[1]['attrs']['metadata']['bindings']['url']['source'] );
	}

	public function test_add_post_link_nests_a_child_page_under_the_link_to_its_parent() {
		$parent_id = self::factory()->post->create(
			array(
				'post_type'  => 'page',
				'post_title' => 'Parent',
			)
		);
		$menu_id   = $this->create_menu( $this->page_link( $parent_id ) . '<!-- wp:navigation-link {"label":"Home","url":"https://example.com","kind":"custom"} /-->' );
		$child_id  = $this->create_draft_page(
			array(
				'post_title'  => 'Child',
				'post_parent' => $parent_id,
			)
		);

		$this->assertTrue( gutenberg_navigation_add_post_link( $menu_id, $child_id ) );

		$blocks = $this->get_menu_blocks( $menu_id );
		$this->assertCount( 2, $blocks );
		$this->assertSame( 'core/navigation-submenu', $blocks[0]['blockName'] );
		$this->assertSame( $parent_id, $blocks[0]['attrs']['id'] );
		$this->assertCount( 1, $blocks[0]['innerBlocks'] );
		$this->assertSame( $child_id, $blocks[0]['innerBlocks'][0]['attrs']['id'] );
	}

	public function test_add_post_link_appends_a_child_page_when_the_menu_has_no_link_to_its_parent() {
		$parent_id = self::factory()->post->create(
			array(
				'post_type'  => 'page',
				'post_title' => 'Parent',
			)
		);
		$menu_id   = $this->create_menu( '<!-- wp:navigation-link {"label":"Home","url":"https://example.com","kind":"custom"} /-->' );
		$child_id  = $this->create_draft_page(
			array(
				'post_title'  => 'Child',
				'post_parent' => $parent_id,
			)
		);

		$this->assertTrue( gutenberg_navigation_add_post_link( $menu_id, $child_id ) );

		$blocks = $this->get_menu_blocks( $menu_id );
		$this->assertCount( 2, $blocks );
		$this->assertSame( 'core/navigation-link', $blocks[1]['blockName'] );
		$this->assertSame( $child_id, $blocks[1]['attrs']['id'] );
	}

	public function test_add_post_link_leaves_a_menu_that_already_links_to_the_post_unchanged() {
		$page_id = $this->create_draft_page( array( 'post_title' => 'About us' ) );
		$menu_id = $this->create_menu( $this->page_link( $page_id ) );
		$before  = get_post( $menu_id )->post_content;

		$this->assertFalse( gutenberg_navigation_add_post_link( $menu_id, $page_id ) );
		$this->assertSame( $before, get_post( $menu_id )->post_content );
	}

	public function test_add_post_link_links_to_a_post_with_its_post_type() {
		$menu_id = $this->create_menu( '' );
		$post_id = self::factory()->post->create( array( 'post_title' => 'Hello' ) );

		$this->assertTrue( gutenberg_navigation_add_post_link( $menu_id, get_post( $post_id ) ) );

		$blocks = $this->get_menu_blocks( $menu_id );
		$this->assertCount( 1, $blocks );
		$this->assertSame( $post_id, $blocks[0]['attrs']['id'] );
		$this->assertSame( 'post', $blocks[0]['attrs']['type'] );
		$this->assertSame( 'post-type', $blocks[0]['attrs']['kind'] );
	}

	public function test_add_post_link_rejects_a_menu_id_that_is_not_a_navigation_menu() {
		$page_id  = $this->create_draft_page();
		$other_id = $this->create_draft_page();

		$result = gutenberg_navigation_add_post_link( $other_id, $page_id );
		$this->assertWPError( $result );
		$this->assertSame( 'navigation_menu_not_found', $result->get_error_code() );

		$result = gutenberg_navigation_add_post_link( 0, $page_id );
		$this->assertWPError( $result );
	}

	public function test_add_post_link_rejects_an_unknown_post() {
		$menu_id = $this->create_menu( '' );

		$result = gutenberg_navigation_add_post_link( $menu_id, 999999 );
		$this->assertWPError( $result );
		$this->assertSame( 'post_not_found', $result->get_error_code() );
	}

	/*
	 * The `navigation_menus` field on pages.
	 */

	public function test_the_field_is_write_only_and_a_list_of_integers() {
		wp_set_current_user( self::$admin_id );
		$page_id = $this->create_draft_page();

		$handlers = rest_get_server()->get_routes()['/wp/v2/pages/(?P<id>[\d]+)'];
		$args     = $handlers[1]['args'];
		$this->assertArrayHasKey( 'POST', $handlers[1]['methods'] );
		$this->assertArrayHasKey( 'navigation_menus', $args );
		$this->assertSame( 'array', $args['navigation_menus']['type'] );
		$this->assertSame( 'integer', $args['navigation_menus']['items']['type'] );

		$request = new WP_REST_Request( 'GET', '/wp/v2/pages/' . $page_id );
		$request->set_param( 'context', 'edit' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertArrayNotHasKey( 'navigation_menus', $response->get_data() );

		$response = $this->publish_through_rest( $page_id, 'not-a-list' );
		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'draft', get_post( $page_id )->post_status );
	}

	public function test_publishing_with_a_choice_adds_the_page_to_the_chosen_menus_only() {
		wp_set_current_user( self::$admin_id );
		$auto_menu_id   = $this->create_menu( '', true );
		$chosen_menu_id = $this->create_menu( '' );
		$page_id        = $this->create_draft_page();

		$response = $this->publish_through_rest( $page_id, array( $chosen_menu_id ) );
		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 'publish', get_post( $page_id )->post_status );

		$this->assertCount( 0, $this->get_menu_blocks( $auto_menu_id ), 'The unchecked menu with the setting on is skipped for this page.' );
		$chosen_blocks = $this->get_menu_blocks( $chosen_menu_id );
		$this->assertCount( 1, $chosen_blocks );
		$this->assertSame( $page_id, $chosen_blocks[0]['attrs']['id'] );
	}

	public function test_publishing_with_an_empty_choice_adds_the_page_to_no_menu() {
		wp_set_current_user( self::$admin_id );
		$auto_menu_id = $this->create_menu( '', true );
		$page_id      = $this->create_draft_page();

		$response = $this->publish_through_rest( $page_id, array() );
		$this->assertSame( 200, $response->get_status() );
		$this->assertCount( 0, $this->get_menu_blocks( $auto_menu_id ) );
	}

	public function test_publishing_without_the_field_adds_the_page_to_the_menus_with_the_setting_on() {
		wp_set_current_user( self::$admin_id );
		$auto_menu_id  = $this->create_menu( '', true );
		$other_menu_id = $this->create_menu( '' );
		$page_id       = $this->create_draft_page();

		$response = $this->publish_through_rest( $page_id );
		$this->assertSame( 200, $response->get_status() );
		$this->assertCount( 1, $this->get_menu_blocks( $auto_menu_id ) );
		$this->assertCount( 0, $this->get_menu_blocks( $other_menu_id ) );
	}

	public function test_a_choice_keeps_the_setting_on_the_skipped_menu() {
		wp_set_current_user( self::$admin_id );
		$auto_menu_id = $this->create_menu( '', true );
		$page_id      = $this->create_draft_page();

		$this->publish_through_rest( $page_id, array() );
		$this->assertTrue( (bool) get_post_meta( $auto_menu_id, self::META_KEY, true ) );

		$next_page_id = $this->create_draft_page( array( 'post_title' => 'Next' ) );
		$this->publish_through_rest( $next_page_id );
		$blocks = $this->get_menu_blocks( $auto_menu_id );
		$this->assertCount( 1, $blocks );
		$this->assertSame( $next_page_id, $blocks[0]['attrs']['id'] );
	}

	public function test_a_choice_on_a_request_that_does_not_publish_is_ignored() {
		wp_set_current_user( self::$admin_id );
		$menu_id = $this->create_menu( '' );
		$page_id = $this->create_draft_page();

		$request = new WP_REST_Request( 'POST', '/wp/v2/pages/' . $page_id );
		$request->set_body_params( array( 'title' => 'Renamed' ) );
		$request->set_param( 'navigation_menus', array( $menu_id ) );
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 200, $response->get_status() );
		$this->assertCount( 0, $this->get_menu_blocks( $menu_id ) );
	}

	public function test_a_chosen_menu_the_user_cannot_edit_is_skipped() {
		wp_set_current_user( self::$editor_id );
		$menu_id = $this->create_menu( '' );
		$page_id = $this->create_draft_page( array( 'post_author' => self::$editor_id ) );
		$this->assertFalse( current_user_can( 'edit_post', $menu_id ) );

		$response = $this->publish_through_rest( $page_id, array( $menu_id ) );
		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 'publish', get_post( $page_id )->post_status );
		$this->assertCount( 0, $this->get_menu_blocks( $menu_id ) );
	}

	public function test_a_choice_adds_a_child_page_to_a_chosen_menu_without_its_parent_at_the_top_level() {
		wp_set_current_user( self::$admin_id );
		$parent_id = self::factory()->post->create(
			array(
				'post_type'  => 'page',
				'post_title' => 'Parent',
			)
		);
		$menu_id   = $this->create_menu( '<!-- wp:navigation-link {"label":"Home","url":"https://example.com","kind":"custom"} /-->' );
		$child_id  = $this->create_draft_page(
			array(
				'post_title'  => 'Child',
				'post_parent' => $parent_id,
			)
		);

		$this->publish_through_rest( $child_id, array( $menu_id ) );

		$blocks = $this->get_menu_blocks( $menu_id );
		$this->assertCount( 2, $blocks );
		$this->assertSame( $child_id, $blocks[1]['attrs']['id'] );
	}
}
