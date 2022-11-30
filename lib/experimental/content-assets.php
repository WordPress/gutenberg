<?php
/**
 * Filter to override the default content assests from core.
 *
 * @package gutenberg
 */

/**
 * Sets the content assets for the block editor.
 */
function gutenberg_resolve_assets_override() {
	global $pagenow;

	$script_handles = array();
	$style_handles  = array(
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
		// We must override what core is passing now.
		$settings['__unstableResolvedAssets'] = gutenberg_resolve_assets_override();
		return $settings;
	},
	100
);
