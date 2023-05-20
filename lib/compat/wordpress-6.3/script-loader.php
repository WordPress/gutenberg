<?php
/**
 * Updates the script-loader.php file
 *
 * @package gutenberg
 */

/**
 * Removes the actions that output all duotone SVG filter presets.
 * WP_Duotone_Gutenberg now handles which SVG filters should be output
 * depending on the block content.
 */
remove_action( 'wp_body_open', 'wp_global_styles_render_svg_filters' );
remove_action( 'in_admin_header', 'wp_global_styles_render_svg_filters' );

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
function _gutenberg_get_iframed_editor_assets() {
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

	wp_enqueue_style( 'wp-block-editor-content' );
	// To do: investigate why this is not enqueued through enqueue_block_assets,
	// as styles for non-core blocks are.
	wp_enqueue_style( 'wp-block-library' );
	wp_enqueue_script( 'wp-polyfill' );

	// We don't want to load EDITOR scripts and styles in the iframe, only
	// assets for the content.
	add_filter( 'should_load_block_editor_scripts_and_styles', '__return_false' );
	do_action( 'enqueue_block_assets' );
	remove_filter( 'should_load_block_editor_scripts_and_styles', '__return_false' );

	ob_start();
	wp_print_styles();
	wp_print_fonts( true );
	$styles = ob_get_clean();

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
	function( $settings ) {
		// We must override what core is passing now.
		$settings['__unstableResolvedAssets'] = _gutenberg_get_iframed_editor_assets();
		return $settings;
	},
	100
);
