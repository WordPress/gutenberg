<?php
/**
 * Updates client assets for the editor.
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
function gutenberg_register_vendor_scripts( $scripts ) {
	$extension = SCRIPT_DEBUG ? '.js' : '.min.js';

	gutenberg_override_script(
		$scripts,
		'react',
		gutenberg_url( 'build/vendors/react' . $extension ),
		// See https://github.com/pmmmwh/react-refresh-webpack-plugin/blob/main/docs/TROUBLESHOOTING.md#externalising-react.
		SCRIPT_DEBUG ? array( 'wp-react-refresh-entry', 'wp-polyfill' ) : array( 'wp-polyfill' )
	);
	gutenberg_override_script(
		$scripts,
		'react-dom',
		gutenberg_url( 'build/vendors/react-dom' . $extension ),
		array( 'react' )
	);
}
add_action( 'wp_default_scripts', 'gutenberg_register_vendor_scripts' );

/**
 * Sets the editor styles to be consumed by JS.
 */
function gutenberg_resolve_assets() {
	global $pagenow;

	$script_handles = array();
	$style_handles  = array(
		'wp-block-editor',
		'wp-block-library',
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
		if ( ! empty( $block_type->style ) ) {
			$style_handles[] = $block_type->style;
		}

		if ( ! empty( $block_type->editor_style ) ) {
			$style_handles[] = $block_type->editor_style;
		}

		if ( ! empty( $block_type->script ) ) {
			$script_handles[] = $block_type->script;
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

	return array(
		'styles'  => $styles,
		'scripts' => $scripts,
	);
}

add_filter(
	'block_editor_settings_all',
	function( $settings ) {
		// In the future we can allow WP Dependency handles to be passed.
		$settings['__unstableResolvedAssets'] = gutenberg_resolve_assets();
		return $settings;
	}
);
