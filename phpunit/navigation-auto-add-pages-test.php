<?php
/**
 * Tests for the "Auto add pages" navigation menu setting.
 *
 * @package gutenberg
 */

/**
 * @covers ::gutenberg_register_navigation_auto_add_pages_meta
 * @covers ::gutenberg_navigation_auto_add_page_on_publish
 * @covers ::gutenberg_navigation_create_fallback_with_pages
 */
class Gutenberg_Navigation_Auto_Add_Pages_Test extends WP_Test_REST_TestCase {
	const META_KEY = 'wp_navigation_auto_add_pages';

	protected static $admin_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$admin_id = $factory->user->create( array( 'role' => 'administrator' ) );
		if ( is_multisite() ) {
			grant_super_admin( self::$admin_id );
		}
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$admin_id );
	}

	public function set_up() {
		parent::set_up();
		// The test framework unregisters every meta key after each test.
		gutenberg_register_navigation_auto_add_pages_meta();
	}

	public function tear_down() {
		$this->delete_all_posts_of_type( 'wp_navigation' );
		$this->delete_all_posts_of_type( 'page' );
		$this->delete_all_posts_of_type( 'post' );
		parent::tear_down();
	}

	private function delete_all_posts_of_type( $post_type ) {
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

	private function create_menu( $content, $auto_add = null ) {
		$menu_id = self::factory()->post->create(
			array(
				'post_type'    => 'wp_navigation',
				'post_status'  => 'publish',
				'post_title'   => 'Menu',
				'post_content' => $content,
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

	private function publish_new_page( $args = array() ) {
		$page_id = self::factory()->post->create(
			array_merge(
				array(
					'post_type'   => 'page',
					'post_status' => 'draft',
					'post_title'  => 'New Page',
				),
				$args
			)
		);
		wp_publish_post( $page_id );
		return $page_id;
	}

	private function assert_page_link_block( $block, $page_id ) {
		$page = get_post( $page_id );
		$this->assertSame( 'core/navigation-link', $block['blockName'] );
		$this->assertSame( $page_id, $block['attrs']['id'] );
		$this->assertSame( $page->post_title, $block['attrs']['label'] );
		$this->assertSame( get_permalink( $page ), $block['attrs']['url'] );
		$this->assertSame( 'page', $block['attrs']['type'] );
		$this->assertSame( 'post-type', $block['attrs']['kind'] );
		$this->assertSame(
			array(
				'url' => array(
					'source' => 'core/post-data',
					'args'   => array( 'field' => 'link' ),
				),
			),
			$block['attrs']['metadata']['bindings']
		);
	}

	/*
	 * Meta registration.
	 */

	public function test_meta_is_registered_as_boolean_for_rest() {
		$registered = get_registered_meta_keys( 'post', 'wp_navigation' );

		$this->assertArrayHasKey( self::META_KEY, $registered );
		$this->assertSame( 'boolean', $registered[ self::META_KEY ]['type'] );
		$this->assertTrue( $registered[ self::META_KEY ]['single'] );
		$this->assertNotEmpty( $registered[ self::META_KEY ]['show_in_rest'] );
		$this->assertFalse( $registered[ self::META_KEY ]['default'] );
		$this->assertTrue( post_type_supports( 'wp_navigation', 'custom-fields' ) );
	}

	public function test_meta_is_readable_and_writable_through_rest() {
		wp_set_current_user( self::$admin_id );
		$menu_id = $this->create_menu( '' );

		$request = new WP_REST_Request( 'GET', '/wp/v2/navigation/' . $menu_id );
		$request->set_param( 'context', 'edit' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 200, $response->get_status() );
		$this->assertFalse( $response->get_data()['meta'][ self::META_KEY ] );

		$request = new WP_REST_Request( 'POST', '/wp/v2/navigation/' . $menu_id );
		$request->set_body_params( array( 'meta' => array( self::META_KEY => true ) ) );
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 200, $response->get_status() );
		$this->assertTrue( $response->get_data()['meta'][ self::META_KEY ] );
		$this->assertTrue( (bool) get_post_meta( $menu_id, self::META_KEY, true ) );
	}

	/*
	 * Auto add on publish.
	 */

	public function test_publishing_a_top_level_page_appends_a_link_to_a_menu_with_the_setting_on() {
		$menu_id = $this->create_menu(
			'<!-- wp:navigation-link {"label":"Home","url":"https://example.com","kind":"custom"} /-->',
			true
		);

		$page_id = $this->publish_new_page( array( 'post_title' => 'About us' ) );

		$blocks = $this->get_menu_blocks( $menu_id );
		$this->assertCount( 2, $blocks );
		$this->assertSame( 'Home', $blocks[0]['attrs']['label'], 'Existing items are left in place.' );
		$this->assert_page_link_block( $blocks[1], $page_id );
	}

	public function test_a_menu_with_the_setting_off_or_missing_is_untouched() {
		$content  = '<!-- wp:navigation-link {"label":"Home","url":"https://example.com","kind":"custom"} /-->';
		$off_id   = $this->create_menu( $content, false );
		$unset_id = $this->create_menu( $content );

		$this->publish_new_page();

		$this->assertSame( $content, get_post( $off_id )->post_content );
		$this->assertSame( $content, get_post( $unset_id )->post_content );
	}

	public function test_a_page_already_in_the_menu_is_not_added_twice() {
		$page_id = self::factory()->post->create(
			array(
				'post_type'   => 'page',
				'post_status' => 'draft',
			)
		);
		// Nested inside a submenu, to prove the check is recursive.
		$content = sprintf(
			'<!-- wp:navigation-submenu {"label":"Company","url":"https://example.com","kind":"custom"} --><!-- wp:navigation-link {"label":"Page","type":"page","kind":"post-type","id":%d,"url":"https://example.com/page"} /--><!-- /wp:navigation-submenu -->',
			$page_id
		);
		$menu_id = $this->create_menu( $content, true );

		wp_publish_post( $page_id );

		$this->assertSame( $content, get_post( $menu_id )->post_content );
	}

	public function test_child_pages_other_post_types_and_republished_pages_are_ignored() {
		$menu_id = $this->create_menu( '', true );

		$parent_id = $this->publish_new_page( array( 'post_title' => 'Parent' ) );
		$this->assertCount( 1, $this->get_menu_blocks( $menu_id ), 'The top-level parent is added.' );

		$this->publish_new_page(
			array(
				'post_title'  => 'Child',
				'post_parent' => $parent_id,
			)
		);
		$this->assertCount( 1, $this->get_menu_blocks( $menu_id ), 'A child page is not added.' );

		$post_id = self::factory()->post->create( array( 'post_status' => 'draft' ) );
		wp_publish_post( $post_id );
		$this->assertCount( 1, $this->get_menu_blocks( $menu_id ), 'A post is not added.' );

		wp_update_post(
			array(
				'ID'         => $parent_id,
				'post_title' => 'Parent renamed',
			)
		);
		$this->assertCount( 1, $this->get_menu_blocks( $menu_id ), 'Updating a published page adds nothing.' );
	}

	public function test_a_scheduled_page_is_added_when_it_publishes() {
		$menu_id = $this->create_menu( '', true );
		$page_id = self::factory()->post->create(
			array(
				'post_type'   => 'page',
				'post_status' => 'future',
				'post_date'   => gmdate( 'Y-m-d H:i:s', time() + DAY_IN_SECONDS ),
			)
		);
		$this->assertCount( 0, $this->get_menu_blocks( $menu_id ), 'Scheduling alone adds nothing.' );

		// `check_and_publish_future_post()` refuses to publish before the scheduled
		// time, so call what it calls once the time arrives.
		wp_publish_post( $page_id );

		$blocks = $this->get_menu_blocks( $menu_id );
		$this->assertCount( 1, $blocks );
		$this->assert_page_link_block( $blocks[0], $page_id );
	}

	public function test_every_menu_with_the_setting_on_receives_the_link() {
		$first_id  = $this->create_menu( '', true );
		$second_id = $this->create_menu( '', true );

		$page_id = $this->publish_new_page();

		$this->assert_page_link_block( $this->get_menu_blocks( $first_id )[0], $page_id );
		$this->assert_page_link_block( $this->get_menu_blocks( $second_id )[0], $page_id );
	}

	public function test_a_published_page_can_be_edited_by_a_user_without_unfiltered_html() {
		$menu_id = $this->create_menu( '', true );
		$author  = self::factory()->user->create( array( 'role' => 'author' ) );
		wp_set_current_user( $author );
		kses_init();

		$page_id = $this->publish_new_page( array( 'post_title' => 'Terms & "Conditions"' ) );

		$blocks = $this->get_menu_blocks( $menu_id );
		$this->assertCount( 1, $blocks );
		$this->assert_page_link_block( $blocks[0], $page_id );
		kses_remove_filters();
	}

	/*
	 * Fallback menu.
	 */

	public function test_fallback_menu_is_built_from_page_links_with_the_setting_on() {
		$about_id   = self::factory()->post->create(
			array(
				'post_type'  => 'page',
				'post_title' => 'About',
				'menu_order' => 2,
			)
		);
		$contact_id = self::factory()->post->create(
			array(
				'post_type'  => 'page',
				'post_title' => 'Contact',
				'menu_order' => 1,
			)
		);
		$team_id    = self::factory()->post->create(
			array(
				'post_type'   => 'page',
				'post_title'  => 'Team',
				'post_parent' => $about_id,
			)
		);
		self::factory()->post->create(
			array(
				'post_type'   => 'page',
				'post_title'  => 'Draft',
				'post_status' => 'draft',
			)
		);

		$fallback = WP_Navigation_Fallback::get_fallback();

		$this->assertInstanceOf( WP_Post::class, $fallback );
		$this->assertSame( 'wp_navigation', $fallback->post_type );
		$this->assertTrue( (bool) get_post_meta( $fallback->ID, self::META_KEY, true ) );
		$this->assertStringNotContainsString( 'wp:page-list', $fallback->post_content );

		$blocks = $this->get_menu_blocks( $fallback->ID );
		$this->assertCount( 2, $blocks, 'Only top-level published pages are top-level items.' );
		$this->assert_page_link_block( $blocks[0], $contact_id );

		$about = $blocks[1];
		$this->assertSame( 'core/navigation-submenu', $about['blockName'], 'A page with children becomes a submenu.' );
		$this->assertSame( $about_id, $about['attrs']['id'] );
		$this->assertSame( 'About', $about['attrs']['label'] );
		$this->assertSame( 'page', $about['attrs']['type'] );
		$this->assertSame( 'post-type', $about['attrs']['kind'] );
		$this->assertCount( 1, $about['innerBlocks'] );
		$this->assert_page_link_block( $about['innerBlocks'][0], $team_id );
	}

	public function test_fallback_menu_with_no_pages_is_empty_with_the_setting_on() {
		$fallback = WP_Navigation_Fallback::get_fallback();

		$this->assertInstanceOf( WP_Post::class, $fallback );
		$this->assertSame( '', $fallback->post_content );
		$this->assertTrue( (bool) get_post_meta( $fallback->ID, self::META_KEY, true ) );
	}

	public function test_fallback_reuses_an_existing_menu_without_touching_its_setting() {
		$menu_id = $this->create_menu( '<!-- wp:navigation-link {"label":"Home","url":"https://example.com","kind":"custom"} /-->' );
		self::factory()->post->create( array( 'post_type' => 'page' ) );

		$fallback = WP_Navigation_Fallback::get_fallback();

		$this->assertSame( $menu_id, $fallback->ID );
		$this->assertEmpty( get_post_meta( $menu_id, self::META_KEY, true ) );
		$this->assertCount(
			1,
			get_posts(
				array(
					'post_type'      => 'wp_navigation',
					'post_status'    => 'any',
					'posts_per_page' => -1,
				)
			)
		);
	}

	public function test_fallback_still_converts_a_classic_menu_first() {
		$menu_id = wp_create_nav_menu( 'Classic' );
		wp_update_nav_menu_item(
			$menu_id,
			0,
			array(
				'menu-item-title'  => 'Classic Link',
				'menu-item-url'    => 'https://example.com/classic',
				'menu-item-status' => 'publish',
			)
		);
		self::factory()->post->create( array( 'post_type' => 'page' ) );

		$fallback = WP_Navigation_Fallback::get_fallback();

		$this->assertStringContainsString( 'Classic Link', $fallback->post_content );
		$this->assertEmpty( get_post_meta( $fallback->ID, self::META_KEY, true ) );
		wp_delete_nav_menu( $menu_id );
	}

	public function test_fallback_rest_route_returns_the_page_link_menu() {
		wp_set_current_user( self::$admin_id );
		$page_id = self::factory()->post->create( array( 'post_type' => 'page' ) );

		$request  = new WP_REST_Request( 'GET', '/wp-block-editor/v1/navigation-fallback' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$menu_id = $response->get_data()['id'];
		$this->assertTrue( (bool) get_post_meta( $menu_id, self::META_KEY, true ) );
		$this->assert_page_link_block( $this->get_menu_blocks( $menu_id )[0], $page_id );
	}
}
