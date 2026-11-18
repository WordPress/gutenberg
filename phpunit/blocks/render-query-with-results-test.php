<?php
/**
 * Tests for the Query With Results block rendering.
 *
 * @package WordPress
 * @subpackage Blocks
 *
 * @group blocks
 */
class Tests_Blocks_RenderQueryWithResultsBlock extends WP_UnitTestCase {

	private static $posts;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$posts[] = $factory->post->create(
			array(
				'post_type'   => 'post',
				'post_status' => 'publish',
				'post_title'  => 'First post',
			)
		);

		self::$posts[] = $factory->post->create(
			array(
				'post_type'   => 'post',
				'post_status' => 'publish',
				'post_title'  => 'Second post',
			)
		);
	}

	public static function wpTearDownAfterClass() {
		foreach ( self::$posts as $post_to_delete ) {
			wp_delete_post( $post_to_delete, true );
		}
	}

	/**
	 * When the query has matching posts, the block should render its inner content.
	 */
	public function test_renders_content_when_query_has_results() {
		$content = <<<HTML
		<!-- wp:query {"query":{"postType":"post","inherit":false}} -->
		<div class="wp-block-query">
			<!-- wp:query-with-results -->
			<div class="wp-block-query-with-results"><!-- wp:paragraph --><p>Has results!</p><!-- /wp:paragraph --></div>
			<!-- /wp:query-with-results -->
		</div>
		<!-- /wp:query -->
HTML;

		$output = do_blocks( $content );

		$this->assertStringContainsString( 'wp-block-query-with-results', $output );
		$this->assertStringContainsString( 'Has results!', $output );
	}

	/**
	 * When the query has no matching posts, the block should render nothing at all,
	 * even though its inner content is non-empty.
	 */
	public function test_renders_nothing_when_query_has_no_results() {
		$content = <<<HTML
		<!-- wp:query {"query":{"postType":"page","inherit":false}} -->
		<div class="wp-block-query">
			<!-- wp:query-with-results -->
			<div class="wp-block-query-with-results"><!-- wp:paragraph --><p>Has results!</p><!-- /wp:paragraph --></div>
			<!-- /wp:query-with-results -->
		</div>
		<!-- /wp:query -->
HTML;

		$output = do_blocks( $content );

		$this->assertStringNotContainsString( 'wp-block-query-with-results', $output );
		$this->assertStringNotContainsString( 'Has results!', $output );
	}

	/**
	 * The block should follow the global query when `query.inherit` is `true`,
	 * the same way `core/query-no-results` and `core/post-template` do.
	 */
	public function test_follows_global_query_when_inherit_is_true() {
		global $wp_query, $wp_the_query;

		$original_wp_query     = $wp_query;
		$original_wp_the_query = $wp_the_query;

		$wp_query     = new WP_Query( array( 'post_type' => 'post' ) );
		$wp_the_query = $wp_query;

		$content = <<<HTML
		<!-- wp:query {"query":{"inherit":true}} -->
		<div class="wp-block-query">
			<!-- wp:query-with-results -->
			<div class="wp-block-query-with-results"><!-- wp:paragraph --><p>Has results!</p><!-- /wp:paragraph --></div>
			<!-- /wp:query-with-results -->
		</div>
		<!-- /wp:query -->
HTML;

		$output = do_blocks( $content );

		$wp_query     = $original_wp_query;
		$wp_the_query = $original_wp_the_query;

		$this->assertStringContainsString( 'wp-block-query-with-results', $output );
	}

	/**
	 * Renders nothing when its own inner content is empty, regardless of the query,
	 * mirroring the same early return `core/query-no-results` uses.
	 */
	public function test_renders_nothing_when_inner_content_is_empty() {
		$content = <<<HTML
		<!-- wp:query {"query":{"postType":"post","inherit":false}} -->
		<div class="wp-block-query">
			<!-- wp:query-with-results /-->
		</div>
		<!-- /wp:query -->
HTML;

		$output = do_blocks( $content );

		$this->assertStringNotContainsString( 'wp-block-query-with-results', $output );
	}
}
