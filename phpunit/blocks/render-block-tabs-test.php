<?php
/**
 * Tabs block rendering tests.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests for the Tabs block.
 *
 * @group blocks
 */
class Tests_Blocks_Render_Tabs extends WP_UnitTestCase {

	/**
	 * @covers ::block_core_tabs_render_callback
	 * @covers ::block_core_tab_list_render_callback
	 */
	public function test_should_add_tab_list_aria_label_from_attribute(): void {
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

	/**
	 * @covers ::block_core_tabs_render_callback
	 * @covers ::block_core_tab_list_render_callback
	 */
	public function test_should_add_default_tab_list_aria_label(): void {
		$tabs_block = <<<'BLOCK_CONTENT'
			<!-- wp:tabs -->
			<div class="wp-block-tabs"><!-- wp:tab-list -->
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
		$this->assertSame( 'Tabbed content', $processor->get_attribute( 'aria-label' ) );
	}

	/**
	 * @covers ::block_core_tabs_provide_context
	 * @covers ::block_core_tab_list_render_callback
	 * @covers ::block_core_tab_panel_render
	 */
	public function test_should_number_tabs_and_tab_ids_from_one(): void {
		$tabs_block = <<<'BLOCK_CONTENT'
			<!-- wp:tabs -->
			<div class="wp-block-tabs"><!-- wp:tab-list -->
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

		// Another block on the page consumes the shared `wp_unique_id()` counter
		// before each tabs block is rendered.
		wp_unique_id( 'unrelated-' );
		$first_block = do_blocks( $tabs_block );
		wp_unique_id( 'unrelated-' );
		$second_block = do_blocks( $tabs_block );

		$processor = new WP_HTML_Tag_Processor( $first_block );
		$processor->next_tag( array( 'class_name' => 'wp-block-tabs' ) );

		$context = json_decode( (string) $processor->get_attribute( 'data-wp-context' ), true );
		$tabs_id = $context['tabsId'] ?? '';
		$this->assertStringStartsWith( 'tabs_', $tabs_id );

		$tabs_number = (int) substr( $tabs_id, strlen( 'tabs_' ) );

		$processor = new WP_HTML_Tag_Processor( $first_block . $second_block );

		foreach ( array( $tabs_number, $tabs_number + 1 ) as $number ) {
			foreach ( array( 1, 2 ) as $tab_number ) {
				$tab_id = "tabs_{$number}-tab-{$tab_number}";

				$processor->next_tag( array( 'tag_name' => 'button' ) );
				$this->assertSame( "tab__{$tab_id}", $processor->get_attribute( 'id' ) );
				$this->assertSame( $tab_id, $processor->get_attribute( 'aria-controls' ) );
			}

			foreach ( array( 1, 2 ) as $tab_number ) {
				$tab_id = "tabs_{$number}-tab-{$tab_number}";

				$processor->next_tag( array( 'class_name' => 'wp-block-tab-panel' ) );
				$this->assertSame( $tab_id, $processor->get_attribute( 'id' ) );
				$this->assertSame( "tab__{$tab_id}", $processor->get_attribute( 'aria-labelledby' ) );
			}
		}
	}

	/**
	 * An inactive panel is hidden with `until-found` rather than outright, so
	 * that the browser's find-in-page can still reach its content. Which panel
	 * is hidden is left to the client, so a visitor without JavaScript is given
	 * the content of every panel rather than none of it.
	 *
	 * @covers ::block_core_tab_panel_render
	 */
	public function test_should_leave_hiding_tab_panels_to_the_client(): void {
		$tabs_block = <<<'BLOCK_CONTENT'
			<!-- wp:tabs -->
			<div class="wp-block-tabs"><!-- wp:tab-list -->
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

		$processor = new WP_HTML_Tag_Processor( do_blocks( $tabs_block ) );
		$panels    = array();

		while ( $processor->next_tag( array( 'class_name' => 'wp-block-tab-panel' ) ) ) {
			$panels[] = array(
				'hidden'           => $processor->get_attribute( 'hidden' ),
				'hidden_binding'   => $processor->get_attribute( 'data-wp-bind--hidden' ),
				'tabindex_binding' => $processor->get_attribute( 'data-wp-bind--tabindex' ),
				'beforematch'      => $processor->get_attribute( 'data-wp-on--beforematch' ),
			);
		}

		$this->assertCount( 2, $panels, 'Both tab panels should be rendered.' );

		foreach ( $panels as $index => $panel ) {
			$this->assertNull(
				$panel['hidden'],
				"Panel $index should not be hidden before the block hydrates."
			);
			$this->assertSame(
				'state.isHidden',
				$panel['hidden_binding'],
				"Panel $index should be hidden by the client when its tab is inactive."
			);
			$this->assertSame(
				'state.tabIndexAttribute',
				$panel['tabindex_binding'],
				"Panel $index should leave the tab sequence while it is hidden."
			);
			$this->assertSame(
				'actions.handleBeforeMatch',
				$panel['beforematch'],
				"Panel $index should activate its tab when the browser reveals it."
			);
		}
	}
}
