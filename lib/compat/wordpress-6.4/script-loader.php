<?php
/**
 * Updates the script-loader.php file
 *
 * @package gutenberg
 */

/**
 * Collect the block editor assets that need to be loaded into the editor's iframe.
 *
 * @since 6.0.0
 * @access private
 *
 * @return array {
 *     The block editor assets.
 *
 *     @type string|false $styles  String containing the HTML for styles.
 *     @type string|false $scripts String containing the HTML for scripts.
 * }
 */
function _gutenberg_get_iframed_editor_assets_6_4() {
	global $wp_styles, $wp_scripts;

	// Keep track of the styles and scripts instance to restore later.
	$current_wp_styles  = $wp_styles;
	$current_wp_scripts = $wp_scripts;

	// Create new instances to collect the assets.
	$wp_styles  = new WP_Styles();
	$wp_scripts = new WP_Scripts();

	// Register all currently registered styles and scripts. The actions that
	// follow enqueue assets, but don't necessarily register them.
	$wp_styles->registered  = $current_wp_styles->registered;
	$wp_scripts->registered = $current_wp_scripts->registered;

	// We generally do not need reset styles for the iframed editor.
	// However, if it's a classic theme, margins will be added to every block,
	// which is reset specifically for list items, so classic themes rely on
	// these reset styles.
	$wp_styles->done =
		wp_theme_has_theme_json() ? array( 'wp-reset-editor-styles' ) : array();

	wp_enqueue_script( 'wp-polyfill' );
	// Enqueue the `editorStyle` handles for all core block, and dependencies.
	wp_enqueue_style( 'wp-edit-blocks' );

	if ( current_theme_supports( 'wp-block-styles' ) ) {
		wp_enqueue_style( 'wp-block-library-theme' );
	}

	// We don't want to load EDITOR scripts in the iframe, only enqueue
	// front-end assets for the content.
	add_filter( 'should_load_block_editor_scripts_and_styles', '__return_false' );
	do_action( 'enqueue_block_assets' );
	remove_filter( 'should_load_block_editor_scripts_and_styles', '__return_false' );

	$block_registry = WP_Block_Type_Registry::get_instance();

	// Additionally, do enqueue `editorStyle` assets for all blocks, which
	// contains editor-only styling for blocks (editor content).
	foreach ( $block_registry->get_all_registered() as $block_type ) {
		if ( isset( $block_type->editor_style_handles ) && is_array( $block_type->editor_style_handles ) ) {
			foreach ( $block_type->editor_style_handles as $style_handle ) {
				wp_enqueue_style( $style_handle );
			}
		}
	}

	/**
	 * Remove the deprecated `print_emoji_styles` handler.
	 * It avoids breaking style generation with a deprecation message.
	 */
	$has_emoji_styles = has_action( 'wp_print_styles', 'print_emoji_styles' );
	if ( $has_emoji_styles ) {
		remove_action( 'wp_print_styles', 'print_emoji_styles' );
	}

	ob_start();
	wp_print_styles();
	$styles = ob_get_clean();

	if ( $has_emoji_styles ) {
		add_action( 'wp_print_styles', 'print_emoji_styles' );
	}

	ob_start();
	wp_print_head_scripts();
	wp_print_footer_scripts();
	$scripts = ob_get_clean();

	// Restore the original instances.
	$wp_styles  = $current_wp_styles;
	$wp_scripts = $current_wp_scripts;

	return array(
		'styles'  => $styles,
		'scripts' => $scripts,
	);
}

add_filter(
	'block_editor_settings_all',
	static function ( $settings ) {
		// We must override what core is passing now.
		$settings['__unstableResolvedAssets'] = _gutenberg_get_iframed_editor_assets_6_4();
		return $settings;
	}
);
