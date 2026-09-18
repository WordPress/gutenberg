<?php
/**
 * Tests for the Term Template block rendering.
 *
 * @package WordPress
 * @subpackage Blocks
 *
 * @group blocks
 */
class Tests_Blocks_RenderTermTemplateBlock extends WP_UnitTestCase {

	/**
	 * Categories that have a published post, in creation order.
	 *
	 * @var int[]
	 */
	private static $populated_category_ids = array();

	/**
	 * Category without any posts.
	 *
	 * @var int
	 */
	private static $empty_category_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		for ( $i = 1; $i <= 6; $i++ ) {
			$category_id = $factory->category->create( array( 'name' => sprintf( 'Populated %d', $i ) ) );
			$factory->post->create(
				array(
					'post_status'   => 'publish',
					'post_category' => array( $category_id ),
				)
			);
			self::$populated_category_ids[] = $category_id;
		}

		self::$empty_category_id = $factory->category->create( array( 'name' => 'Empty category' ) );
	}

	public static function wpTearDownAfterClass() {
		foreach ( self::$populated_category_ids as $category_id ) {
			wp_delete_term( $category_id, 'category' );
		}
		wp_delete_term( self::$empty_category_id, 'category' );
	}

	/**
	 * Markup written by hand or shipped in a pattern can leave out `termQuery` keys
	 * that the Terms Query block fills in by default. The renderer must fall back to
	 * the same defaults instead of reading undefined keys, which rendered every term,
	 * empty ones included, in an unspecified order.
	 */
	public function test_partial_term_query_falls_back_to_the_terms_query_defaults() {
		$markup = '<!-- wp:terms-query {"termQuery":{"taxonomy":"category","perPage":5}} --><!-- wp:term-template --><!-- wp:term-name /--><!-- /wp:term-template --><!-- /wp:terms-query -->';
		$output = do_blocks( $markup );

		$this->assertSame( 5, substr_count( $output, '<li class="wp-block-term ' ), 'Only perPage terms are rendered.' );
		$this->assertStringNotContainsString( 'Empty category', $output, 'Empty terms are hidden by default.' );

		$expected_order = array( 'Populated 1', 'Populated 2', 'Populated 3', 'Populated 4', 'Populated 5' );
		preg_match_all( '/Populated \d/', $output, $matches );
		$this->assertSame( $expected_order, $matches[0], 'Terms are ordered by name, ascending, by default.' );
	}

	/**
	 * Values present in the markup keep taking precedence over the defaults.
	 */
	public function test_explicit_term_query_values_are_kept() {
		$markup = '<!-- wp:terms-query {"termQuery":{"taxonomy":"category","perPage":2,"hideEmpty":false,"orderBy":"name","order":"desc"}} --><!-- wp:term-template --><!-- wp:term-name /--><!-- /wp:term-template --><!-- /wp:terms-query -->';
		$output = do_blocks( $markup );

		$this->assertSame( 2, substr_count( $output, '<li class="wp-block-term ' ), 'Only perPage terms are rendered.' );
		$this->assertStringContainsString( 'Uncategorized', $output, 'Empty terms are rendered when hideEmpty is false.' );
		$this->assertStringContainsString( 'Populated 6', $output, 'Terms are ordered by name, descending.' );
		$this->assertStringNotContainsString( 'Populated 1', $output, 'Terms past perPage are not rendered.' );
	}
}
