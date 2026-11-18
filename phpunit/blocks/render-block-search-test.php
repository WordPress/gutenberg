<?php
/**
 * Tests for the core Search block renderer.
 *
 * @package gutenberg
 * @subpackage block-library
 */

/**
 * @covers ::gutenberg_render_block_core_search
 */
class Render_Block_Search_Test extends WP_UnitTestCase {
	/**
	 * @var array|null
	 */
	private $original_block_to_render;

	public function set_up() {
		parent::set_up();

		$this->original_block_to_render     = WP_Block_Supports::$block_to_render;
		WP_Block_Supports::$block_to_render = array(
			'blockName' => 'core/search',
			'attrs'     => array(),
		);
	}

	public function tear_down() {
		WP_Block_Supports::$block_to_render = $this->original_block_to_render;

		parent::tear_down();
	}

	public function test_shadow_follows_border_on_the_input_and_button() {
		$output = gutenberg_render_block_core_search(
			array(
				'label'          => 'Search',
				'buttonText'     => 'Search',
				'buttonPosition' => 'button-outside',
				'placeholder'    => '',
				'style'          => array(
					'border' => array( 'width' => '2px' ),
					'shadow' => 'var:preset|shadow|natural',
				),
			)
		);

		$processor = new WP_HTML_Tag_Processor( $output );
		$this->assertTrue( $processor->next_tag( 'input' ) );
		$this->assertSame( 'border-width: 2px;box-shadow:var(--wp--preset--shadow--natural)', $processor->get_attribute( 'style' ) );
		$this->assertTrue( $processor->next_tag( 'button' ) );
		$this->assertSame( 'border-width: 2px;box-shadow:var(--wp--preset--shadow--natural)', $processor->get_attribute( 'style' ) );
	}
}
