<?php
/**
 * Tests for the Query Loop block pagination and sticky posts.
 *
 * @package gutenberg
 *
 * @group blocks
 */

/**
 * @covers ::gutenberg_set_query_block_paged
 */
class Gutenberg_Query_Block_Paged_Test extends WP_UnitTestCase {

	private static $sticky_post;
	private static $posts = array();

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		/*
		 * Create enough posts to span three pages of three items. The sticky
		 * post is the oldest, so it sits outside the first page's window and
		 * also outside the second page's window.
		 */
		for ( $i = 1; $i <= 9; $i++ ) {
			self::$posts[ $i ] = $factory->post->create(
				array(
					'post_type'   => 'post',
					'post_status' => 'publish',
					'post_title'  => "Paged post {$i}",
					'post_date'   => sprintf( '2024-01-%02d 10:00:00', $i ),
				)
			);
		}

		self::$sticky_post = self::$posts[1];
		stick_post( self::$sticky_post );
	}

	public static function wpTearDownAfterClass() {
		unstick_post( self::$sticky_post );

		foreach ( self::$posts as $post_id ) {
			wp_delete_post( $post_id, true );
		}
	}

	/**
	 * Builds a `core/post-template` block with the given query context.
	 *
	 * @param array $query Query context.
	 * @return WP_Block Block instance.
	 */
	private function get_post_template_block( array $query ) {
		return new WP_Block(
			array(
				'blockName'    => 'core/post-template',
				'attrs'        => array(),
				'innerBlocks'  => array(),
				'innerHTML'    => '',
				'innerContent' => array(),
			),
			array( 'query' => $query )
		);
	}

	/**
	 * Returns the IDs of the posts a Query Loop page renders.
	 *
	 * @param int $page Page number.
	 * @return int[] Post IDs.
	 */
	private function get_page_post_ids( $page ) {
		$block = $this->get_post_template_block(
			array(
				'perPage'  => 3,
				'postType' => 'post',
				'order'    => 'desc',
				'orderBy'  => 'date',
				'sticky'   => '',
				'offset'   => 0,
				'inherit'  => false,
			)
		);
		$query = new WP_Query( build_query_vars_from_query_block( $block, $page ) );

		return wp_list_pluck( $query->posts, 'ID' );
	}

	/**
	 * The sticky post should be moved to the top of the first page only.
	 */
	public function test_sticky_post_is_prepended_on_the_first_page() {
		$post_ids = $this->get_page_post_ids( 1 );

		$this->assertSame( self::$sticky_post, $post_ids[0], 'The sticky post should be first on page 1.' );
	}

	/**
	 * Sticky posts should not be repeated on subsequent pages.
	 */
	public function test_sticky_post_is_not_repeated_on_later_pages() {
		$post_ids = $this->get_page_post_ids( 2 );

		$this->assertNotContains( self::$sticky_post, $post_ids, 'The sticky post should not appear on page 2.' );
	}

	/**
	 * The `paged` query var is only needed for paginated queries.
	 */
	public function test_paged_is_set_when_items_per_page_is_configured() {
		$query = gutenberg_set_query_block_paged( array(), $this->get_post_template_block( array( 'perPage' => 3 ) ), 2 );

		$this->assertSame( 2, $query['paged'] );
	}

	/**
	 * Queries without an "Items per page" value are not paginated by `paged`,
	 * so the filter must leave them untouched.
	 */
	public function test_paged_is_not_set_without_items_per_page() {
		$query = gutenberg_set_query_block_paged( array(), $this->get_post_template_block( array( 'perPage' => null ) ), 2 );

		$this->assertArrayNotHasKey( 'paged', $query );
	}
}
