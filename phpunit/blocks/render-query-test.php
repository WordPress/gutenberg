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

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$posts = $factory->post->create_many( 3 );

		register_block_type(
			'test/plugin-block',
			array(
				'render_callback' => static function () {
					return '<div class="wp-block-test/plugin-block">Test</div>';
				},
			)
		);
	}

	public static function wpTearDownAfterClass() {
		unregister_block_type( 'test/plugin-block' );
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
		$this->assertSame( '{"loadingText":"Loading page, please wait.","loadedText":"Page Loaded."}', $p->get_attribute( 'data-wp-context' ) );
		$this->assertSame( 'query-0', $p->get_attribute( 'data-wp-router-region' ) );
		$this->assertSame( '{"namespace":"core/query"}', $p->get_attribute( 'data-wp-interactive' ) );

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

		$p->next_tag( array( 'class_name' => 'screen-reader-text' ) );
		$this->assertSame( 'polite', $p->get_attribute( 'aria-live' ) );
		$this->assertSame( 'context.message', $p->get_attribute( 'data-wp-text' ) );

		$p->next_tag( array( 'class_name' => 'wp-block-query__enhanced-pagination-animation' ) );
		$this->assertSame( 'state.startAnimation', $p->get_attribute( 'data-wp-class--start-animation' ) );
		$this->assertSame( 'state.finishAnimation', $p->get_attribute( 'data-wp-class--finish-animation' ) );
	}

	/**
	 * Tests that the `core/query` block adds an extra attribute to disable the
	 * enhanced pagination in the browser when a plugin block is found inside.
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
		$this->assertSame( 'true', $p->get_attribute( 'data-wp-navigation-disabled' ) );
	}


	/**
	 * Tests that the `core/query` last tag is rendered with the tagName attribute
	 * if is defined, having a div as default.
	 */
	public function test_enhanced_query_markup_rendering_at_bottom_on_custom_html_element_tags() {
		global $wp_query, $wp_the_query;

		$content = <<<HTML
		<!-- wp:query {"queryId":0,"query":{"inherit":true},"tagName":"aside","enhancedPagination":true} -->
		<aside class="wp-block-query">
			<!-- wp:post-template {"align":"wide"} -->
				<!-- wp:test/plugin-block /-->
			<!-- /wp:post-template -->
			<span>Helper to get last HTML Tag</span>
		</aside>
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

		$p->next_tag( 'span' );

		// Test that there is a div added just after the last tag inside the aside.
		$this->assertSame( $p->next_tag(), true );
		// Test that that div is the accesibility one.
		$this->assertSame( 'screen-reader-text', $p->get_attribute( 'class' ) );
		$this->assertSame( 'context.message', $p->get_attribute( 'data-wp-text' ) );
		$this->assertSame( 'polite', $p->get_attribute( 'aria-live' ) );
	}

	/**
	 * Tests that the `core/query` block adds an extra attribute to disable the
	 * enhanced pagination in the browser when a post content block is found inside.
	 */
	public function test_rendering_query_with_enhanced_pagination_auto_disabled_when_post_content_block_is_found() {
		global $wp_query, $wp_the_query;

		$content = <<<HTML
		<!-- wp:query {"queryId":0,"query":{"inherit":true},"enhancedPagination":true} -->
		<div class="wp-block-query">
			<!-- wp:post-template {"align":"wide"} -->
				<!-- wp:post-content /-->
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
		$this->assertSame( 'true', $p->get_attribute( 'data-wp-navigation-disabled' ) );
	}

	/**
	 * Tests that the correct `core/query` blocks get the attribute that
	 * disables enhanced pagination only if they contain a descendant that is
	 * not supported (i.e., a plugin block).
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
		$this->assertSame( 'true', $p->get_attribute( 'data-wp-navigation-disabled' ) );

		// Query 1 does not contain a plugin block -> enabled.
		$p->next_tag( array( 'class_name' => 'wp-block-query' ) );
		$this->assertSame( 'query-1', $p->get_attribute( 'data-wp-router-region' ) );
		$this->assertSame( null, $p->get_attribute( 'data-wp-navigation-disabled' ) );

		// Query 2 contains a plugin block -> disabled.
		$p->next_tag( array( 'class_name' => 'wp-block-query' ) );
		$this->assertSame( 'query-2', $p->get_attribute( 'data-wp-router-region' ) );
		$this->assertSame( 'true', $p->get_attribute( 'data-wp-navigation-disabled' ) );
	}
}
