<?php
/**
 * Details block rendering tests.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests for the Details block.
 *
 * @group blocks
 */
class Tests_Blocks_Render_Details extends WP_UnitTestCase {

	/**
	 * @covers ::block_core_details_set_img_fetchpriority_low
	 */
	public function test_should_add_fetchpriority_low_to_img_in_collapsed_details_block(): void {
		$details_block = <<<'BLOCK_CONTENT'
			<!-- wp:details -->
			<details class="wp-block-details"><summary>Collapsed</summary><!-- wp:image {"linkDestination":"none"} -->
			<figure class="wp-block-image size-large"><img src="https://example.com/image.jpg" alt="" /></figure>
			<!-- /wp:image --></details>
			<!-- /wp:details -->
		BLOCK_CONTENT;

		$rendered_block = do_blocks( $details_block );

		$processor = new WP_HTML_Tag_Processor( $rendered_block );
		$this->assertTrue( $processor->next_tag( 'IMG' ) );
		$this->assertSame( 'low', $processor->get_attribute( 'fetchpriority' ) );
	}

	/**
	 * @covers ::block_core_details_set_img_fetchpriority_low
	 */
	public function test_should_not_add_fetchpriority_low_to_img_in_expanded_details_block(): void {
		$details_block = <<<'BLOCK_CONTENT'
			<!-- wp:details {"showContent":true} -->
			<details class="wp-block-details" open><summary>Expanded</summary><!-- wp:image {"linkDestination":"none"} -->
			<figure class="wp-block-image size-large"><img src="https://example.com/image.jpg" alt="" /></figure>
			<!-- /wp:image --></details>
			<!-- /wp:details -->
		BLOCK_CONTENT;

		$rendered_block = do_blocks( $details_block );

		$processor = new WP_HTML_Tag_Processor( $rendered_block );
		$this->assertTrue( $processor->next_tag( 'IMG' ) );
		$this->assertNotSame( 'low', $processor->get_attribute( 'fetchpriority' ) );
	}

	/**
	 * @covers ::block_core_details_set_img_fetchpriority_low
	 */
	public function test_should_preserve_fetchpriority_high_on_img_in_expanded_details_block(): void {
		$details_block = <<<'BLOCK_CONTENT'
			<!-- wp:details {"showContent":true} -->
			<details class="wp-block-details" open><summary>Expanded</summary><!-- wp:image {"linkDestination":"none"} -->
			<figure class="wp-block-image size-large"><img src="https://example.com/image.jpg" fetchpriority="high" alt="" /></figure>
			<!-- /wp:image --></details>
			<!-- /wp:details -->
		BLOCK_CONTENT;

		$rendered_block = do_blocks( $details_block );

		$processor = new WP_HTML_Tag_Processor( $rendered_block );
		$this->assertTrue( $processor->next_tag( 'IMG' ) );
		$this->assertSame( 'high', $processor->get_attribute( 'fetchpriority' ) );
	}
}
