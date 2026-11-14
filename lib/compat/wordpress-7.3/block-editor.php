<?php
/**
 * Block editor compatibility shims for WordPress 7.3.
 *
 * @package gutenberg
 */

/**
 * Collect the block editor assets that need to be loaded into the editor's iframe.
 *
 * Same as core's `_wp_get_iframed_editor_assets()`, but also prints the
 * script modules enqueued in `enqueue_block_assets`.
 *
 * @global WP_Styles         $wp_styles         The WP_Styles current instance.
 * @global WP_Scripts        $wp_scripts        The WP_Scripts current instance.
 * @global WP_Script_Modules $wp_script_modules The WP_Script_Modules current instance.
 *
 * @return array {
 *     The block editor assets.
 *
 *     @type string|false $styles  String containing the HTML for styles.
 *     @type string|false $scripts String containing the HTML for scripts.
 * }
 */
function gutenberg_get_iframed_editor_assets() {
	global $wp_styles, $wp_scripts, $wp_script_modules;

	// Keep track of the styles and scripts instance to restore later.
	$current_wp_styles         = $wp_styles;
	$current_wp_scripts        = $wp_scripts;
	$current_wp_script_modules = wp_script_modules();

	// Create new instances to collect the assets.
	$wp_styles  = new WP_Styles();
	$wp_scripts = new WP_Scripts();

	/*
	 * Register all currently registered styles and scripts. The actions that
	 * follow enqueue assets, but don't necessarily register them.
	 */
	$wp_styles->registered  = $current_wp_styles->registered;
	$wp_scripts->registered = $current_wp_scripts->registered;

	// Script modules keep their registrations but start with an empty queue.
	$wp_script_modules = clone $current_wp_script_modules;
	foreach ( $wp_script_modules->get_queue() as $id ) {
		$wp_script_modules->dequeue( $id );
	}

	/*
	 * We generally do not need reset styles for the iframed editor.
	 * However, if it's a classic theme, margins will be added to every block,
	 * which is reset specifically for list items, so classic themes rely on
	 * these reset styles.
	 */
	$wp_styles->done =
		wp_theme_has_theme_json() ? array( 'wp-reset-editor-styles' ) : array();

	wp_enqueue_script( 'wp-polyfill' );
	// Enqueue the `editorStyle` handles for all core block, and dependencies.
	wp_enqueue_style( 'wp-edit-blocks' );

	if ( current_theme_supports( 'wp-block-styles' ) ) {
		wp_enqueue_style( 'wp-block-library-theme' );
	}

	/*
	 * We don't want to load EDITOR scripts in the iframe, only enqueue
	 * front-end assets for the content.
	 */
	add_filter( 'should_load_block_editor_scripts_and_styles', '__return_false' );
	/** This action is documented in wp-includes/script-loader.php */
	do_action( 'enqueue_block_assets' );
	remove_filter( 'should_load_block_editor_scripts_and_styles', '__return_false' );

	$block_registry = WP_Block_Type_Registry::get_instance();

	/*
	 * Additionally, do enqueue `editorStyle` assets for all blocks, which
	 * contains editor-only styling for blocks (editor content).
	 */
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
	wp_print_font_faces();
	wp_print_font_faces_from_style_variations();
	$styles = ob_get_clean();

	if ( $has_emoji_styles ) {
		add_action( 'wp_print_styles', 'print_emoji_styles' );
	}

	ob_start();
	wp_print_head_scripts();
	wp_print_footer_scripts();
	$wp_script_modules->print_import_map();
	$wp_script_modules->print_enqueued_script_modules();
	$scripts = ob_get_clean();

	// Restore the original instances.
	$wp_styles         = $current_wp_styles;
	$wp_scripts        = $current_wp_scripts;
	$wp_script_modules = $current_wp_script_modules;

	return array(
		'styles'  => $styles,
		'scripts' => $scripts,
	);
}

add_filter(
	'block_editor_settings_all',
	static function ( $settings ) {
		// Override the assets core resolved, so the iframe also gets script modules.
		$settings['__unstableResolvedAssets'] = gutenberg_get_iframed_editor_assets();
		return $settings;
	},
	100
);
