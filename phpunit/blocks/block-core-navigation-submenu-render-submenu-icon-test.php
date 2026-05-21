<?php
/**
 * Tests for the deprecated block_core_navigation_submenu_render_submenu_icon() shim.
 *
 * In Gutenberg plugin builds, the function name is prefixed with `gutenberg_`
 * by the build system to avoid colliding with the WordPress Core version. These
 * tests therefore exercise the prefixed name; the unprefixed counterpart is the
 * one Core ships once the change syncs back.
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
	public function test_function_exists() {
		$this->assertTrue(
			function_exists( 'gutenberg_block_core_navigation_submenu_render_submenu_icon' ),
			'The deprecated shim gutenberg_block_core_navigation_submenu_render_submenu_icon() should exist.'
		);
	}

	/**
	 * @ticket 65287
	 */
	public function test_returns_same_markup_as_shared_helper() {
		$this->setExpectedDeprecated( 'gutenberg_block_core_navigation_submenu_render_submenu_icon' );

		$this->assertSame(
			block_core_shared_navigation_render_submenu_icon(),
			gutenberg_block_core_navigation_submenu_render_submenu_icon()
		);
	}
}
