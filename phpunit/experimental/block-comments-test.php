<?php
/**
 * Unit tests covering Block Comment functionality.
 *
 * @package gutenberg
 */

/**
 * Unit tests for the block comments.
 */
class Block_Comments_Test extends WP_UnitTestCase {

	/**
	 * Set up shared fixtures.
	 *
	 * @param WP_UnitTest_Factory $factory The WP test factory.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		$post_id = $factory->post->create(
			array(
				'post_title'   => 'Test Post',
				'post_content' => 'Test post content',
			)
		);

		// Create three regular comments.
		$factory->comment->create_many( 3, array( 'comment_post_ID' => $post_id ) );

		// Create two block comments.
		$factory->comment->create_many(
			2,
			array(
				'comment_post_ID' => $post_id,
				'comment_type'    => 'block_comment',
			)
		);
	}

	/**
	 * Test that block comments are excluded from the admin comments list.
	 *
	 * @dataProvider data_exclude_block_comments_queries
	 *
	 * @covers ::exclude_block_comments_from_admin
	 */
	public function test_exclude_block_comments_queries( $query_vars ) {
		$query = new WP_Comment_Query();
		$query->query( $query_vars );
		$query->assertCount( 3, $query->comments );
		$this->assertContains( 'block_comment', $query->query_vars['type__not_in'] );
		$this->assertNotContains( 'block_comment', (array) $query->query_vars['type'] );
		$this->assertNotContains( 'block_comment', (array) $query->query_vars['type__in'] );
	}

	/**
	 * Data provider for test_exclude_block_comments_queries.
	 *
	 * @return array[] Data provider.
	 */
	public function data_exclude_block_comments_queries() {
		return array(
			'default'                       => array(
				array(),
			),
			'explicitly_empty_type'         => array(
				array(
					'type' => '',
				),
			),
			'type_all'                      => array(
				array(
					'type' => 'all',
				),
			),
			'type_comment'                  => array(
				array(
					'type' => 'comment',
				),
			),
			'type_pingback'                 => array(
				array(
					'type' => 'pingback',
				),
			),
			'type_trackback'                => array(
				array(
					'type' => 'trackback',
				),
			),
			'type__in_comment_pingback'     => array(
				array(
					'type__in' => array( 'comment', 'pingback' ),
				),
			),
			'type__not_in_comment_pingback' => array(
				array(
					'type__not_in' => array( 'comment', 'pingback' ),
				),
			),
		);
	}

	/**
	 * Test that block comments are not excluded when explicitly queried.
	 *
	 * @dataProvider data_not_exclude_block_comments_queries
	 *
	 * @covers ::exclude_block_comments_from_admin
	 */
	public function test_not_exclude_block_comments_queries( $query_vars, $expected_count = 2 ) {
		$query = new WP_Comment_Query();
		$query->query( $query_vars );
		$query->assertCount( $expected_count, $query->comments );
		$this->assertNotContains( 'block_comment', (array) $query->query_vars['type__not_in'] );
		$this->assertContains( 'block_comment', array_merge( (array) $query->query_vars['type'], (array) $query->query_vars['type__in'] ) );
	}

	/**
	 * Data provider for test_not_exclude_block_comments_queries.
	 *
	 * @return array[] Data provider.
	 */
	public function data_not_exclude_block_comments_queries() {
		return array(
			'type_block_comment'             => array(
				array(
					'type' => 'block_comment',
				),
			),
			'type__in_block_comment'         => array(
				array(
					'type__in' => array( 'block_comment' ),
				),
			),
			'type__in_block_comment_comment' => array(
				array(
					'type__in' => array( 'block_comment', 'comment' ),
				),
				5,
			),
		);
	}

	/**
	 * Test that the exclude_block_comments_from_admin filter does not affect subsequent queries.
	 *
	 * @covers ::exclude_block_comments_from_admin
	 */
	public function test_exclude_block_comments_filter_does_not_affect_subsequent_queries() {
		$query = new WP_Comment_Query();
		$query->query( array() );
		$this->assertCount( 3, $query->comments );

		$query2 = new WP_Comment_Query();
		$query2->query( array( 'type' => 'block_comment' ) );
		$this->assertCount( 2, $query2->comments );
	}
}
