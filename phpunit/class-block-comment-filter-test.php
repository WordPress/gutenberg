<?php

/**
 * This class contains unit tests for the block comment filter functions.
 *
 * @package Gutenberg
 */
class Tests_blockCommentFilter extends WP_UnitTestCase {

	/**
	 * Tests that `update_comment_type_in_rest_api_6_7` updates comment type correctly.
	 */
	public function test_update_comment_type_in_rest_api_6_7() {
		// Mock request and prepared comment
		$request = new WP_REST_Request( WP_REST_Server::READABLE );
		$request->set_param( 'comment_type', 'block_comment' );
		$request->set_param( 'comment_approved', '1' );

		$prepared_comment = array(
			'comment_type'     => '',
			'comment_approved' => '0',
		);

		// Call the function
		$updated_comment = update_comment_type_in_rest_api_6_7( $prepared_comment, $request );

		// Assertions
		$this->assertEquals( 'block_comment', $updated_comment['comment_type'] );
		$this->assertEquals( '1', $updated_comment['comment_approved'] );
	}

	/**
	 * Tests that `update_comment_type_filter_dropdown` returns the correct options.
	 */
	public function test_update_get_avatar_comment_type() {

		// Mock comment types
		$comment_types = array( 'comment', 'pingback' );

		// Call the function
		$updated_comment_types = update_get_avatar_comment_type( $comment_types );

		// Assertions
		$this->assertContains( 'block_comment', $updated_comment_types );
    }

	/**
	 * Tests that `update_comment_type_filter_dropdown` returns the correct options.
	*/
	public function test_update_comment_type_filter_dropdown() {

		// Call the function
		$dropdown_options = update_comment_type_filter_dropdown();

		// Assertions
		$this->assertArrayHasKey( 'comment', $dropdown_options );
		$this->assertArrayHasKey( 'block_comment', $dropdown_options );
		$this->assertEquals( 'Comments', $dropdown_options['comment'] );
		$this->assertEquals( 'Block Comments', $dropdown_options['block_comment'] );
	}
}
