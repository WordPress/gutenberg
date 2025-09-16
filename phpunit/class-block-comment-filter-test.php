<?php
/**
 * Unit tests for block comment filter functions.
 *
 * @package Gutenberg
 * @since 6.9.0
 */

/**
 * This class contains unit tests for the block comment filter functions.
 *
 * @package Gutenberg
 */
class Tests_BlockCommentFilter extends WP_UnitTestCase {

	/**
	 * Tests that `update_comment_type_in_rest_api_6_9` updates comment type correctly.
	 */
	public function test_update_comment_type_in_rest_api_6_9() {
		// Mock request and prepared comment.
		$request = new WP_REST_Request( WP_REST_Server::READABLE );
		$request->set_param( 'comment_type', 'block_comment' );
		$request->set_param( 'comment_approved', '1' );

		$prepared_comment = array(
			'comment_type'     => '',
			'comment_approved' => '0',
		);

		// Call the function.
		$updated_comment = update_comment_type_in_rest_api_6_9( $prepared_comment, $request );

		// Assertions.
		$this->assertEquals( 'block_comment', $updated_comment['comment_type'] );
		$this->assertEquals( '1', $updated_comment['comment_approved'] );
	}

	/**
	 * Tests that `update_comment_type_filter_dropdown` returns the correct options.
	 */
	public function test_update_get_avatar_comment_type() {

		// Mock comment types.
		$comment_types = array( 'comment', 'pingback' );

		// Call the function.
		$updated_comment_types = update_get_avatar_comment_type( $comment_types );

		// Assertions.
		$this->assertContains( 'block_comment', $updated_comment_types );
	}
}
