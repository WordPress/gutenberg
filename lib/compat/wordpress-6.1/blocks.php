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
	$attrs[] = 'display';
	$attrs[] = 'flex-wrap';
	$attrs[] = 'gap';
	$attrs[] = 'margin-block-start';
	$attrs[] = 'margin-block-end';
	$attrs[] = 'margin-inline-start';
	$attrs[] = 'margin-inline-end';

	return $attrs;
}
add_filter( 'safe_style_css', 'gutenberg_safe_style_attrs_6_1' );

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
		strpos( $metadata['file'], gutenberg_dir_path() ) !== 0
	) {
		return $settings;
	}

	$view_script_path = realpath( dirname( $metadata['file'] ) . '/' . remove_block_asset_path_prefix( $metadata['viewScript'] ) );

	if ( file_exists( $view_script_path ) ) {
		$view_script_id     = str_replace( array( '.min.js', '.js' ), '', basename( remove_block_asset_path_prefix( $metadata['viewScript'] ) ) );
		$view_script_handle = str_replace( 'core/', 'wp-block-', $metadata['name'] ) . '-' . $view_script_id;
		wp_deregister_script( $view_script_handle );

		// Replace suffix and extension with `.asset.php` to find the generated dependencies file.
		$view_asset_file          = substr( $view_script_path, 0, -( strlen( '.js' ) ) ) . '.asset.php';
		$view_asset               = file_exists( $view_asset_file ) ? require( $view_asset_file ) : null;
		$view_script_dependencies = isset( $view_asset['dependencies'] ) ? $view_asset['dependencies'] : array();
		$view_script_version      = isset( $view_asset['version'] ) ? $view_asset['version'] : false;
		$result                   = wp_register_script(
			$view_script_handle,
			gutenberg_url( str_replace( gutenberg_dir_path(), '', $view_script_path ) ),
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

if ( ! function_exists( 'wp_enqueue_block_view_script' ) ) {
	/**
	 * Enqueues a frontend script for a specific block.
	 *
	 * Scripts enqueued using this function will only get printed
	 * when the block gets rendered on the frontend.
	 *
	 * @since 6.1.0
	 *
	 * @param string $block_name The block name, including namespace.
	 * @param array  $args       An array of arguments [handle,src,deps,ver,media,textdomain].
	 *
	 * @return void
	 */
	function wp_enqueue_block_view_script( $block_name, $args ) {
		$args = wp_parse_args(
			$args,
			array(
				'handle'     => '',
				'src'        => '',
				'deps'       => array(),
				'ver'        => false,
				'in_footer'  => false,

				// Additional args to allow translations for the script's textdomain.
				'textdomain' => '',
			)
		);

		/**
		 * Callback function to register and enqueue scripts.
		 *
		 * @param string $content When the callback is used for the render_block filter,
		 *                        the content needs to be returned so the function parameter
		 *                        is to ensure the content exists.
		 * @return string Block content.
		 */
		$callback = static function( $content, $block ) use ( $args, $block_name ) {

			// Sanity check.
			if ( empty( $block['blockName'] ) || $block_name !== $block['blockName'] ) {
				return $content;
			}

			// Register the stylesheet.
			if ( ! empty( $args['src'] ) ) {
				wp_register_script( $args['handle'], $args['src'], $args['deps'], $args['ver'], $args['in_footer'] );
			}

			// Enqueue the stylesheet.
			wp_enqueue_script( $args['handle'] );

			// If a textdomain is defined, use it to set the script translations.
			if ( ! empty( $args['textdomain'] ) && in_array( 'wp-i18n', $args['deps'], true ) ) {
				wp_set_script_translations( $args['handle'], $args['textdomain'], $args['domainpath'] );
			}

			return $content;
		};

		/*
		 * The filter's callback here is an anonymous function because
		 * using a named function in this case is not possible.
		 *
		 * The function cannot be unhooked, however, users are still able
		 * to dequeue the script registered/enqueued by the callback
		 * which is why in this case, using an anonymous function
		 * was deemed acceptable.
		 */
		add_filter( 'render_block', $callback, 10, 2 );
	}
}

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
