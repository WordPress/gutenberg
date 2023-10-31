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

	private static $post_1;
	private static $post_2;
	private static $post_3;

	public function set_up() {
		parent::set_up();

		self::$post_1 = self::factory()->post->create_and_get(
			array(
				'post_type'    => 'post',
				'post_status'  => 'publish',
				'post_name'    => 'post-1',
				'post_title'   => 'Post 1',
				'post_content' => 'Post 1 content',
				'post_excerpt' => 'Post 1',
			)
		);

		self::$post_2 = self::factory()->post->create_and_get(
			array(
				'post_type'    => 'post',
				'post_status'  => 'publish',
				'post_name'    => 'post-2',
				'post_title'   => 'Post 2',
				'post_content' => 'Post 2 content',
				'post_excerpt' => 'Post 2',
			)
		);
	}

	/**
	 * Tests that the `core/block` block adds the corresponding directives when
	 * the `enhancedPagination` attribute is set.
	 */
	public function test_rendering_query_with_enhanced_pagination() {
		global $wp_query, $wp_the_query;

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
			)
		);

		$wp_the_query = $wp_query;

		$output = do_blocks( $content );

		$p = new WP_HTML_Tag_Processor( $output );

		$p->next_tag( array( 'class_name' => 'wp-block-query' ) );
		$this->assertSame( '{"core":{"query":{"loadingText":"Loading page, please wait.","loadedText":"Page Loaded."}}}', $p->get_attribute( 'data-wp-context' ) );
		$this->assertSame( 'query-0', $p->get_attribute( 'data-wp-navigation-id' ) );
		$this->assertSame( true, $p->get_attribute( 'data-wp-interactive' ) );

		$p->next_tag( array( 'class_name' => 'wp-block-post' ) );
		$this->assertSame( 'post-template-item-' . self::$post_2->ID, $p->get_attribute( 'data-wp-key' ) );

		$p->next_tag( array( 'class_name' => 'wp-block-query-pagination-next' ) );
		$this->assertSame( 'query-pagination-next', $p->get_attribute( 'data-wp-key' ) );
		$this->assertSame( 'actions.core.query.navigate', $p->get_attribute( 'data-wp-on--click' ) );
		$this->assertSame( 'actions.core.query.prefetch', $p->get_attribute( 'data-wp-on--mouseenter' ) );
		$this->assertSame( 'effects.core.query.prefetch', $p->get_attribute( 'data-wp-effect' ) );

		$p->next_tag( array( 'class_name' => 'screen-reader-text' ) );
		$this->assertSame( 'polite', $p->get_attribute( 'aria-live' ) );
		$this->assertSame( 'context.core.query.message', $p->get_attribute( 'data-wp-text' ) );

		$p->next_tag( array( 'class_name' => 'wp-block-query__enhanced-pagination-animation' ) );
		$this->assertSame( 'selectors.core.query.startAnimation', $p->get_attribute( 'data-wp-class--start-animation' ) );
		$this->assertSame( 'selectors.core.query.finishAnimation', $p->get_attribute( 'data-wp-class--finish-animation' ) );
	}



	/**
	 * Tests that the `core/block` block adds an extra attribute to disable the
	 * enhanced pagination in the browser when a plugin block is found inside.
	 */
	public function test_rendering_query_with_enhanced_pagination_auto_disabled() {
		global $wp_query, $wp_the_query;

		$content = <<<HTML
		<!-- wp:query {"queryId":0,"query":{"inherit":true},"enhancedPagination":true} -->
		<div class="wp-block-query">
			<!-- wp:post-template {"align":"wide"} -->
				<!-- wp:test/plugin-block /-->
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
			)
		);

		$wp_the_query = $wp_query;

		register_block_type(
			'test/plugin-block',
			array(
				'render_callback' => static function () {
					return '<div class="wp-block-test/plugin-block">Test</div>';
				},
			)
		);

		$output = do_blocks( $content );

		$p = new WP_HTML_Tag_Processor( $output );

		$p->next_tag( array( 'class_name' => 'wp-block-query' ) );
		$this->assertSame( 'query-0', $p->get_attribute( 'data-wp-navigation-id' ) );
		$this->assertSame( 'true', $p->get_attribute( 'data-wp-navigation-disabled' ) );
	}
}
