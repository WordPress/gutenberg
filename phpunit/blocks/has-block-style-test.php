<?php
/**
 * Tests for `has_block_style`.
 *
 * @package gutenberg
 */

/**
 * Tests for checking whether block styles exist in content.
 *
 * @group blocks
 */
class Tests_Blocks_Has_Block_Style extends WP_UnitTestCase {
	/**
	 * Tests that a matching block style is found in a serialized core block.
	 */
	public function test_finds_matching_core_block_style_in_string_content() {
		$content = '<!-- wp:image {"id":1,"className":"is-style-rounded"} /-->';

		$this->assertTrue( has_block_style( 'core/image', 'rounded', $content ) );
		$this->assertTrue( has_block_style( 'image', 'rounded', $content ) );
	}

	/**
	 * Tests that a matching block style is found for nested blocks with additional classes.
	 */
	public function test_finds_matching_nested_block_style_with_multiple_classes() {
		$content = '<!-- wp:group --><div class="wp-block-group"><!-- wp:quote {"className":"has-text-color is-style-plain custom-class"} --><blockquote class="wp-block-quote has-text-color is-style-plain custom-class"><p>Quote</p></blockquote><!-- /wp:quote --></div><!-- /wp:group -->';

		$this->assertTrue( has_block_style( 'quote', 'plain', $content ) );
	}

	/**
	 * Tests that the block style match is scoped to the requested block type.
	 */
	public function test_does_not_match_style_on_different_block_type() {
		$content = '<!-- wp:image {"id":1,"className":"is-style-rounded"} /--><!-- wp:quote {"className":"is-style-plain"} --><blockquote class="wp-block-quote is-style-plain"><p>Quote</p></blockquote><!-- /wp:quote -->';

		$this->assertFalse( has_block_style( 'quote', 'rounded', $content ) );
	}

	/**
	 * Tests that false is returned when the requested style is not present.
	 */
	public function test_returns_false_when_requested_style_is_missing() {
		$content = '<!-- wp:quote {"className":"is-style-plain"} --><blockquote class="wp-block-quote is-style-plain"><p>Quote</p></blockquote><!-- /wp:quote -->';

		$this->assertFalse( has_block_style( 'quote', 'large', $content ) );
	}

	/**
	 * Tests that a post object or ID can be provided like `has_block`.
	 */
	public function test_accepts_post_identifier_inputs() {
		$post_id = self::factory()->post->create(
			array(
				'post_content' => '<!-- wp:quote {"className":"is-style-large"} --><blockquote class="wp-block-quote is-style-large"><p>Quote</p></blockquote><!-- /wp:quote -->',
			)
		);

		$this->assertTrue( has_block_style( 'quote', 'large', $post_id ) );
		$this->assertTrue( has_block_style( 'quote', 'large', get_post( $post_id ) ) );
	}

	/**
	 * Tests invalid arguments and content without blocks return false.
	 */
	public function test_returns_false_for_invalid_input() {
		$this->assertFalse( has_block_style( '', 'large', '<!-- wp:quote {"className":"is-style-large"} /-->' ) );
		$this->assertFalse( has_block_style( 'quote', '', '<!-- wp:quote {"className":"is-style-large"} /-->' ) );
		$this->assertFalse( has_block_style( 'quote', 'large', 'Plain text only' ) );
		$this->assertFalse( has_block_style( 'quote', 'large', 99999999 ) );
	}
}
