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
		$this->assertSame( 'core/query::actions.prefetch', $p->get_attribute( 'data-wp-on--mouseenter' ) );
		$this->assertSame( 'core/query::callbacks.prefetch', $p->get_attribute( 'data-wp-watch' ) );

		$p->next_tag( array( 'class_name' => 'wp-block-query-pagination-next' ) );
		$this->assertSame( 'query-pagination-next', $p->get_attribute( 'data-wp-key' ) );
		$this->assertSame( 'core/query::actions.navigate', $p->get_attribute( 'data-wp-on--click' ) );
		$this->assertSame( 'core/query::actions.prefetch', $p->get_attribute( 'data-wp-on--mouseenter' ) );
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

	/**
	 * @ticket 86543
	 * @dataProvider data_enhanced_pagination_with_excerpt_content
	 *
	 * @param string $post_content      Post content used to generate an excerpt.
	 * @param string $post_excerpt      A manually supplied excerpt, if any.
	 * @param string $template_blocks   Blocks rendered in the Post Template.
	 * @param bool   $navigation_disabled Whether client navigation should be disabled.
	 * @param bool   $render_discarded_query Whether an excerpt filter renders another Query.
	 * @param bool   $render_incompatible_excerpt_html Whether an excerpt filter returns plugin markup.
	 */
	public function test_enhanced_pagination_with_excerpt_content( $post_content, $post_excerpt, $template_blocks, $navigation_disabled, $render_discarded_query = false, $render_incompatible_excerpt_html = false ) {
		global $wp_query, $wp_the_query;

		$post_id               = self::factory()->post->create(
			array(
				'post_status'  => 'publish',
				'post_content' => $post_content,
				'post_excerpt' => $post_excerpt,
			)
		);
		$original_wp_query     = $wp_query;
		$original_wp_the_query = $wp_the_query;
		$wp_query              = new WP_Query(
			array(
				'post__in'       => array( $post_id ),
				'posts_per_page' => 1,
			)
		);
		$wp_the_query          = $wp_query;
		$excerpt_filter        = static function ( $excerpt ) use ( $render_incompatible_excerpt_html ) {
			if ( $render_incompatible_excerpt_html ) {
				return do_blocks( '<!-- wp:test/plugin-block /-->' );
			}
			do_blocks(
				'<!-- wp:query {"queryId":86544,"query":{"inherit":true},"enhancedPagination":true} -->'
				. '<div class="wp-block-query"><!-- wp:paragraph --><p>Discarded query</p><!-- /wp:paragraph --></div><!-- /wp:query -->'
			);
			return $excerpt;
		};
		if ( $render_discarded_query || $render_incompatible_excerpt_html ) {
			add_filter( 'get_the_excerpt', $excerpt_filter, 20 );
		}

		try {
			$output = do_blocks(
				'<!-- wp:query {"queryId":86543,"query":{"inherit":true},"enhancedPagination":true} -->'
				. '<div class="wp-block-query"><!-- wp:post-template -->'
				. $template_blocks
				. '<!-- /wp:post-template --></div><!-- /wp:query -->'
			);
		} finally {
			if ( $render_discarded_query || $render_incompatible_excerpt_html ) {
				remove_filter( 'get_the_excerpt', $excerpt_filter, 20 );
			}
			$wp_query     = $original_wp_query;
			$wp_the_query = $original_wp_the_query;
		}

		$expected_text = $render_incompatible_excerpt_html ? 'wp-block-test/plugin-block' : 'Excerpt source';
		$this->assertStringContainsString( $expected_text, $output );
		$processor = new WP_HTML_Tag_Processor( $output );
		$this->assertTrue( $processor->next_tag( array( 'class_name' => 'wp-block-query' ) ) );
		$this->assertSame( 'query-86543', $processor->get_attribute( 'data-wp-router-region' ) );
		$router_config = wp_interactivity_config( 'core/router' );
		$this->assertSame( $navigation_disabled, $router_config['clientNavigationDisabled'] ?? false );
	}

	/**
	 * @return array
	 */
	public static function data_enhanced_pagination_with_excerpt_content() {
		$classic_content         = '<!-- wp:freeform --><p>Excerpt source</p><!-- /wp:freeform -->';
		$grouped_classic_content = '<!-- wp:group --><div class="wp-block-group">' . $classic_content . '</div><!-- /wp:group -->';
		$paragraph_content       = '<!-- wp:paragraph --><p>Excerpt source</p><!-- /wp:paragraph -->';
		$excerpt_block           = '<!-- wp:post-excerpt /-->';
		$post_content_block      = '<!-- wp:post-content /-->';
		$plugin_block            = '<!-- wp:test/plugin-block /-->';

		return array(
			'explicit legacy Classic block excerpt'       => array( $classic_content, '', $excerpt_block, false ),
			'automatic excerpt from grouped Classic'      => array( $grouped_classic_content, '', $excerpt_block, false ),
			'automatic excerpt from a Paragraph'          => array( $paragraph_content, '', $excerpt_block, false ),
			'manual excerpt from Classic content'         => array( $classic_content, 'Excerpt source', $excerpt_block, false ),
			'Classic block actually rendered'             => array( $classic_content, '', $post_content_block, true ),
			'excerpt followed by visible plugin'          => array( $grouped_classic_content, '', $excerpt_block . $plugin_block, true ),
			'nested excerpt query and visible plugin'     => array( $grouped_classic_content, '', $excerpt_block . $plugin_block, true, true ),
			'nested excerpt query without visible plugin' => array( $grouped_classic_content, '', $excerpt_block, false, true ),
			'Latest Posts retains incompatible excerpt HTML' => array( $paragraph_content, '', '<!-- wp:latest-posts {"displayPostContent":true,"displayPostContentRadio":"excerpt"} /-->', true, false, true ),
		);
	}
}
