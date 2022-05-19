<?php
/**
 * Load global styles assets in the front-end.
 *
 * @package gutenberg
 */

function remove_block_nodes_from_theme_json( $nodes ) {
	return array_filter( $nodes, function( $node, $key ) {
		return ! in_array( 'blocks', $node['path'] );
	}, ARRAY_FILTER_USE_BOTH );
}

/**
 * Enqueues the global styles defined via theme.json.
 * This should replace wp_enqueue_global_styles.
 *
 * @since 5.8.0
 */
function gutenberg_enqueue_global_styles() {
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

	if ( $separate_assets ) {
		add_filter( 'gutenberg_get_style_nodes', 'remove_block_nodes_from_theme_json' );
		// add each block as an inline css.
		wp_add_global_styles_for_blocks();
	}

	$stylesheet = gutenberg_get_global_stylesheet();

	if ( empty( $stylesheet ) ) {
		return;
	}

	wp_register_style( 'global-styles', false, array(), true, true );
	wp_add_inline_style( 'global-styles', $stylesheet );
	wp_enqueue_style( 'global-styles' );
}

remove_action( 'wp_enqueue_scripts', 'wp_enqueue_global_styles' );
remove_action( 'wp_footer', 'wp_enqueue_global_styles' );
remove_action( 'wp_enqueue_scripts', 'gutenberg_enqueue_global_styles_assets' );
remove_action( 'wp_footer', 'gutenberg_enqueue_global_styles_assets' );

add_action( 'wp_enqueue_scripts', 'gutenberg_enqueue_global_styles' );
add_action( 'wp_footer', 'gutenberg_enqueue_global_styles', 1 );
