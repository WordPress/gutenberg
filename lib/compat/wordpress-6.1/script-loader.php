<?php
/**
 * Load global styles assets in the front-end.
 *
 * @package gutenberg
 */

/**
 * This function takes care of adding inline styles
 * in the proper place, depending on the theme in use.
 *
 * This method was added to core in 5.9.1, but with a single param ($style). The second param ($priority) was
 * added post 6.0, so the 6.1 release needs to have wp_enqueue_block_support_styles updated to include this param.
 *
 * For block themes, it's loaded in the head.
 * For classic ones, it's loaded in the body
 * because the wp_head action  happens before
 * the render_block.
 *
 * @link https://core.trac.wordpress.org/ticket/53494.
 *
 * @param string $style String containing the CSS styles to be added.
 * @param int    $priority To set the priority for the add_action.
 */
function gutenberg_enqueue_block_support_styles( $style, $priority = 10 ) {
	$action_hook_name = 'wp_footer';
	if ( wp_is_block_theme() ) {
		$action_hook_name = 'wp_head';
	}
	add_action(
		$action_hook_name,
		static function () use ( $style ) {
			echo "<style>$style</style>\n";
		},
		$priority
	);
}

/**
 * Fetches, processes and compiles stored core styles, then combines and renders them to the page.
 * Styles are stored via the style engine API.
 *
 * See: https://developer.wordpress.org/block-editor/reference-guides/packages/packages-style-engine/
 *
 * @param array $options {
 *     Optional. An array of options to pass to gutenberg_style_engine_get_stylesheet_from_context(). Default empty array.
 *
 *     @type bool $optimize Whether to optimize the CSS output, e.g., combine rules. Default is `false`.
 *     @type bool $prettify Whether to add new lines and indents to output. Default is the test of whether the global constant `SCRIPT_DEBUG` is defined.
 * }
 *
 * @return void
 */
function gutenberg_enqueue_stored_styles( $options = array() ) {
	$is_block_theme   = wp_is_block_theme();
	$is_classic_theme = ! $is_block_theme;

	/*
	 * For block themes, print stored styles in the header.
	 * For classic themes, in the footer.
	 */
	if (
		( $is_block_theme && doing_action( 'wp_footer' ) ) ||
		( $is_classic_theme && doing_action( 'wp_enqueue_scripts' ) )
	) {
		return;
	}

	$core_styles_keys         = array( 'block-supports' );
	$compiled_core_stylesheet = '';
	$style_tag_id             = 'core';
	foreach ( $core_styles_keys as $style_key ) {
		// Adds comment if code is prettified to identify core styles sections in debugging.
		$should_prettify = isset( $options['prettify'] ) ? true === $options['prettify'] : defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG;
		if ( $should_prettify ) {
			$compiled_core_stylesheet .= "/**\n * Core styles: $style_key\n */\n";
		}
		// Chains core store ids to signify what the styles contain.
		$style_tag_id             .= '-' . $style_key;
		$compiled_core_stylesheet .= gutenberg_style_engine_get_stylesheet_from_context( $style_key, $options );
	}

	// Combines Core styles.
	if ( ! empty( $compiled_core_stylesheet ) ) {
		wp_register_style( $style_tag_id, false, array(), true, true );
		wp_add_inline_style( $style_tag_id, $compiled_core_stylesheet );
		wp_enqueue_style( $style_tag_id );
	}

	// If there are any other stores registered by themes etc, print them out.
	$additional_stores = WP_Style_Engine_CSS_Rules_Store_Gutenberg::get_stores();
	foreach ( array_keys( $additional_stores ) as $store_name ) {
		if ( in_array( $store_name, $core_styles_keys, true ) ) {
			continue;
		}
		$styles = gutenberg_style_engine_get_stylesheet_from_context( $store_name, $options );
		if ( ! empty( $styles ) ) {
			$key = "wp-style-engine-$store_name";
			wp_register_style( $key, false, array(), true, true );
			wp_add_inline_style( $key, $styles );
			wp_enqueue_style( $key );
		}
	}
}

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
	add_filter( 'gutenberg_theme_json_get_style_nodes', 'gutenberg_filter_out_block_nodes', 10, 1 );

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
remove_action( 'wp_enqueue_scripts', 'gutenberg_enqueue_global_styles_assets' );
remove_action( 'wp_footer', 'gutenberg_enqueue_global_styles_assets' );

// Enqueue global styles, and then block supports styles.
add_action( 'wp_enqueue_scripts', 'gutenberg_enqueue_global_styles' );
add_action( 'wp_footer', 'gutenberg_enqueue_global_styles', 1 );
add_action( 'wp_enqueue_scripts', 'gutenberg_enqueue_stored_styles' );
add_action( 'wp_footer', 'gutenberg_enqueue_stored_styles', 1 );
