<?php
/**
 * Query Pagination offset rendering tests.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests Query Pagination against real queries with skipped posts.
 *
 * @group blocks
 * @covers ::gutenberg_render_block_core_query_pagination_next
 * @covers ::gutenberg_render_block_core_query_pagination_previous
 * @covers ::gutenberg_render_block_core_query_pagination_numbers
 */
class Tests_Blocks_Query_Pagination_Offset extends WP_UnitTestCase {

	/**
	 * Category isolating the posts used by the custom queries.
	 *
	 * @var int
	 */
	private static $category_id;

	public static function wpSetUpBeforeClass( $factory ) {
		self::$category_id = $factory->category->create();
		$factory->post->create_many(
			13,
			array(
				'post_status'   => 'publish',
				'post_category' => array( self::$category_id ),
			)
		);
	}

	/**
	 * Renders the pagination children of a custom Query block.
	 *
	 * @param array $query Query block settings.
	 * @param int   $page  Current pagination page.
	 * @return string Rendered block markup.
	 */
	private function render_pagination( $query, $page = 1 ) {
		$this->go_to( home_url( '/?query-47252-page=' . $page ) );
		$attributes = array(
			'queryId' => 47252,
			'query'   => array_merge(
				array(
					'postType'    => 'post',
					'perPage'     => 9,
					'offset'      => 4,
					'inherit'     => false,
					'categoryIds' => array( self::$category_id ),
				),
				$query
			),
		);
		if ( null === $attributes['query']['offset'] ) {
			unset( $attributes['query']['offset'] );
		}

		return do_blocks(
			'<!-- wp:query ' . wp_json_encode( $attributes ) . ' -->' .
			'<div class="wp-block-query">' .
			'<!-- wp:query-pagination --><div class="wp-block-query-pagination">' .
			'<!-- wp:query-pagination-previous /-->' .
			'<!-- wp:query-pagination-numbers /-->' .
			'<!-- wp:query-pagination-next /-->' .
			'</div><!-- /wp:query-pagination -->' .
			'</div><!-- /wp:query -->'
		);
	}

	/**
	 * Checks the pagination links and visible page numbers.
	 *
	 * @param string $output   Rendered markup.
	 * @param bool   $previous Whether a Previous link should exist.
	 * @param bool   $next     Whether a Next link should exist.
	 * @param int[]  $numbers  Expected visible page numbers.
	 */
	private function assert_pagination( $output, $previous, $next, $numbers ) {
		$processor = new WP_HTML_Tag_Processor( $output );
		$this->assertSame( $previous, $processor->next_tag( array( 'class_name' => 'wp-block-query-pagination-previous' ) ) );
		$processor = new WP_HTML_Tag_Processor( $output );
		$this->assertSame( $next, $processor->next_tag( array( 'class_name' => 'wp-block-query-pagination-next' ) ) );
		preg_match_all( '/<(?:a|span)\b[^>]*class="page-numbers(?: current)?"[^>]*>(\d+)<\/(?:a|span)>/', $output, $matches );
		$this->assertSame( $numbers, array_map( 'intval', $matches[1] ) );
	}

	/**
	 * @dataProvider data_query_pagination_with_offsets
	 *
	 * @param array $query    Query settings.
	 * @param int   $page     Current page.
	 * @param bool  $previous Expected Previous link.
	 * @param bool  $next     Expected Next link.
	 * @param int[] $numbers  Expected page numbers.
	 */
	public function test_query_pagination_with_offsets( $query, $page, $previous, $next, $numbers ) {
		$this->assert_pagination( $this->render_pagination( $query, $page ), $previous, $next, $numbers );
	}

	/**
	 * @return array[]
	 */
	public static function data_query_pagination_with_offsets() {
		return array(
			'exactly one remaining page' => array( array(), 1, false, false, array() ),
			'empty second page'          => array( array(), 2, false, false, array() ),
			'zero offset first page'     => array( array( 'offset' => 0 ), 1, false, true, array( 1, 2 ) ),
			'zero offset second page'    => array( array( 'offset' => 0 ), 2, true, false, array( 1, 2 ) ),
			'no offset first page'       => array( array( 'offset' => null ), 1, false, true, array( 1, 2 ) ),
			'partial remaining page'     => array( array( 'perPage' => 5 ), 1, false, true, array( 1, 2 ) ),
			'partial final page'         => array( array( 'perPage' => 5 ), 2, true, false, array( 1, 2 ) ),
			'three remaining pages'      => array( array( 'perPage' => 3 ), 1, false, true, array( 1, 2, 3 ) ),
			'last of three pages'        => array( array( 'perPage' => 3 ), 3, true, false, array( 1, 2, 3 ) ),
			'offset equals post count'   => array( array( 'offset' => 13 ), 1, false, false, array() ),
			'offset exceeds post count'  => array( array( 'offset' => 14 ), 1, false, false, array() ),
			'configured one page cap'    => array(
				array(
					'perPage' => 3,
					'pages'   => 1,
				),
				1,
				false,
				false,
				array(),
			),
			'configured two page cap'    => array(
				array(
					'perPage' => 3,
					'pages'   => 2,
				),
				1,
				false,
				true,
				array( 1, 2 ),
			),
			'last configured page'       => array(
				array(
					'perPage' => 3,
					'pages'   => 2,
				),
				2,
				true,
				false,
				array( 1, 2 ),
			),
		);
	}

	public function test_filtered_query_arguments_use_the_effective_page_size_and_offset() {
		$calls    = array();
		$callback = static function ( $args, $block, $page ) use ( &$calls ) {
			$calls[]                = array( $args['offset'], $args['posts_per_page'], $block->name, $page );
			$args['posts_per_page'] = 3;
			$args['offset']         = 4 + 3 * ( $page - 1 );
			return $args;
		};
		add_filter( 'query_loop_block_query_vars', $callback, 10, 3 );
		try {
			$output = $this->render_pagination( array(), 2 );
		} finally {
			remove_filter( 'query_loop_block_query_vars', $callback, 10 );
		}

		$this->assert_pagination( $output, true, true, array( 1, 2, 3 ) );
		$this->assertSame(
			array(
				array( 13, 9, 'core/query-pagination-previous', 2 ),
				array( 13, 9, 'core/query-pagination-numbers', 2 ),
				array( 13, 9, 'core/query-pagination-next', 2 ),
			),
			$calls
		);
	}

	public function test_filter_can_remove_the_initial_query_offset() {
		$callback = static function ( $args, $block, $page ) {
			$args['offset'] = 9 * ( $page - 1 );
			return $args;
		};
		add_filter( 'query_loop_block_query_vars', $callback, 10, 3 );
		try {
			$output = $this->render_pagination( array() );
		} finally {
			remove_filter( 'query_loop_block_query_vars', $callback, 10 );
		}

		$this->assert_pagination( $output, false, true, array( 1, 2 ) );
	}

	/**
	 * @dataProvider data_queries_without_pagination
	 *
	 * @param array $overrides Filtered query arguments.
	 */
	public function test_queries_without_pagination_keep_no_links( $overrides ) {
		$callback = static function ( $args ) use ( $overrides ) {
			return array_merge( $args, $overrides );
		};
		add_filter( 'query_loop_block_query_vars', $callback );
		try {
			$output = $this->render_pagination( array() );
		} finally {
			remove_filter( 'query_loop_block_query_vars', $callback );
		}

		$this->assert_pagination( $output, false, false, array() );
	}

	/**
	 * @return array[]
	 */
	public static function data_queries_without_pagination() {
		return array(
			'no found rows' => array( array( 'no_found_rows' => true ) ),
			'no paging'     => array( array( 'nopaging' => true ) ),
			'all posts'     => array( array( 'posts_per_page' => -1 ) ),
		);
	}

	public function test_inherited_query_ignores_the_block_offset() {
		$this->assert_pagination(
			$this->render_pagination(
				array(
					'inherit' => true,
					'offset'  => 13,
				)
			),
			false,
			true,
			array( 1, 2 )
		);
	}
}
