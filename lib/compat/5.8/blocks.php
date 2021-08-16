<?php
/**
 * Blocks.
 *
 * @package Gutenberg
 * @subpackage Editor
 * @since 11.0.0
 */

/**
 * Registers view scripts for core blocks if handling is missing in WordPress core.
 *
 * This is a temporary solution until the Gutenberg plugin sets
 * the required WordPress version to 5.8.
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
		strpos( $metadata['file'], gutenberg_dir_path() ) !== 0
	) {
		return $settings;
	}

	$view_script_path = realpath( dirname( $metadata['file'] ) . '/' . remove_block_asset_path_prefix( $metadata['viewScript'] ) );
	if ( file_exists( $view_script_path ) ) {
		$view_script_handle = str_replace( 'core/', 'wp-block-', $metadata['name'] ) . '-view';
		wp_deregister_script( $view_script_handle );

		// Replace suffix and extension with `.asset.php` to find the generated dependencies file.
		$view_asset_file          = substr( $view_script_path, 0, -( strlen( '.js' ) ) ) . '.asset.php';
		$view_asset               = file_exists( $view_asset_file ) ? require( $view_asset_file ) : null;
		$view_script_dependencies = isset( $view_asset['dependencies'] ) ? $view_asset['dependencies'] : array();
		$view_script_version      = isset( $view_asset['version'] ) ? $view_asset['version'] : false;

		$result = wp_register_script(
			$view_script_handle,
			gutenberg_url( str_replace( gutenberg_dir_path(), '', $view_script_path ) ),
			$view_script_dependencies,
			$view_script_version,
			true
		);
		if ( $result ) {
			$settings['view_script'] = $view_script_handle;
		}
	}

	return $settings;
}

add_filter( 'block_type_metadata_settings', 'gutenberg_block_type_metadata_view_script', 10, 2 );

/**
 * Change the way styles get loaded depending on their size.
 *
 * Optimizes performance and sustainability of styles by inlining smaller stylesheets.
 *
 * @todo Remove this function when the minimum supported version is WordPress 5.8.
 *
 * @return void
 */
function gutenberg_maybe_inline_styles() {

	// Early exit if the "wp_maybe_inline_styles" function exists.
	if ( function_exists( 'wp_maybe_inline_styles' ) ) {
		return;
	}

	$total_inline_limit = 20000;
	/**
	 * The maximum size of inlined styles in bytes.
	 *
	 * @param int $total_inline_limit The file-size threshold, in bytes. Defaults to 20000.
	 * @return int                    The file-size threshold, in bytes.
	 */
	$total_inline_limit = apply_filters( 'styles_inline_size_limit', $total_inline_limit );

	global $wp_styles;
	$styles = array();

	// Build an array of styles that have a path defined.
	foreach ( $wp_styles->queue as $handle ) {
		if ( wp_styles()->get_data( $handle, 'path' ) && file_exists( $wp_styles->registered[ $handle ]->extra['path'] ) ) {
			$styles[] = array(
				'handle' => $handle,
				'path'   => $wp_styles->registered[ $handle ]->extra['path'],
				'size'   => filesize( $wp_styles->registered[ $handle ]->extra['path'] ),
			);
		}
	}

	if ( ! empty( $styles ) ) {
		// Reorder styles array based on size.
		usort(
			$styles,
			function( $a, $b ) {
				return ( $a['size'] <= $b['size'] ) ? -1 : 1;
			}
		);

		/**
		 * The total inlined size.
		 *
		 * On each iteration of the loop, if a style gets added inline the value of this var increases
		 * to reflect the total size of inlined styles.
		 */
		$total_inline_size = 0;

		// Loop styles.
		foreach ( $styles as $style ) {

			// Size check. Since styles are ordered by size, we can break the loop.
			if ( $total_inline_size + $style['size'] > $total_inline_limit ) {
				break;
			}

			// Get the styles if we don't already have them.
			$style['css'] = file_get_contents( $style['path'] );

			// Set `src` to `false` and add styles inline.
			$wp_styles->registered[ $style['handle'] ]->src = false;
			if ( empty( $wp_styles->registered[ $style['handle'] ]->extra['after'] ) ) {
				$wp_styles->registered[ $style['handle'] ]->extra['after'] = array();
			}
			array_unshift( $wp_styles->registered[ $style['handle'] ]->extra['after'], $style['css'] );

			// Add the styles size to the $total_inline_size var.
			$total_inline_size += (int) $style['size'];
		}
	}
}
// Run for styles enqueued in <head>.
add_action( 'wp_head', 'gutenberg_maybe_inline_styles', 1 );
// Run for late-loaded styles in the footer.
add_action( 'wp_footer', 'gutenberg_maybe_inline_styles', 1 );

/**
 * Filters the default block categories array to add a new one for themes.
 *
 * This can be removed when plugin support requires WordPress 5.8.0+.
 *
 * @see https://core.trac.wordpress.org/ticket/52883
 *
 * @param array[] $categories The list of default block categories.
 *
 * @return array[] Filtered block categories.
 */
function gutenberg_register_theme_block_category( $categories ) {
	foreach ( $categories as $category ) {
		// Skip when the category is already set in WordPress core.
		if (
			isset( $category['slug'] ) &&
			'theme' === $category['slug']
		) {
			return $categories;
		}
	}

	$categories[] = array(
		'slug'  => 'theme',
		'title' => _x( 'Theme', 'block category', 'gutenberg' ),
		'icon'  => null,
	);
	return $categories;
}
// This can be removed when plugin support requires WordPress 5.8.0+.
if ( ! function_exists( 'get_default_block_categories' ) ) {
	add_filter( 'block_categories', 'gutenberg_register_theme_block_category' );
}

/**
 * Checks whether the current block type supports the feature requested.
 *
 * @param WP_Block_Type $block_type Block type to check for support.
 * @param array         $feature    Path of the feature to check support for.
 * @param mixed         $default    Fallback value for feature support, defaults to false.
 *
 * @return boolean                  Whether or not the feature is supported.
 */
function gutenberg_block_has_support( $block_type, $feature, $default = false ) {
	$block_support = $default;
	if ( $block_type && property_exists( $block_type, 'supports' ) ) {
		$block_support = _wp_array_get( $block_type->supports, $feature, $default );
	}

	return true === $block_support || is_array( $block_support );
}

/**
 * Updates the shape of supports for declaring fontSize and lineHeight.
 *
 * @param array $metadata Metadata for registering a block type.
 * @return array          Metadata for registering a block type with the supports shape updated.
 */
function gutenberg_migrate_old_typography_shape( $metadata ) {
	// Temporarily disable migrations from core blocks to avoid warnings on versions older than 5.8.
	if ( isset( $metadata['supports'] ) && false === strpos( $metadata['file'], '/wp-includes/blocks/' ) ) {
		$typography_keys = array(
			'__experimentalFontFamily',
			'__experimentalFontStyle',
			'__experimentalFontWeight',
			'__experimentalLetterSpacing',
			'__experimentalTextDecoration',
			'__experimentalTextTransform',
			'fontSize',
			'lineHeight',
		);
		foreach ( $typography_keys as $typography_key ) {
			$support_for_key = _wp_array_get( $metadata['supports'], array( $typography_key ), null );
			if ( null !== $support_for_key ) {
				trigger_error(
					/* translators: %1$s: Block type, %2$s: typography supports key e.g: fontSize, lineHeight etc... */
					sprintf( __( 'Block %1$s is declaring %2$s support on block.json under supports.%2$s. %2$s support is now declared under supports.typography.%2$s.', 'gutenberg' ), $metadata['name'], $typography_key ),
					headers_sent() || WP_DEBUG ? E_USER_WARNING : E_USER_NOTICE
				);
				gutenberg_experimental_set( $metadata['supports'], array( 'typography', $typography_key ), $support_for_key );
				unset( $metadata['supports'][ $typography_key ] );
			}
		}
	}
	return $metadata;
}

if ( ! function_exists( 'wp_migrate_old_typography_shape' ) ) {
	add_filter( 'block_type_metadata', 'gutenberg_migrate_old_typography_shape' );
}
