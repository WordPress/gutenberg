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
	wp_print_fonts();
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


if ( ! wp_is_block_theme() ) {
	// Load the block styles inline for non-block themes.
	add_filter( 'should_load_separate_core_block_assets', '__return_true', 1 );
	// Remove the block styles from the footer.
	remove_action( 'wp_footer', 'wp_maybe_inline_styles', 1 );
}

/**
 * Print block styles inline for non-block (classic) themes.
 * Improves performance for classic themes by only loading the styles that are needed
 * for the blocks that are actually used on the page, instead of loading all block styles.
 * At the same time, this reduces layout shifts by inlining these styles
 * instead of printing them all in the footer.
 *
 * This function is hooked on `render_block`.
 *
 * @param string $block_content The block content.
 * @param array  $block         The full block, including name and attributes.
 *
 * @return string The block content.
 */
function gutenberg_inline_block_styles_on_classic_themes( $block_content, $block ) {
	// Bail early if not a classic theme.
	if ( wp_is_block_theme() ) {
		return $block_content;
	}

	// Get all registered blocks. Use a static var to avoid calling this
	// for each block that gets rendered on the page.
	static $all_registered_blocks;
	if ( ! $all_registered_blocks ) {
		$all_registered_blocks = WP_Block_Type_Registry::get_instance()->get_all_registered();
	}

	$style_handles = array();
	if ( ! empty( $all_registered_blocks[ $block['blockName'] ] ) ) {
		$style_handles = $all_registered_blocks[ $block['blockName'] ]->style_handles;
	}

	// Bail early if there are no styles for this block.
	if ( empty( $style_handles ) ) {
		return $block_content;
	}

	/* This filter is documented in wp-includes/script-loader.php */
	$total_inline_limit = apply_filters( 'styles_inline_size_limit', 20000 );

	// A static var to keep track of the total inlined CSS size.
	static $total_inline_size = 0;

	// Get the WP_Styles object.
	$wp_styles = wp_styles();

	foreach ( $style_handles as $style_handle ) {
		// Skip stylesheet if it has already been printed.
		if ( in_array( $style_handle, $wp_styles->done, true ) ) {
			continue;
		}

		$path  = wp_styles()->get_data( $style_handle, 'path' );
		$after = wp_styles()->get_data( $style_handle, 'after' );
		if ( is_array( $after ) ) {
			$after = implode( '', $after );
		}

		// Skip stylesheet if it has no path or "after" data.
		if ( ! $path && ! $after ) {
			continue;
		}

		// Get the CSS for this stylesheet.
		$css = file_exists( $path ) ? file_get_contents( $path ) : '';

		// Add the "after" styles.
		$css .= $after;

		// Get the size of the CSS.
		$styles_size = strlen( $css );

		// Skip if styles are empty.
		if ( 0 === $styles_size ) {
			$wp_styles->done[] = $style_handle;
			continue;
		}

		// Check if adding these styles inline will exceed the limit.
		// If it does, then bail early.
		if ( $total_inline_size + $styles_size > $total_inline_limit ) {
			continue;
		}

		$wp_styles->done[] = $style_handle;
		$block_content    .= '<style id="' . $style_handle . '-inline-css">' . $css . '</style>';
		wp_dequeue_style( $style_handle );
	}

	return $block_content;
}
add_filter( 'render_block', 'gutenberg_inline_block_styles_on_classic_themes', 100, 2 );
