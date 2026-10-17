<?php
/**
 * Navigation Overlay Close block rendering tests.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests for the Navigation Overlay Close block.
 *
 * @group blocks
 */
class Render_Block_Navigation_Overlay_Close_Test extends WP_UnitTestCase {

	/**
	 * Render the block with the given attributes.
	 *
	 * @param array $attributes Block attributes.
	 * @return string Rendered markup.
	 */
	private function render( $attributes = array() ) {
		return gutenberg_render_block_core_navigation_overlay_close( $attributes );
	}

	/**
	 * With no visible text, the label is the button's only name, so it is the author's wording.
	 *
	 * @covers ::gutenberg_render_block_core_navigation_overlay_close
	 */
	public function test_icon_only_button_is_named_by_the_authored_text() {
		$markup = $this->render(
			array(
				'displayMode' => 'icon',
				'text'        => 'Dismiss menu',
			)
		);

		$this->assertStringContainsString( 'aria-label="Dismiss menu"', $markup );
		$this->assertStringNotContainsString( 'Dismiss menu</span>', $markup );
	}

	/**
	 * And falls back to the default wording when the author has written none.
	 *
	 * @covers ::gutenberg_render_block_core_navigation_overlay_close
	 */
	public function test_icon_only_button_falls_back_to_the_default_label() {
		$this->assertStringContainsString( 'aria-label="Close"', $this->render( array( 'displayMode' => 'icon' ) ) );
		$this->assertStringContainsString(
			'aria-label="Close"',
			$this->render(
				array(
					'displayMode' => 'icon',
					'text'        => '',
				)
			)
		);
	}

	/**
	 * Markup in the text is stripped, because an attribute is not a place tags can live.
	 *
	 * @covers ::gutenberg_render_block_core_navigation_overlay_close
	 */
	public function test_icon_only_label_is_plain_text() {
		$markup = $this->render(
			array(
				'displayMode' => 'icon',
				'text'        => 'Close <em>this</em> menu',
			)
		);

		$this->assertStringContainsString( 'aria-label="Close this menu"', $markup );
	}

	/**
	 * When the text is visible it is already the button's name, so a label would repeat it.
	 *
	 * @covers ::gutenberg_render_block_core_navigation_overlay_close
	 */
	public function test_visible_text_needs_no_label() {
		foreach ( array( 'text', 'both' ) as $display_mode ) {
			$markup = $this->render(
				array(
					'displayMode' => $display_mode,
					'text'        => 'Dismiss menu',
				)
			);

			$this->assertStringNotContainsString( 'aria-label', $markup, "in {$display_mode} mode" );
			$this->assertStringContainsString( '>Dismiss menu</span>', $markup, "in {$display_mode} mode" );
		}
	}
}
