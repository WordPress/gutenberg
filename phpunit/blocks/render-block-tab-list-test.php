<?php
/**
 * Tab List block rendering tests.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests for the Tab List block.
 *
 * @group blocks
 */
class Tests_Blocks_Render_Tab_List extends WP_UnitTestCase {

	/**
	 * @covers ::block_core_tab_list_render_callback
	 */
	public function test_should_add_aria_label_from_attribute(): void {
		$tabs_block = <<<'BLOCK_CONTENT'
			<!-- wp:tabs -->
			<div class="wp-block-tabs"><!-- wp:tab-list {"ariaLabel":"Product details"} -->
			<div role="tablist" class="wp-block-tab-list"><button type="button" role="tab">Description</button><button type="button" role="tab">Reviews</button></div>
			<!-- /wp:tab-list -->

			<!-- wp:tab-panels -->
			<div class="wp-block-tab-panels"><!-- wp:tab-panel {"label":"Description"} -->
			<section role="tabpanel" tabindex="0" class="wp-block-tab-panel"></section>
			<!-- /wp:tab-panel -->

			<!-- wp:tab-panel {"label":"Reviews"} -->
			<section role="tabpanel" tabindex="0" class="wp-block-tab-panel"></section>
			<!-- /wp:tab-panel --></div>
			<!-- /wp:tab-panels --></div>
			<!-- /wp:tabs -->
		BLOCK_CONTENT;

		$rendered_block = do_blocks( $tabs_block );

		$processor = new WP_HTML_Tag_Processor( $rendered_block );
		$this->assertTrue( $processor->next_tag( array( 'class_name' => 'wp-block-tab-list' ) ) );
		$this->assertSame( 'Product details', $processor->get_attribute( 'aria-label' ) );
	}
}
