<?php
/**
 * Accordion block rendering tests.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests for the Accordion block.
 *
 * @group blocks
 */
class Tests_Blocks_Render_Accordion extends WP_UnitTestCase {

	/**
	 * Tests Accordion with two items, both closed by default.
	 *
	 * @covers ::block_core_accordion_item_render
	 */
	public function test_should_add_fetchpriority_low_to_img_in_collapsed_accordion_block(): void {
		$accordion_block = <<<'BLOCK_CONTENT'
			<!-- wp:accordion -->
			<div role="group" class="wp-block-accordion"><!-- wp:accordion-item -->
			<div class="wp-block-accordion-item"><!-- wp:accordion-heading -->
			<h3 class="wp-block-accordion-heading"><button type="button" class="wp-block-accordion-heading__toggle"><span class="wp-block-accordion-heading__toggle-title">First Image</span><span class="wp-block-accordion-heading__toggle-icon" aria-hidden="true">+</span></button></h3>
			<!-- /wp:accordion-heading -->

			<!-- wp:accordion-panel -->
			<div role="region" class="wp-block-accordion-panel"><!-- wp:image {"linkDestination":"none"} -->
			<figure class="wp-block-image size-large"><img src="https://example.com/image1.jpg" alt=""/></figure>
			<!-- /wp:image --></div>
			<!-- /wp:accordion-panel --></div>
			<!-- /wp:accordion-item -->

			<!-- wp:accordion-item -->
			<div class="wp-block-accordion-item is-open"><!-- wp:accordion-heading -->
			<h3 class="wp-block-accordion-heading"><button type="button" class="wp-block-accordion-heading__toggle"><span class="wp-block-accordion-heading__toggle-title">Second Image</span><span class="wp-block-accordion-heading__toggle-icon" aria-hidden="true">+</span></button></h3>
			<!-- /wp:accordion-heading -->

			<!-- wp:accordion-panel -->
			<div role="region" class="wp-block-accordion-panel"><!-- wp:image {"linkDestination":"none"} -->
			<figure class="wp-block-image size-large"><img src="https://example.com/image2.jpg" alt=""/></figure>
			<!-- /wp:image --></div>
			<!-- /wp:accordion-panel --></div>
			<!-- /wp:accordion-item --></div>
			<!-- /wp:accordion -->
		BLOCK_CONTENT;

		$rendered_block = do_blocks( $accordion_block );

		$processor = new WP_HTML_Tag_Processor( $rendered_block );
		$this->assertTrue( $processor->next_tag( array( 'className' => 'wp-block-accordion' ) ) );
		$this->assertTrue( $processor->next_tag( 'IMG' ) );
		$this->assertSame( 'low', $processor->get_attribute( 'fetchpriority' ), 'Expected fetchpriority=low to be set on IMG in default collapsed Accordion Item.' );

		$this->assertTrue( $processor->next_tag( array( 'className' => 'wp-block-accordion' ) ) );
		$this->assertTrue( $processor->next_tag( 'IMG' ) );
		$this->assertSame( 'low', $processor->get_attribute( 'fetchpriority' ), 'Expected fetchpriority=low to be set on IMG in default collapsed Accordion Item.' );

		$this->assertFalse( $processor->next_tag( array( 'className' => 'wp-block-accordion' ) ) );
	}

	/**
	 * Tests Accordion with two items, the first closed and the second open by default.
	 *
	 * @covers ::block_core_accordion_item_render
	 */
	public function test_should_add_fetchpriority_low_to_img_in_collapsed_accordion_block_but_not_open_block(): void {
		$accordion_block = <<<'BLOCK_CONTENT'
			<!-- wp:accordion -->
			<div role="group" class="wp-block-accordion"><!-- wp:accordion-item -->
			<div class="wp-block-accordion-item"><!-- wp:accordion-heading -->
			<h3 class="wp-block-accordion-heading"><button type="button" class="wp-block-accordion-heading__toggle"><span class="wp-block-accordion-heading__toggle-title">First Image</span><span class="wp-block-accordion-heading__toggle-icon" aria-hidden="true">+</span></button></h3>
			<!-- /wp:accordion-heading -->

			<!-- wp:accordion-panel -->
			<div role="region" class="wp-block-accordion-panel"><!-- wp:image {"linkDestination":"none"} -->
			<figure class="wp-block-image size-large"><img src="https://example.com/image1.jpg" alt=""/></figure>
			<!-- /wp:image --></div>
			<!-- /wp:accordion-panel --></div>
			<!-- /wp:accordion-item -->

			<!-- wp:accordion-item {"openByDefault":true} -->
			<div class="wp-block-accordion-item is-open"><!-- wp:accordion-heading -->
			<h3 class="wp-block-accordion-heading"><button type="button" class="wp-block-accordion-heading__toggle"><span class="wp-block-accordion-heading__toggle-title">Second Image</span><span class="wp-block-accordion-heading__toggle-icon" aria-hidden="true">+</span></button></h3>
			<!-- /wp:accordion-heading -->

			<!-- wp:accordion-panel -->
			<div role="region" class="wp-block-accordion-panel"><!-- wp:image {"linkDestination":"none"} -->
			<figure class="wp-block-image size-large"><img src="https://example.com/image2.jpg" alt=""/></figure>
			<!-- /wp:image --></div>
			<!-- /wp:accordion-panel --></div>
			<!-- /wp:accordion-item --></div>
			<!-- /wp:accordion -->
		BLOCK_CONTENT;

		$rendered_block = do_blocks( $accordion_block );

		$processor = new WP_HTML_Tag_Processor( $rendered_block );
		$this->assertTrue( $processor->next_tag( array( 'className' => 'wp-block-accordion' ) ) );
		$this->assertTrue( $processor->next_tag( 'IMG' ) );
		$this->assertSame( 'low', $processor->get_attribute( 'fetchpriority' ), 'Expected fetchpriority=low to be set on IMG in default collapsed Accordion Item.' );

		$this->assertTrue( $processor->next_tag( array( 'className' => 'wp-block-accordion' ) ) );
		$this->assertTrue( $processor->next_tag( 'IMG' ) );
		$this->assertNotSame( 'low', $processor->get_attribute( 'fetchpriority' ), 'Expected fetchpriority=low to not be set on IMG in default expanded Accordion Item.' );

		$this->assertFalse( $processor->next_tag( array( 'className' => 'wp-block-accordion' ) ) );
	}
}
