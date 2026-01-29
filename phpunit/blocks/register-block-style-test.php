<?php
/**
 * Tests for `gutenberg_register_block_style`.
 *
 * @package gutenberg
 */

/**
 * Tests for Gutenberg's extended block style registration function.
 *
 * @group blocks
 */
class Tests_Blocks_Register_Block_Style extends WP_UnitTestCase {
	/**
	 * Tests `gutenberg_register_block_style` registers block style
	 * across multiple block types.
	 */
	public function test_gutenberg_register_block_style() {
		$block_types      = array( 'core/group', 'core/columns', 'core/cover' );
		$style_properties = array(
			'name'  => 'fancy',
			'label' => 'Fancy',
		);

		gutenberg_register_block_style( $block_types, $style_properties );
		$registry = WP_Block_Styles_Registry::get_instance();

		$this->assertTrue( $registry->is_registered( 'core/group', 'fancy' ) );
		$this->assertTrue( $registry->is_registered( 'core/columns', 'fancy' ) );
		$this->assertTrue( $registry->is_registered( 'core/cover', 'fancy' ) );
	}
}
