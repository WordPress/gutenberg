<?php
/**
 * Tests for the Query block rendering.
 *
 * @package WordPress
 * @subpackage Blocks
 * @since 6.0.0
 *
 * @group blocks
 */
class Tests_Blocks_RenderQueryBlock extends WP_UnitTestCase {

	private static $posts;

	private $original_wp_interactivity;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		register_block_type(
			'test/plugin-block',
			array(
				'render_callback' => static function () {
					return '<div class="wp-block-test/plugin-block">Test</div>';
				},
			)
		);

		self::$posts[] = $factory->post->create(
			array(
				'post_type'   => 'post',
				'post_status' => 'publish',
				'post_name'   => 'empty_post',
				'post_title'  => 'Empty post',
			)
		);

		self::$posts[] = $factory->post->create(
			array(
				'post_type'    => 'post',
				'post_status'  => 'publish',
				'post_name'    => 'compatible_post',
				'post_title'   => 'Compatible post',
				'post_content' => '<!-- wp:paragraph --><p>Compatible</p><!-- /wp:paragraph -->',
			)
		);

		self::$posts[] = $factory->post->create(
			array(
				'post_type'    => 'post',
				'post_status'  => 'publish',
				'post_name'    => 'incompatible_post',
				'post_title'   => 'Incompatible post',
				'post_content' => '<!-- wp:test/plugin-block /-->',
			)
		);
	}

	public static function wpTearDownAfterClass() {
		foreach ( self::$posts as $post_to_delete ) {
			wp_delete_post( $post_to_delete, true );
		}
		unregister_block_type( 'test/plugin-block' );
	}

	public function set_up() {
		parent::set_up();
		global $wp_interactivity;
		$this->original_wp_interactivity = $wp_interactivity;
		$wp_interactivity                = new WP_Interactivity_API();
	}

	public function tear_down() {
		global $wp_interactivity;
		$wp_interactivity = $this->original_wp_interactivity;
		parent::tear_down();
	}


	/**
	 * Tests that the `core/query` block adds the corresponding directives when
	 * the `enhancedPagination` attribute is set.
	 */
	public function test_rendering_query_with_enhanced_pagination() {
		global $wp_query, $wp_the_query, $paged;

		$content = <<<HTML
		<!-- wp:query {"queryId":0,"query":{"inherit":true},"enhancedPagination":true} -->
		<div class="wp-block-query">
			<!-- wp:post-template {"align":"wide"} -->
			<!-- /wp:post-template -->
			<!-- wp:query-pagination -->
				<!-- wp:query-pagination-previous /-->
				<!-- wp:query-pagination-next /-->
			<!-- /wp:query-pagination -->
		</div>
		<!-- /wp:query -->
HTML;

		// Set main query to single post.
		$wp_query = new WP_Query(
			array(
				'posts_per_page' => 1,
				'paged'          => 2,
			)
		);

		$wp_the_query = $wp_query;
		$prev_paged   = $paged;
		$paged        = 2;

		$output = do_blocks( $content );

		$paged = $prev_paged;

		$p = new WP_HTML_Tag_Processor( $output );

		$p->next_tag( array( 'class_name' => 'wp-block-query' ) );
		$this->assertSame( '{}', $p->get_attribute( 'data-wp-context' ) );
		$this->assertSame( 'query-0', $p->get_attribute( 'data-wp-router-region' ) );
		$this->assertSame( 'core/query', $p->get_attribute( 'data-wp-interactive' ) );

		$p->next_tag( array( 'class_name' => 'wp-block-post' ) );
		$this->assertSame( 'post-template-item-' . self::$posts[1], $p->get_attribute( 'data-wp-key' ) );

		$p->next_tag( array( 'class_name' => 'wp-block-query-pagination-previous' ) );
		$this->assertSame( 'query-pagination-previous', $p->get_attribute( 'data-wp-key' ) );
		$this->assertSame( 'core/query::actions.navigate', $p->get_attribute( 'data-wp-on--click' ) );
		$this->assertSame( 'core/query::actions.prefetch', $p->get_attribute( 'data-wp-on-async--mouseenter' ) );
		$this->assertSame( 'core/query::callbacks.prefetch', $p->get_attribute( 'data-wp-watch' ) );

		$p->next_tag( array( 'class_name' => 'wp-block-query-pagination-next' ) );
		$this->assertSame( 'query-pagination-next', $p->get_attribute( 'data-wp-key' ) );
		$this->assertSame( 'core/query::actions.navigate', $p->get_attribute( 'data-wp-on--click' ) );
		$this->assertSame( 'core/query::actions.prefetch', $p->get_attribute( 'data-wp-on-async--mouseenter' ) );
		$this->assertSame( 'core/query::callbacks.prefetch', $p->get_attribute( 'data-wp-watch' ) );

		$router_config = wp_interactivity_config( 'core/router' );
		$this->assertEmpty( $router_config );
	}

	/**
	 * Tests that the `core/query` block sets the option
	 * `clientNavigationDisabled` to `true` in the `core/router` store config
	 * when a plugin block is found inside.
	 */
	public function test_rendering_query_with_enhanced_pagination_auto_disabled_when_plugins_blocks_are_found() {
		global $wp_query, $wp_the_query;

		$content = <<<HTML
		<!-- wp:query {"queryId":0,"query":{"inherit":true},"enhancedPagination":true} -->
		<div class="wp-block-query">
			<!-- wp:post-template {"align":"wide"} -->
				<!-- wp:test/plugin-block /-->
			<!-- /wp:post-template -->
		</div>
		<!-- /wp:query -->
HTML;

		// Set main query to single post.
		$wp_query = new WP_Query(
			array(
				'posts_per_page' => 1,
			)
		);

		$wp_the_query = $wp_query;

		$output = do_blocks( $content );

		$p = new WP_HTML_Tag_Processor( $output );

		$p->next_tag( array( 'class_name' => 'wp-block-query' ) );
		$this->assertSame( 'query-0', $p->get_attribute( 'data-wp-router-region' ) );

		$router_config = wp_interactivity_config( 'core/router' );
		$this->assertTrue( $router_config['clientNavigationDisabled'] );
	}

	/**
	 * Tests that, whenever a `core/query` contains a descendant that is not
	 * supported (i.e., a plugin block), the option `clientNavigationDisabled`
	 * is set to `true` in the `core/router` store config.
	 */
	public function test_rendering_nested_queries_with_enhanced_pagination_auto_disabled() {
		global $wp_query, $wp_the_query;

		$content = <<<HTML
			<!-- wp:query {"queryId":0,"query":{"inherit":true},"enhancedPagination":true} -->
			<div class="wp-block-query">
				<!-- wp:post-template {"align":"wide"} -->
					<!-- wp:query {"queryId":1,"query":{"inherit":true},"enhancedPagination":true} -->
					<div class="wp-block-query">
						<!-- wp:post-template {"align":"wide"} -->
						<!-- /wp:post-template -->
					</div>
					<!-- /wp:query-pagination -->
					<!-- wp:query {"queryId":2,"query":{"inherit":true},"enhancedPagination":true} -->
					<div class="wp-block-query">
						<!-- wp:post-template {"align":"wide"} -->
							<!-- wp:test/plugin-block /-->
						<!-- /wp:post-template -->
					</div>
					<!-- /wp:query-pagination -->
				<!-- /wp:post-template -->
			</div>
			<!-- /wp:query -->
HTML;

		// Set main query to single post.
		$wp_query = new WP_Query(
			array(
				'posts_per_page' => 1,
			)
		);

		$wp_the_query = $wp_query;

		$output = do_blocks( $content );

		$p = new WP_HTML_Tag_Processor( $output );

		// Query 0 contains a plugin block inside query-2 -> disabled.
		$p->next_tag( array( 'class_name' => 'wp-block-query' ) );
		$this->assertSame( 'query-0', $p->get_attribute( 'data-wp-router-region' ) );

		// Query 1 does not contain a plugin block -> enabled.
		$p->next_tag( array( 'class_name' => 'wp-block-query' ) );
		$this->assertSame( 'query-1', $p->get_attribute( 'data-wp-router-region' ) );

		// Query 2 contains a plugin block -> disabled.
		$p->next_tag( array( 'class_name' => 'wp-block-query' ) );
		$this->assertSame( 'query-2', $p->get_attribute( 'data-wp-router-region' ) );

		$router_config = wp_interactivity_config( 'core/router' );
		$this->assertTrue( $router_config['clientNavigationDisabled'] );
	}

	/**
	 * Tests that `clientNavigationDisabled` is enabled when
	 * there is an incompatible block in post content.
	 */
	public function test_rendering_query_with_enhanced_pagination_is_disabled_with_incompatible_block_inside_post_content() {
		global $wp_query, $wp_the_query;

		$content      = <<<HTML
		<!-- wp:query {"queryId":0,"query":{"inherit":true},"enhancedPagination":true} -->
		<div class="wp-block-query">
			<!-- wp:post-template {"align":"wide"} -->
				<!-- wp:post-content /-->
			<!-- /wp:post-template -->
		</div>
		<!-- /wp:query -->
HTML;
		$wp_query     = new WP_Query(
			array(
				'posts_per_page' => 1,
				'paged'          => 1,
			)
		);
		$wp_the_query = $wp_query;

		$output = do_blocks( $content );

		$p = new WP_HTML_Tag_Processor( $output );
		$p->next_tag( array( 'class_name' => 'wp-block-query' ) );
		$this->assertSame( 'query-0', $p->get_attribute( 'data-wp-router-region' ) );
		$router_config = wp_interactivity_config( 'core/router' );
		$this->assertTrue( $router_config['clientNavigationDisabled'] );
	}

	/**
	 * Tests that `clientNavigationDisabled` doesn't exist when
	 * there all blocks inside post content are compatible.
	 */
	public function test_rendering_query_with_enhanced_pagination_with_compatible_blocks_inside_post_content() {
		global $wp_query, $wp_the_query, $paged;

		$content      = <<<HTML
		<!-- wp:query {"queryId":0,"query":{"inherit":true},"enhancedPagination":true} -->
		<div class="wp-block-query">
			<!-- wp:post-template {"align":"wide"} -->
				<!-- wp:post-content /-->
			<!-- /wp:post-template -->
		</div>
		<!-- /wp:query -->
HTML;
		$wp_query     = new WP_Query(
			array(
				'posts_per_page' => 1,
				'paged'          => 2,
			)
		);
		$prev_paged   = $paged;
		$paged        = 2;
		$wp_the_query = $wp_query;

		$output = do_blocks( $content );

		$paged = $prev_paged;

		$p = new WP_HTML_Tag_Processor( $output );
		$p->next_tag( array( 'class_name' => 'wp-block-query' ) );
		$this->assertSame( 'query-0', $p->get_attribute( 'data-wp-router-region' ) );
		$router_config = wp_interactivity_config( 'core/router' );
		$this->assertArrayNotHasKey( 'clientNavigationDisabled', $router_config );
	}
}
