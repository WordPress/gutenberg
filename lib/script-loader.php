<?php
/**
 * Overrides the script-loader.php file.
 *
 * @package gutenberg
 */

// Remove core actions to override.
remove_action( 'wp_enqueue_scripts', 'wp_enqueue_global_styles' );
remove_action( 'wp_footer', 'wp_enqueue_global_styles', 1 );

/**
 * Enqueues the global styles defined via theme.json.
 *
 * Copy of the core `wp_enqueue_global_styles`. Uses helper methods bundled with the plugin.
 *
 * @return void
 */
function gutenberg_enqueue_global_styles() {
	if ( is_admin() ) {
		return;
	}
	$separate_assets  = wp_should_load_separate_core_block_assets();
	$is_block_theme   = wp_is_block_theme();
	$is_classic_theme = ! $is_block_theme;

	/*
	 * Global styles should be printed in the head when loading all styles combined.
	 * The footer should only be used to print global styles for classic themes with separate core assets enabled.
	 *
	 * See https://core.trac.wordpress.org/ticket/53494.
	 */
	if (
		( $is_block_theme && doing_action( 'wp_footer' ) ) ||
		( $is_classic_theme && doing_action( 'wp_footer' ) && ! $separate_assets ) ||
		( $is_classic_theme && doing_action( 'wp_enqueue_scripts' ) && $separate_assets )
	) {
		return;
	}

	$stylesheet = gutenberg_get_global_stylesheet();
	if ( empty( $stylesheet ) ) {
		return;
	}

	wp_register_style( 'global-styles', false );
	wp_add_inline_style( 'global-styles', $stylesheet );
	wp_enqueue_style( 'global-styles' );
}
add_action( 'init', 'gutenberg_enqueue_global_styles', 1 );
add_action( 'wp_footer', 'gutenberg_enqueue_global_styles', 1 );

add_action( 'wp_enqueue_scripts', 'gutenberg_add_global_styles_for_blocks' );

/**
 * Enqueues block global styles when separate core block assets are disabled.
 *
 * @since 6.5.0
 */
function gutenberg_enqueue_block_global_styles() {
	if ( wp_should_load_separate_core_block_assets() ) {
		return;
	}

	$tree        = WP_Theme_JSON_Resolver::get_merged_data();
	$block_nodes = $tree->get_styles_block_nodes();

	wp_register_style( 'global-styles-blocks', false );

	foreach ( $block_nodes as $metadata ) {
		$block_css = $tree->get_styles_for_block( $metadata );
		wp_add_inline_style( 'global-styles-blocks', $block_css );
	}

	wp_enqueue_style( 'global-styles-blocks' );
}

add_action( 'wp_enqueue_scripts', 'gutenberg_enqueue_block_global_styles' );

/**
 * Enqueues the global styles custom css.
 *
 * @since 6.2.0
 */
function gutenberg_enqueue_global_styles_custom_css() {
	if ( ! wp_is_block_theme() ) {
		return;
	}

	// Don't enqueue Customizer's custom CSS separately.
	remove_action( 'wp_head', 'wp_custom_css_cb', 101 );

	$custom_css  = wp_get_custom_css();
	$custom_css .= gutenberg_get_global_styles_custom_css();

	if ( ! empty( $custom_css ) ) {
		wp_add_inline_style( 'global-styles', $custom_css );
	}
}
remove_action( 'wp_enqueue_scripts', 'wp_enqueue_global_styles_custom_css' );
add_action( 'wp_enqueue_scripts', 'gutenberg_enqueue_global_styles_custom_css' );

/**
 * Function that enqueues the CSS Custom Properties coming from theme.json.
 *
 * @since 5.9.0
 */
function gutenberg_enqueue_global_styles_css_custom_properties() {
	wp_register_style( 'global-styles-css-custom-properties', false );
	wp_add_inline_style( 'global-styles-css-custom-properties', gutenberg_get_global_stylesheet( array( 'variables' ) ) );
	wp_enqueue_style( 'global-styles-css-custom-properties' );
}
remove_action( 'enqueue_block_editor_assets', 'wp_enqueue_global_styles_css_custom_properties' );
add_action( 'enqueue_block_editor_assets', 'gutenberg_enqueue_global_styles_css_custom_properties' );
