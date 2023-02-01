<?php
/**
 * Load global styles assets in the front-end.
 *
 * @package gutenberg
 */

/**
 * This applies a filter to the list of style nodes that comes from `get_style_nodes` in WP_Theme_JSON.
 * This particular filter removes all of the blocks from the array.
 *
 * We want WP_Theme_JSON to be ignorant of the implementation details of how the CSS is being used.
 * This filter allows us to modify the output of WP_Theme_JSON depending on whether or not we are loading separate assets,
 * without making the class aware of that detail.
 *
 * @since 6.1
 *
 * @param array $nodes The nodes to filter.
 * @return array A filtered array of style nodes.
 */
function gutenberg_filter_out_block_nodes( $nodes ) {
	return array_filter(
		$nodes,
		function( $node ) {
			return ! in_array( 'blocks', $node['path'], true );
		},
		ARRAY_FILTER_USE_BOTH
	);
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

	/**
	 * If we are loading CSS for each block separately, then we can load the theme.json CSS conditionally.
	 * This removes the CSS from the global-styles stylesheet and adds it to the inline CSS for each block.
	 * This filter has to be registered before we call gutenberg_get_global_stylesheet();
	 */
	add_filter( 'wp_theme_json_get_style_nodes', 'gutenberg_filter_out_block_nodes', 10, 1 );

	$stylesheet = gutenberg_get_global_stylesheet();
	if ( empty( $stylesheet ) ) {
		return;
	}

	wp_register_style( 'global-styles', false, array(), true, true );
	wp_add_inline_style( 'global-styles', $stylesheet );
	wp_enqueue_style( 'global-styles' );

	// add each block as an inline css.
	gutenberg_add_global_styles_for_blocks();
}

remove_action( 'wp_enqueue_scripts', 'wp_enqueue_global_styles' );
remove_action( 'wp_footer', 'wp_enqueue_global_styles', 1 );

// Enqueue global styles, and then block supports styles.
add_action( 'wp_enqueue_scripts', 'gutenberg_enqueue_global_styles' );
add_action( 'wp_footer', 'gutenberg_enqueue_global_styles', 1 );

/**
 * Loads classic theme styles on classic themes in the frontend.
 *
 * This is needed for backwards compatibility for button blocks specifically.
 */
function gutenberg_enqueue_classic_theme_styles() {
	if ( ! wp_is_block_theme() ) {
		wp_register_style( 'classic-theme-styles', gutenberg_url( 'build/block-library/classic.css' ), array(), true );
		wp_enqueue_style( 'classic-theme-styles' );
	}
}
add_action( 'wp_enqueue_scripts', 'gutenberg_enqueue_classic_theme_styles' );

/**
 * Loads classic theme styles on classic themes in the editor.
 *
 * This is needed for backwards compatibility for button blocks specifically.
 *
 * @since 6.1
 *
 * @param array $editor_settings The array of editor settings.
 * @return array A filtered array of editor settings.
 */
function gutenberg_add_editor_classic_theme_styles( $editor_settings ) {
	if ( wp_is_block_theme() ) {
		return $editor_settings;
	}

	$classic_theme_styles = gutenberg_dir_path() . '/build/block-library/classic.css';

	// This follows the pattern of get_block_editor_theme_styles,
	// but we can't use get_block_editor_theme_styles directly as it
	// only handles external files or theme files.
	$editor_settings['styles'][] = array(
		'css'            => file_get_contents( $classic_theme_styles ),
		'baseURL'        => get_theme_file_uri( $classic_theme_styles ),
		'__unstableType' => 'theme',
		'isGlobalStyles' => false,
	);

	return $editor_settings;
}
add_filter( 'block_editor_settings_all', 'gutenberg_add_editor_classic_theme_styles' );
