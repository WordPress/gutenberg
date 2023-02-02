<?php
/**
 * Updates the script-loader.php file
 *
 * @package gutenberg
 */

/**
 * Registers vendor JavaScript files to be used as dependencies of the editor
 * and plugins.
 *
 * This function is called from a script during the plugin build process, so it
 * should not call any WordPress PHP functions.
 *
 * @since 13.0
 *
 * @param WP_Scripts $scripts WP_Scripts instance.
 */
function gutenberg_register_vendor_scripts_62( $scripts ) {
	$extension = SCRIPT_DEBUG ? '.js' : '.min.js';

	$script = $scripts->query( 'wp-inert-polyfill', 'registered' );
	if ( ! $script ) {
		$scripts->add( 'wp-inert-polyfill', gutenberg_url( 'build/vendors/inert-polyfill' . $extension ), array() );
	}

	$script       = $scripts->query( 'wp-polyfill', 'registered' );
	$script->deps = array_merge( $script->deps, array( 'wp-inert-polyfill' ) );
}
add_action( 'wp_default_scripts', 'gutenberg_register_vendor_scripts_62' );

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
 * @deprecated 6.2 Block supports styles are now stored for enqueuing via the style engine API. See: packages/style-engine/README.md.
 *
 * @param string $style String containing the CSS styles to be added.
 * @param int    $priority To set the priority for the add_action.
 */
function gutenberg_enqueue_block_support_styles( $style, $priority = 10 ) {
	_deprecated_function( __FUNCTION__, '6.2' );

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
 * Sets the content assets for the block editor.
 *
 * Note for core merge: see inline comment on what's been updated.
 */
function gutenberg_resolve_assets_override() {
	global $pagenow;

	$script_handles = array(
		'wp-polyfill',
	);
	// Note for core merge: only 'wp-edit-blocks' should be in this array.
	$style_handles = array(
		'wp-edit-blocks',
	);

	if ( current_theme_supports( 'wp-block-styles' ) ) {
		$style_handles[] = 'wp-block-library-theme';
	}

	if ( 'widgets.php' === $pagenow || 'customize.php' === $pagenow ) {
		$style_handles[] = 'wp-widgets';
		$style_handles[] = 'wp-edit-widgets';
	}

	$block_registry = WP_Block_Type_Registry::get_instance();

	foreach ( $block_registry->get_all_registered() as $block_type ) {
		// In older WordPress versions, like 6.0, these properties are not defined.
		if ( isset( $block_type->style_handles ) && is_array( $block_type->style_handles ) ) {
			$style_handles = array_merge( $style_handles, $block_type->style_handles );
		}

		if ( isset( $block_type->editor_style_handles ) && is_array( $block_type->editor_style_handles ) ) {
			$style_handles = array_merge( $style_handles, $block_type->editor_style_handles );
		}

		if ( isset( $block_type->script_handles ) && is_array( $block_type->script_handles ) ) {
			$script_handles = array_merge( $script_handles, $block_type->script_handles );
		}
	}

	$style_handles = array_unique( $style_handles );
	$done          = wp_styles()->done;

	ob_start();

	// We do not need reset styles for the iframed editor.
	wp_styles()->done = array( 'wp-reset-editor-styles' );
	wp_styles()->do_items( $style_handles );
	wp_styles()->done = $done;

	$styles = ob_get_clean();

	$script_handles = array_unique( $script_handles );
	$done           = wp_scripts()->done;

	ob_start();

	wp_scripts()->done = array();
	wp_scripts()->do_items( $script_handles );
	wp_scripts()->done = $done;

	$scripts = ob_get_clean();

	/*
	 * Generate font @font-face styles for the site editor iframe.
	 * Use the registered font families for printing.
	 */
	if ( class_exists( 'WP_Fonts' ) ) {
		$wp_fonts   = wp_fonts();
		$registered = $wp_fonts->get_registered_font_families();
		if ( ! empty( $registered ) ) {
			$queue = $wp_fonts->queue;
			$done  = $wp_fonts->done;

			$wp_fonts->done  = array();
			$wp_fonts->queue = $registered;

			ob_start();
			$wp_fonts->do_items();
			$styles .= ob_get_clean();

			// Reset the Web Fonts API.
			$wp_fonts->done  = $done;
			$wp_fonts->queue = $queue;
		}
	}

	return array(
		'styles'  => $styles,
		'scripts' => $scripts,
	);
}

add_filter(
	'block_editor_settings_all',
	function( $settings ) {
		// We must override what core is passing now.
		$settings['__unstableResolvedAssets']    = gutenberg_resolve_assets_override();
		$settings['__unstableIsBlockBasedTheme'] = wp_is_block_theme();
		return $settings;
	},
	100
);

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
add_action( 'wp_enqueue_scripts', 'gutenberg_enqueue_global_styles_custom_css' );
