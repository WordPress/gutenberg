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
	 * Posts created for the populated categories.
	 *
	 * @var int[]
	 */
	private static $post_ids = array();

	/**
	 * Categories without any posts.
	 *
	 * @var int[]
	 */
	private static $empty_category_ids = array();

	/**
	 * Creates six populated categories and two empty ones, named so that they
	 * sort predictably around each other and around the default category.
	 *
	 * @param WP_UnitTest_Factory $factory Test factory.
	 */
	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		for ( $i = 1; $i <= 6; $i++ ) {
			$category_id      = $factory->category->create( array( 'name' => sprintf( 'Populated %d', $i ) ) );
			self::$post_ids[] = $factory->post->create(
				array(
					'post_status'   => 'publish',
					'post_category' => array( $category_id ),
				)
			);

			self::$populated_category_ids[] = $category_id;
		}

		self::$empty_category_ids[] = $factory->category->create( array( 'name' => 'Empty category' ) );
		self::$empty_category_ids[] = $factory->category->create( array( 'name' => 'Quiet empty category' ) );
	}

	/**
	 * Removes the posts and categories created for the class.
	 */
	public static function wpTearDownAfterClass() {
		foreach ( self::$post_ids as $post_id ) {
			wp_delete_post( $post_id, true );
		}
		foreach ( array_merge( self::$populated_category_ids, self::$empty_category_ids ) as $category_id ) {
			wp_delete_term( $category_id, 'category' );
		}
	}

	/**
	 * Markup written by hand or shipped in a pattern can leave out `termQuery`
	 * keys. The renderer must then fall back to what the editor shows for such
	 * markup (ordered by name, ascending, empty terms included) instead of
	 * reading undefined keys.
	 *
	 * @covers ::gutenberg_render_block_core_term_template
	 */
	public function test_partial_term_query_falls_back_to_the_editor_defaults() {
		$markup = '<!-- wp:terms-query {"termQuery":{"taxonomy":"category","perPage":5}} --><!-- wp:term-template --><!-- wp:term-name /--><!-- /wp:term-template --><!-- /wp:terms-query -->';
		$output = do_blocks( $markup );

		$this->assertSame( 5, substr_count( $output, '<li class="wp-block-term ' ), 'Only perPage terms are rendered.' );
		$this->assertStringContainsString( 'Empty category', $output, 'Empty terms are rendered when hideEmpty is not set.' );

		preg_match_all( '/Populated \d/', $output, $matches );
		$this->assertSame(
			array( 'Populated 1', 'Populated 2', 'Populated 3', 'Populated 4' ),
			$matches[0],
			'Terms are ordered by name, ascending, when order and orderBy are not set.'
		);
	}

	/**
	 * Values present in the markup keep taking precedence over the fallbacks.
	 *
	 * @covers ::gutenberg_render_block_core_term_template
	 */
	public function test_explicit_term_query_values_are_kept() {
		$markup = '<!-- wp:terms-query {"termQuery":{"taxonomy":"category","perPage":2,"hideEmpty":true,"orderBy":"name","order":"desc"}} --><!-- wp:term-template --><!-- wp:term-name /--><!-- /wp:term-template --><!-- /wp:terms-query -->';
		$output = do_blocks( $markup );

		$this->assertSame( 2, substr_count( $output, '<li class="wp-block-term ' ), 'Only perPage terms are rendered.' );
		$this->assertStringNotContainsString( 'Quiet empty category', $output, 'Empty terms are hidden when hideEmpty is true.' );
		$this->assertStringContainsString( 'Populated 6', $output, 'Terms are ordered by name, descending.' );
		$this->assertStringNotContainsString( 'Populated 1', $output, 'Terms past perPage are not rendered.' );
	}
}
