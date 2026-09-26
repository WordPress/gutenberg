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
	 * @covers ::gutenberg_render_block_core_navigation
	 */
	public function test_navigation_block_renders_the_menu_referenced_by_slug() {
		$rendered = do_blocks( '<!-- wp:navigation {"slug":"footer"} /-->' );

		$this->assertStringContainsString( 'Footer link', $rendered );
		$this->assertStringNotContainsString( 'Header link', $rendered );
	}
}
