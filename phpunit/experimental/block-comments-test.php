<?php
/**
 * Unit tests covering block comments functionality.
 *
 * @package gutenberg
 */

/**
 * Unit tests for the gutenberg_allow_empty_block_comments function.
 *
 * @covers gutenberg_allow_empty_block_comments
 */
class Gutenberg_Allow_Empty_Block_Comments_Test extends WP_UnitTestCase {

	/**
	 * Tests that the filter is properly added for the function.
	 */
	public function test_filter_is_added() {
		$this->assertTrue( has_filter( 'allow_empty_comment' ) );
		$this->assertEquals( 10, has_filter( 'allow_empty_comment', 'gutenberg_allow_empty_block_comments' ) );
	}

	/**
	 * Tests that empty comments are allowed for block_comment_reopened type.
	 */
	public function test_allows_empty_comment_for_block_comment_reopened() {
		$prepared_comment = array(
			'comment_type' => 'block_comment_reopened',
		);

		$result = gutenberg_allow_empty_block_comments( false, $prepared_comment );

		$this->assertTrue( $result );
	}

	/**
	 * Tests that empty comments are allowed for block_comment_resolved type.
	 */
	public function test_allows_empty_comment_for_block_comment_resolved() {
		$prepared_comment = array(
			'comment_type' => 'block_comment_resolved',
		);

		$result = gutenberg_allow_empty_block_comments( false, $prepared_comment );

		$this->assertTrue( $result );
	}

	/**
	 * Tests that empty comments are not allowed for other comment types.
	 */
	public function test_does_not_allow_empty_comment_for_other_types() {
		$comment_types = array(
			'',
			'comment',
			'block_comment',
			'trackback',
			'pingback',
			'some_custom_type',
		);

		foreach ( $comment_types as $comment_type ) {
			$prepared_comment = array(
				'comment_type' => $comment_type,
			);

			$result = gutenberg_allow_empty_block_comments( false, $prepared_comment );

			$this->assertFalse( $result, "Empty comments should not be allowed for comment type: {$comment_type}" );
		}
	}

	/**
	 * Tests that the function preserves the original allow value when true.
	 */
	public function test_preserves_original_true_value() {
		$prepared_comment = array(
			'comment_type' => 'block_comment_reopened',
		);

		$result = gutenberg_allow_empty_block_comments( true, $prepared_comment );

		$this->assertTrue( $result );
	}

	/**
	 * Tests that the function preserves the original allow value for non-matching types.
	 */
	public function test_preserves_original_true_value_for_other_types() {
		$prepared_comment = array(
			'comment_type' => 'regular_comment',
		);

		$result = gutenberg_allow_empty_block_comments( true, $prepared_comment );

		$this->assertTrue( $result );
	}

	/**
	 * Tests behavior with missing comment_type key.
	 */
	public function test_handles_missing_comment_type() {
		$prepared_comment = array();

		$result = gutenberg_allow_empty_block_comments( false, $prepared_comment );

		$this->assertFalse( $result );
	}
}