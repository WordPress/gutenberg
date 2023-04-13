<?php
/**
 * Temporary compatibility shims for block APIs present in Gutenberg.
 *
 * @package gutenberg
 */

/**
 * Update allowed inline style attributes list.
 *
 * Note: This should be removed when the minimum required WP version is >= 6.1.
 *
 * @param string[] $attrs Array of allowed CSS attributes.
 * @return string[] CSS attributes.
 */
function gutenberg_safe_style_attrs_6_1( $attrs ) {
	$attrs[] = 'flex-wrap';
	$attrs[] = 'gap';
	$attrs[] = 'column-gap';
	$attrs[] = 'row-gap';
	$attrs[] = 'margin-block-start';
	$attrs[] = 'margin-block-end';
	$attrs[] = 'margin-inline-start';
	$attrs[] = 'margin-inline-end';

	return $attrs;
}
add_filter( 'safe_style_css', 'gutenberg_safe_style_attrs_6_1' );

/**
 * Update allowed CSS values to match WordPress 6.1.
 *
 * Note: This should be removed when the minimum required WP version is >= 6.1.
 *
 * The logic in this function follows that provided in: https://core.trac.wordpress.org/ticket/55966.
 *
 * @param boolean $allow_css       Whether or not the current test string is allowed.
 * @param string  $css_test_string The CSS string to be tested.
 * @return boolean
 */
function gutenberg_safecss_filter_attr_allow_css_6_1( $allow_css, $css_test_string ) {
	if ( false === $allow_css ) {
		/*
		 * Allow CSS functions like var(), calc(), etc. by removing them from the test string.
		 * Nested functions and parentheses are also removed, so long as the parentheses are balanced.
		 */
		$css_test_string = preg_replace(
			'/\b(?:var|calc|min|max|minmax|clamp)(\((?:[^()]|(?1))*\))/',
			'',
			$css_test_string
		);

		// Check for any CSS containing \ ( & } = or comments,
		// except for url(), calc(), or var() usage checked above.
		$allow_css = ! preg_match( '%[\\\(&=}]|/\*%', $css_test_string );
	}
	return $allow_css;
}
add_filter( 'safecss_filter_attr_allow_css', 'gutenberg_safecss_filter_attr_allow_css_6_1', 10, 2 );

/**
 * Registers view scripts for core blocks if handling is missing in WordPress core.
 *
 * @since 6.1.0
 *
 * @param array $settings Array of determined settings for registering a block type.
 * @param array $metadata Metadata provided for registering a block type.
 *
 * @return array Array of settings for registering a block type.
 */
function gutenberg_block_type_metadata_view_script( $settings, $metadata ) {
	if (
		! isset( $metadata['viewScript'] ) ||
		! empty( $settings['view_script'] ) ||
		! isset( $metadata['file'] ) ||
		! str_starts_with( $metadata['file'], wp_normalize_path( gutenberg_dir_path() ) )
	) {
		return $settings;
	}

	$view_script_path = wp_normalize_path( realpath( dirname( $metadata['file'] ) . '/' . remove_block_asset_path_prefix( $metadata['viewScript'] ) ) );

	if ( file_exists( $view_script_path ) ) {
		$view_script_id     = str_replace( array( '.min.js', '.js' ), '', basename( remove_block_asset_path_prefix( $metadata['viewScript'] ) ) );
		$view_script_handle = str_replace( 'core/', 'wp-block-', $metadata['name'] ) . '-' . $view_script_id;
		wp_deregister_script( $view_script_handle );

		// Replace suffix and extension with `.asset.php` to find the generated dependencies file.
		$view_asset_file          = substr( $view_script_path, 0, -( strlen( '.js' ) ) ) . '.asset.php';
		$view_asset               = file_exists( $view_asset_file ) ? require $view_asset_file : null;
		$view_script_dependencies = isset( $view_asset['dependencies'] ) ? $view_asset['dependencies'] : array();
		$view_script_version      = isset( $view_asset['version'] ) ? $view_asset['version'] : false;
		$result                   = wp_register_script(
			$view_script_handle,
			gutenberg_url( str_replace( wp_normalize_path( gutenberg_dir_path() ), '', $view_script_path ) ),
			$view_script_dependencies,
			$view_script_version
		);
		if ( $result ) {
			$settings['view_script'] = $view_script_handle;

			if ( ! empty( $metadata['textdomain'] ) && in_array( 'wp-i18n', $view_script_dependencies, true ) ) {
				wp_set_script_translations( $view_script_handle, $metadata['textdomain'] );
			}
		}
	}
	return $settings;
}
add_filter( 'block_type_metadata_settings', 'gutenberg_block_type_metadata_view_script', 10, 2 );

/**
 * Allow multiple view scripts per block.
 *
 * Filters the metadata provided for registering a block type.
 *
 * @since 6.1.0
 *
 * @param array $metadata Metadata for registering a block type.
 *
 * @return array
 */
function gutenberg_block_type_metadata_multiple_view_scripts( $metadata ) {

	// Early return if viewScript is empty, or not an array.
	if ( ! isset( $metadata['viewScript'] ) || ! is_array( $metadata['viewScript'] ) ) {
		return $metadata;
	}

	// Register all viewScript items.
	foreach ( $metadata['viewScript'] as $view_script ) {
		$item_metadata               = $metadata;
		$item_metadata['viewScript'] = $view_script;
		gutenberg_block_type_metadata_view_script( array(), $item_metadata );
	}

	// Proceed with the default behavior.
	$metadata['viewScript'] = $metadata['viewScript'][0];
	return $metadata;
}
add_filter( 'block_type_metadata', 'gutenberg_block_type_metadata_multiple_view_scripts' );

/**
 * Register render template for core blocks if handling is missing in WordPress core.
 *
 * @since 6.1.0
 *
 * @param array $settings Array of determined settings for registering a block type.
 * @param array $metadata Metadata provided for registering a block type.
 *
 * @return array Array of settings for registering a block type.
 */
function gutenberg_block_type_metadata_render_template( $settings, $metadata ) {
	if ( empty( $metadata['render'] ) || isset( $settings['render_callback'] ) ) {
		return $settings;
	}

	$template_path = wp_normalize_path(
		realpath(
			dirname( $metadata['file'] ) . '/' .
			remove_block_asset_path_prefix( $metadata['render'] )
		)
	);

	// Bail if the file does not exist.
	if ( ! file_exists( $template_path ) ) {
		return $settings;
	}
	/**
	 * Renders the block on the server.
	 *
	 * @param array    $attributes Block attributes.
	 * @param string   $content    Block default content.
	 * @param WP_Block $block      Block instance.
	 *
	 * @return string Returns the block content.
	 */
	$settings['render_callback'] = function( $attributes, $content, $block ) use ( $template_path ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		ob_start();
		require $template_path;
		return ob_get_clean();
	};

	return $settings;
}
add_filter( 'block_type_metadata_settings', 'gutenberg_block_type_metadata_render_template', 10, 2 );
