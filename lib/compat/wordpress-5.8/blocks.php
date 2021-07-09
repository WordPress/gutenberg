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
 * Complements the renaming of `Query Loop` to `Post Template`.
 * This ensures backwards compatibility for any users running the Gutenberg
 * plugin who have used Query Loop prior to its renaming.
 *
 * This can be removed when WordPress 5.9 is released.
 *
 * @see https://github.com/WordPress/gutenberg/pull/32514
 */
function gutenberg_register_legacy_query_loop_block() {
	$registry = WP_Block_Type_Registry::get_instance();
	if ( $registry->is_registered( 'core/query-loop' ) ) {
		unregister_block_type( 'core/query-loop' );
	}
	register_block_type(
		'core/query-loop',
		array(
			'category'          => 'design',
			'uses_context'      => array(
				'queryId',
				'query',
				'queryContext',
				'displayLayout',
				'templateSlug',
			),
			'supports'          => array(
				'reusable' => false,
				'html'     => false,
				'align'    => true,
			),
			'style'             => 'wp-block-post-template',
			'render_callback'   => 'render_legacy_query_loop_block',
			'skip_inner_blocks' => true,
		)
	);
}
add_action( 'init', 'gutenberg_register_legacy_query_loop_block' );
