<?php
/**
 * Tests for the deprecated block_core_navigation_submenu_render_submenu_icon() shim.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * @group blocks
 */
class Block_Core_Navigation_Submenu_Render_Submenu_Icon_Test extends WP_UnitTestCase {

	/**
	 * @ticket 65287
	 */
	public function test_returns_same_markup_as_shared_helper() {
		if ( ! function_exists( 'block_core_shared_navigation_render_submenu_icon' ) ) {
			$this->markTestSkipped( 'The shared navigation submenu icon helper is not available in this WordPress version.' );
		}

		$this->setExpectedDeprecated( 'gutenberg_block_core_navigation_submenu_render_submenu_icon' );

		$this->assertSame(
			block_core_shared_navigation_render_submenu_icon(),
			gutenberg_block_core_navigation_submenu_render_submenu_icon()
		);
	}
}
