<?php
/**
 * Search block rendering tests.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests for the Search block.
 *
 * @group blocks
 */
class Render_Block_Search_Test extends WP_UnitTestCase {

	/**
	 * Returns the inline style applied to the block's inside wrapper.
	 *
	 * @param array $attributes The block attributes.
	 * @return string The wrapper's style attribute markup.
	 */
	private function get_wrapper_style( $attributes ) {
		$styles = gutenberg_styles_for_block_core_search( $attributes );
		return $styles['wrapper'];
	}

	/**
	 * @covers ::gutenberg_styles_for_block_core_search
	 */
	public function test_no_width_renders_no_width_style() {
		$this->assertStringNotContainsString( 'width: ', $this->get_wrapper_style( array() ) );
	}

	/**
	 * @covers ::gutenberg_styles_for_block_core_search
	 */
	public function test_block_support_width_is_applied() {
		$attributes = array(
			'style' => array(
				'dimensions' => array(
					'width' => '350px',
				),
			),
		);

		$this->assertStringContainsString( 'width: 350px', $this->get_wrapper_style( $attributes ) );
	}

	/**
	 * @covers ::gutenberg_styles_for_block_core_search
	 */
	public function test_block_support_width_preset_becomes_a_css_variable() {
		$attributes = array(
			'style' => array(
				'dimensions' => array(
					'width' => 'var:preset|dimension|50',
				),
			),
		);

		$this->assertStringContainsString(
			'width: var(--wp--preset--dimension--50)',
			$this->get_wrapper_style( $attributes )
		);
	}

	/**
	 * Content saved before the block support was adopted keeps rendering until
	 * the post is re-opened and re-saved in the editor.
	 *
	 * @covers ::gutenberg_styles_for_block_core_search
	 */
	public function test_legacy_width_attributes_are_still_honored() {
		$percentage = array(
			'width'     => 50,
			'widthUnit' => '%',
		);
		$pixels     = array(
			'width'     => 350,
			'widthUnit' => 'px',
		);

		$this->assertStringContainsString( 'width: 50%', $this->get_wrapper_style( $percentage ) );
		$this->assertStringContainsString( 'width: 350px', $this->get_wrapper_style( $pixels ) );
	}

	/**
	 * @covers ::gutenberg_styles_for_block_core_search
	 */
	public function test_legacy_width_attribute_without_a_unit_is_ignored() {
		$attributes = array( 'width' => 50 );

		$this->assertStringNotContainsString( 'width: ', $this->get_wrapper_style( $attributes ) );
	}

	/**
	 * The Width control's leftmost step is labelled "None" and writes the
	 * string '0', which means no width rather than a zero-width field.
	 *
	 * @covers ::gutenberg_styles_for_block_core_search
	 */
	public function test_block_support_width_of_zero_renders_no_width_style() {
		$attributes = array(
			'style' => array(
				'dimensions' => array(
					'width' => '0',
				),
			),
		);

		$this->assertStringNotContainsString( 'width: ', $this->get_wrapper_style( $attributes ) );
	}

	/**
	 * Clearing the width with "None" must not fall back to the legacy
	 * attributes a block carries until it is re-saved.
	 *
	 * @covers ::gutenberg_styles_for_block_core_search
	 */
	public function test_block_support_width_of_zero_does_not_fall_back_to_legacy_attributes() {
		$attributes = array(
			'width'     => 50,
			'widthUnit' => '%',
			'style'     => array(
				'dimensions' => array(
					'width' => '0',
				),
			),
		);

		$this->assertStringNotContainsString( 'width: ', $this->get_wrapper_style( $attributes ) );
	}

	/**
	 * @covers ::gutenberg_styles_for_block_core_search
	 */
	public function test_block_support_width_wins_over_legacy_attributes() {
		$attributes = array(
			'width'     => 50,
			'widthUnit' => '%',
			'style'     => array(
				'dimensions' => array(
					'width' => '350px',
				),
			),
		);

		$style = $this->get_wrapper_style( $attributes );

		$this->assertStringContainsString( 'width: 350px', $style );
		$this->assertStringNotContainsString( 'width: 50%', $style );
	}

	/**
	 * `dimensions` opts out of serializing `width`, so the block wrapper must
	 * not pick it up alongside the inside wrapper that the block styles itself.
	 *
	 * @covers ::gutenberg_render_block_core_search
	 */
	public function test_width_is_applied_to_the_inside_wrapper_only() {
		$html = do_blocks( '<!-- wp:search {"style":{"dimensions":{"width":"350px"}}} /-->' );

		$this->assertMatchesRegularExpression(
			'/<div class="wp-block-search__inside-wrapper"[^>]*style="[^"]*width: 350px/',
			$html
		);
		$this->assertDoesNotMatchRegularExpression(
			'/<(?:form|search)[^>]*style="[^"]*width/',
			$html
		);
	}
}
