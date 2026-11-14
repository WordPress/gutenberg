<?php
/**
 * Navigation block slug reference tests.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests referencing a Navigation Menu from a Navigation block by slug.
 *
 * @group blocks
 * @group navigation-slug
 */
class Render_Block_Navigation_Slug_Test extends WP_UnitTestCase {

	/**
	 * Published Navigation Menu with the `header` slug.
	 *
	 * @var int
	 */
	private static $header_menu_id;

	/**
	 * Published Navigation Menu with the `footer` slug.
	 *
	 * @var int
	 */
	private static $footer_menu_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$header_menu_id = $factory->post->create(
			array(
				'post_type'    => 'wp_navigation',
				'post_title'   => 'Header Menu',
				'post_name'    => 'header',
				'post_status'  => 'publish',
				'post_content' => '<!-- wp:navigation-link {"label":"Header link","url":"/header"} /-->',
			)
		);

		self::$footer_menu_id = $factory->post->create(
			array(
				'post_type'    => 'wp_navigation',
				'post_title'   => 'Footer Menu',
				'post_name'    => 'footer',
				'post_status'  => 'publish',
				'post_content' => '<!-- wp:navigation-link {"label":"Footer link","url":"/footer"} /-->',
			)
		);
	}

	public static function wpTearDownAfterClass() {
		wp_delete_post( self::$header_menu_id, true );
		wp_delete_post( self::$footer_menu_id, true );
	}

	/**
	 * Invokes a private static method on the Navigation block renderer.
	 *
	 * @param string $method_name The method to invoke.
	 * @param array  $args        The arguments to invoke it with.
	 * @return mixed The method return value.
	 */
	private function invoke_renderer_method( $method_name, $args ) {
		$reflection = new ReflectionClass( 'WP_Navigation_Block_Renderer_Gutenberg' );
		$method     = $reflection->getMethod( $method_name );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		return $method->invokeArgs( $reflection, $args );
	}

	/**
	 * Gets the labels of the inner blocks resolved for a set of block attributes.
	 *
	 * @param array $attributes The Navigation block attributes.
	 * @return array The resolved navigation link labels.
	 */
	private function get_resolved_link_labels( $attributes ) {
		$inner_blocks = $this->invoke_renderer_method(
			'get_inner_blocks_from_navigation_post',
			array( $attributes )
		);

		$labels = array();
		foreach ( $inner_blocks as $inner_block ) {
			$labels[] = $inner_block->attributes['label'] ?? null;
		}

		return $labels;
	}

	/**
	 * @covers WP_Navigation_Block_Renderer::get_navigation_post
	 */
	public function test_slug_resolves_the_matching_navigation_menu() {
		$this->assertSame(
			array( 'Header link' ),
			$this->get_resolved_link_labels( array( 'slug' => 'header' ) )
		);
	}

	/**
	 * A slug reference is portable across sites, so it wins over a site
	 * specific post ID.
	 *
	 * @covers WP_Navigation_Block_Renderer::get_navigation_post
	 */
	public function test_slug_takes_precedence_over_ref() {
		$this->assertSame(
			array( 'Header link' ),
			$this->get_resolved_link_labels(
				array(
					'slug' => 'header',
					'ref'  => self::$footer_menu_id,
				)
			)
		);
	}

	/**
	 * @covers WP_Navigation_Block_Renderer::get_navigation_post
	 */
	public function test_ref_is_used_when_there_is_no_slug() {
		$this->assertSame(
			array( 'Footer link' ),
			$this->get_resolved_link_labels(
				array( 'ref' => self::$footer_menu_id )
			)
		);
	}

	/**
	 * @covers WP_Navigation_Block_Renderer::get_navigation_post_by_slug
	 */
	public function test_unknown_slug_resolves_no_inner_blocks() {
		$this->assertSame(
			array(),
			$this->get_resolved_link_labels( array( 'slug' => 'does-not-exist' ) )
		);
	}

	/**
	 * A hand authored slug should resolve the same menu as the stored slug.
	 *
	 * @covers WP_Navigation_Block_Renderer::get_navigation_post_by_slug
	 */
	public function test_slug_is_sanitized_before_it_is_resolved() {
		$this->assertSame(
			array( 'Header link' ),
			$this->get_resolved_link_labels( array( 'slug' => 'Header' ) )
		);
	}

	/**
	 * Only published menus render on the front end, matching the `ref` behavior.
	 *
	 * @covers WP_Navigation_Block_Renderer::get_navigation_post_by_slug
	 */
	public function test_draft_menu_is_not_resolved_by_slug() {
		$draft_menu_id = self::factory()->post->create(
			array(
				'post_type'    => 'wp_navigation',
				'post_title'   => 'Sidebar Menu',
				'post_name'    => 'sidebar',
				'post_status'  => 'draft',
				'post_content' => '<!-- wp:navigation-link {"label":"Sidebar link","url":"/sidebar"} /-->',
			)
		);

		$this->assertSame(
			array(),
			$this->get_resolved_link_labels( array( 'slug' => 'sidebar' ) )
		);

		wp_delete_post( $draft_menu_id, true );
	}

	/**
	 * @covers WP_Navigation_Block_Renderer::get_navigation_post_by_slug
	 */
	public function test_resolve_menu_by_slug_filter_can_remap_the_menu() {
		$filter = static function ( $navigation_post, $slug ) {
			if ( 'header' !== $slug ) {
				return $navigation_post;
			}

			return get_post( self::$footer_menu_id );
		};

		add_filter( 'block_core_navigation_resolve_menu_by_slug', $filter, 10, 2 );

		$labels = $this->get_resolved_link_labels( array( 'slug' => 'header' ) );

		remove_filter( 'block_core_navigation_resolve_menu_by_slug', $filter, 10 );

		$this->assertSame( array( 'Footer link' ), $labels );
	}

	/**
	 * @covers WP_Navigation_Block_Renderer::get_navigation_post_by_slug
	 */
	public function test_resolve_menu_by_slug_filter_receives_the_requested_slug() {
		$received = null;

		$filter = static function ( $navigation_post, $slug ) use ( &$received ) {
			$received = $slug;
			return $navigation_post;
		};

		add_filter( 'block_core_navigation_resolve_menu_by_slug', $filter, 10, 2 );

		$this->get_resolved_link_labels( array( 'slug' => 'Header' ) );

		remove_filter( 'block_core_navigation_resolve_menu_by_slug', $filter, 10 );

		$this->assertSame( 'header', $received );
	}

	/**
	 * @covers WP_Navigation_Block_Renderer::get_navigation_name
	 */
	public function test_navigation_name_comes_from_the_slug_resolved_menu() {
		$this->assertSame(
			'Header Menu',
			$this->invoke_renderer_method(
				'get_navigation_name',
				array( array( 'slug' => 'header' ) )
			)
		);
	}

	/**
	 * @covers WP_Navigation_Block_Renderer::get_navigation_name
	 */
	public function test_aria_label_still_wins_over_the_slug_resolved_menu() {
		$this->assertSame(
			'Primary',
			$this->invoke_renderer_method(
				'get_navigation_name',
				array(
					array(
						'slug'      => 'header',
						'ariaLabel' => 'Primary',
					),
				)
			)
		);
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
	 * A slug is a portability contract, so resolving the post ID stored beside
	 * it would render a different menu than the one the markup asked for.
	 *
	 * @covers WP_Navigation_Block_Renderer::get_navigation_post
	 */
	public function test_unknown_slug_does_not_fall_back_to_the_ref() {
		$this->assertSame(
			array(),
			$this->get_resolved_link_labels(
				array(
					'slug' => 'does-not-exist',
					'ref'  => self::$footer_menu_id,
				)
			)
		);
	}

	/**
	 * Blocks saved before this attribute existed carry no slug, and a block
	 * whose slug was cleared is in the same position.
	 *
	 * @covers WP_Navigation_Block_Renderer::get_navigation_post
	 */
	public function test_empty_slug_falls_back_to_the_ref() {
		$this->assertSame(
			array( 'Footer link' ),
			$this->get_resolved_link_labels(
				array(
					'slug' => '',
					'ref'  => self::$footer_menu_id,
				)
			)
		);
	}

	/**
	 * @covers WP_Navigation_Block_Renderer::get_navigation_post_by_slug
	 */
	public function test_slug_that_sanitizes_to_nothing_resolves_no_menu() {
		$this->assertSame(
			array(),
			$this->get_resolved_link_labels(
				array(
					'slug' => '!!!',
					'ref'  => self::$footer_menu_id,
				)
			)
		);
	}

	/**
	 * WordPress percent encodes the characters it cannot fold to ASCII, so the
	 * stored slug no longer looks like the one that was typed. Both forms have
	 * to resolve the menu, since either may end up in saved markup.
	 *
	 * @covers WP_Navigation_Block_Renderer::get_navigation_post_by_slug
	 */
	public function test_slug_resolves_a_menu_stored_percent_encoded() {
		$menu_id = self::factory()->post->create(
			array(
				'post_type'    => 'wp_navigation',
				'post_title'   => '你好',
				'post_name'    => sanitize_title( '你好' ),
				'post_status'  => 'publish',
				'post_content' => '<!-- wp:navigation-link {"label":"Encoded link","url":"/ni-hao"} /-->',
			)
		);

		$this->assertSame(
			'%e4%bd%a0%e5%a5%bd',
			get_post( $menu_id )->post_name,
			'The menu should be stored under a percent encoded slug.'
		);
		$this->assertSame(
			array( 'Encoded link' ),
			$this->get_resolved_link_labels( array( 'slug' => '你好' ) ),
			'The slug as it was typed should resolve the menu.'
		);
		$this->assertSame(
			array( 'Encoded link' ),
			$this->get_resolved_link_labels( array( 'slug' => '%e4%bd%a0%e5%a5%bd' ) ),
			'The slug as it was stored should resolve the menu.'
		);

		wp_delete_post( $menu_id, true );
	}

	/**
	 * Only published menus render on the front end, whatever keeps a menu from
	 * being published.
	 *
	 * @covers WP_Navigation_Block_Renderer::get_navigation_post_by_slug
	 *
	 * @dataProvider data_unpublished_statuses
	 *
	 * @param string $post_status The status to store the menu under.
	 */
	public function test_unpublished_menu_is_not_resolved_by_slug( $post_status ) {
		$menu_id = self::factory()->post->create(
			array(
				'post_type'    => 'wp_navigation',
				'post_title'   => 'Sidebar Menu',
				'post_name'    => 'sidebar',
				'post_status'  => $post_status,
				'post_content' => '<!-- wp:navigation-link {"label":"Sidebar link","url":"/sidebar"} /-->',
			)
		);

		$labels = $this->get_resolved_link_labels( array( 'slug' => 'sidebar' ) );

		wp_delete_post( $menu_id, true );

		$this->assertSame( array(), $labels );
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public function data_unpublished_statuses() {
		return array(
			'draft'   => array( 'draft' ),
			'pending' => array( 'pending' ),
			'private' => array( 'private' ),
		);
	}

	/**
	 * The filter is what a multilingual plugin maps a slug through, so it has
	 * to run for a slug that matches nothing on its own.
	 *
	 * @covers WP_Navigation_Block_Renderer::get_navigation_post_by_slug
	 */
	public function test_resolve_menu_by_slug_filter_can_resolve_an_unmatched_slug() {
		$filter = static function ( $navigation_post, $slug ) {
			if ( 'primary' !== $slug ) {
				return $navigation_post;
			}

			return get_post( self::$footer_menu_id );
		};

		add_filter( 'block_core_navigation_resolve_menu_by_slug', $filter, 10, 2 );

		$labels = $this->get_resolved_link_labels( array( 'slug' => 'primary' ) );

		remove_filter( 'block_core_navigation_resolve_menu_by_slug', $filter, 10 );

		$this->assertSame( array( 'Footer link' ), $labels );
	}

	/**
	 * A filter may also refuse a menu that would otherwise resolve, which is
	 * how a slug is hidden from a language that has no menu for it.
	 *
	 * @covers WP_Navigation_Block_Renderer::get_navigation_post_by_slug
	 */
	public function test_resolve_menu_by_slug_filter_can_reject_the_matched_menu() {
		$filter = static function () {
			return null;
		};

		add_filter( 'block_core_navigation_resolve_menu_by_slug', $filter );

		$labels = $this->get_resolved_link_labels( array( 'slug' => 'header' ) );

		remove_filter( 'block_core_navigation_resolve_menu_by_slug', $filter );

		$this->assertSame( array(), $labels );
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

	/**
	 * Blocks saved under the original attribute name still render.
	 *
	 * @covers ::gutenberg_render_block_core_navigation
	 */
	public function test_legacy_navigation_menu_id_attribute_still_renders() {
		$rendered = do_blocks(
			sprintf(
				'<!-- wp:navigation {"navigationMenuId":%d} /-->',
				self::$footer_menu_id
			)
		);

		$this->assertStringContainsString( 'Footer link', $rendered );
	}

	/**
	 * @covers ::gutenberg_render_block_core_navigation
	 */
	public function test_navigation_block_renders_the_menu_referenced_by_ref() {
		$rendered = do_blocks(
			sprintf( '<!-- wp:navigation {"ref":%d} /-->', self::$footer_menu_id )
		);

		$this->assertStringContainsString( 'Footer link', $rendered );
		$this->assertStringNotContainsString( 'Header link', $rendered );
	}

	/**
	 * Creates a classic menu at a theme location, as the `__unstableLocation`
	 * fallback reads it.
	 *
	 * @param string $location The theme location to register the menu at.
	 * @return int The classic menu term ID.
	 */
	private function create_classic_menu_at_location( $location ) {
		register_nav_menu( $location, 'Primary' );

		$menu_id = wp_create_nav_menu( 'Classic Menu' );
		wp_update_nav_menu_item(
			$menu_id,
			0,
			array(
				'menu-item-title'  => 'Classic link',
				'menu-item-url'    => '/classic',
				'menu-item-status' => 'publish',
			)
		);
		set_theme_mod( 'nav_menu_locations', array( $location => $menu_id ) );

		return $menu_id;
	}

	/**
	 * The classic menu fallback is unchanged for the blocks that relied on it.
	 *
	 * @covers WP_Navigation_Block_Renderer::get_inner_blocks
	 */
	public function test_classic_menu_location_still_renders_without_a_slug() {
		// Deprecated in trunk, and still what the classic menu path calls.
		$this->setExpectedDeprecated( 'gutenberg_block_core_navigation_parse_blocks_from_menu_items' );

		$menu_id = $this->create_classic_menu_at_location( 'primary' );

		$rendered = do_blocks( '<!-- wp:navigation {"__unstableLocation":"primary"} /-->' );

		wp_delete_nav_menu( $menu_id );
		remove_theme_mod( 'nav_menu_locations' );

		$this->assertStringContainsString( 'Classic link', $rendered );
	}

	/**
	 * A slug points at one menu, so it should not be overruled by whatever
	 * classic menu happens to sit at the block's old location.
	 *
	 * @covers WP_Navigation_Block_Renderer::get_inner_blocks
	 */
	public function test_slug_wins_over_a_classic_menu_location() {
		$menu_id = $this->create_classic_menu_at_location( 'primary' );

		$rendered = do_blocks( '<!-- wp:navigation {"slug":"footer","__unstableLocation":"primary"} /-->' );

		wp_delete_nav_menu( $menu_id );
		remove_theme_mod( 'nav_menu_locations' );

		$this->assertStringContainsString( 'Footer link', $rendered );
		$this->assertStringNotContainsString( 'Classic link', $rendered );
	}

	/**
	 * @covers ::gutenberg_render_block_core_navigation
	 */
	public function test_navigation_block_renders_the_menu_referenced_by_slug() {
		$rendered = do_blocks( '<!-- wp:navigation {"slug":"footer"} /-->' );

		$this->assertStringContainsString( 'Footer link', $rendered );
		$this->assertStringNotContainsString( 'Header link', $rendered );
	}
}
