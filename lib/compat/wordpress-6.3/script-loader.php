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
 * @global string $pagenow The filename of the current screen.
 *
 * @return array {
 *     The block editor assets.
 *
 *     @type string|false $styles  String containing the HTML for styles.
 *     @type string|false $scripts String containing the HTML for scripts.
 * }
 */
function _wp_get_iframed_editor_assets__63() {
	global $wp_styles, $wp_scripts;

	$current_wp_styles  = $wp_styles;
	$current_wp_scripts = $wp_scripts;

	$wp_styles  = new WP_Styles();
	$wp_scripts = new WP_Scripts();

	add_filter( 'should_load_block_editor_scripts_and_styles', '__return_false' );
	do_action( 'enqueue_block_assets' );
	remove_filter( 'should_load_block_editor_scripts_and_styles', '__return_false' );

	// This is a new hook for cases where we want to enqueue scripts/styles for
	// the (iframed) editor content, but not for the front-end.
	do_action( 'enqueue_block_editor_content_assets' );

	ob_start();
	wp_print_styles();
	$styles = ob_get_clean();

	ob_start();
	wp_print_head_scripts();
	wp_print_footer_scripts();
	$scripts = ob_get_clean();

	$wp_styles  = $current_wp_styles;
	$wp_scripts = $current_wp_scripts;

	return array(
		'styles'  => $styles,
		'scripts' => $scripts,
	);
}

add_action(
	'enqueue_block_editor_content_assets',
	function() {
		wp_enqueue_style( 'wp-block-editor-content' );
	}
);

add_filter(
	'block_editor_settings_all',
	function( $settings ) {
		// We must override what core is passing now.
		$settings['__unstableResolvedAssets'] = _wp_get_iframed_editor_assets__63();
		return $settings;
	},
	100
);
