<?php
/**
 * Test suite extension that primes the layout global styles cache.
 *
 * @package gutenberg
 */

/**
 * Primes the memoized global styles in gutenberg_render_layout_support_flag()
 * before the first test runs.
 *
 * gutenberg_render_layout_support_flag() memoizes global styles in a function
 * static on the first layout render of the PHPUnit process, and nothing
 * invalidates that static on theme switches. Tests that rely on the `custom-gap`
 * block style variation's blockGap value need that variation's data to be
 * present in the memoized snapshot, so it must be registered before the first
 * layout render — which can happen in any test file that renders a block with
 * layout support, not just the layout test file itself.
 *
 * Registering the variation and rendering a group block with it here (before
 * any test runs) ensures the snapshot is built while the variation is
 * registered. The variation is unregistered again afterwards so the styles
 * registry is clean for the rest of the suite; the layout test file registers
 * and unregisters it per test as usual.
 */
class Gutenberg_Layout_Global_Styles_Cache_Setup implements PHPUnit\Runner\BeforeFirstTestHook {
	/**
	 * Receives a PHPUnit 'runFirstTest' signal.
	 */
	public function executeBeforeFirstTest(): void {
		register_block_style(
			'core/group',
			array(
				'name'       => 'custom-gap',
				'label'      => 'Custom Gap',
				'style_data' => array(
					'spacing' => array(
						'blockGap' => '99px',
					),
				),
			)
		);

		// Render a group block so the memoized global styles snapshot is built
		// while the `custom-gap` variation is registered.
		gutenberg_render_layout_support_flag(
			'<div class="wp-block-group"></div>',
			array(
				'blockName' => 'core/group',
				'attrs'     => array( 'layout' => array( 'type' => 'default' ) ),
			)
		);

		unregister_block_style( 'core/group', 'custom-gap' );

		// Clear the styles accumulated by the render above so they don't leak
		// into tests that inspect the style engine output.
		WP_Style_Engine_CSS_Rules_Store_Gutenberg::remove_all_stores();
	}
}
