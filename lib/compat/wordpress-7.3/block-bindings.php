<?php
/**
 * Block bindings additions for WordPress 7.3.
 *
 * @since 7.3.0
 * @package gutenberg
 * @subpackage Block Bindings
 */

/**
 * Gets the URL of the file from the parent File block.
 *
 * The URL comes from a block comment attribute, which kses does not filter
 * as a URL, so it is sanitized here before core adds it to the markup.
 *
 * @since 7.3.0
 *
 * @param array    $source_args    Array containing source arguments used to look up the value.
 * @param WP_Block $block_instance The block instance.
 * @return string|null The file URL, or null if there is no parent File block.
 */
function gutenberg_block_bindings_file_data_get_value( array $source_args, $block_instance ) {
	if ( empty( $block_instance->context['core/file-href'] ) || ! is_string( $block_instance->context['core/file-href'] ) ) {
		return null;
	}

	return esc_url_raw( $block_instance->context['core/file-href'] );
}

/**
 * Registers the File Data source in the Block Bindings registry.
 *
 * The File block binds the URL of its inner download button to this source,
 * so the button always links to the file.
 *
 * @since 7.3.0
 */
function gutenberg_register_block_bindings_file_data_source() {
	if ( get_block_bindings_source( 'core/file-data' ) ) {
		return;
	}

	register_block_bindings_source(
		'core/file-data',
		array(
			'label'              => _x( 'File', 'block bindings source' ),
			'get_value_callback' => 'gutenberg_block_bindings_file_data_get_value',
			'uses_context'       => array( 'core/file-href' ),
		)
	);
}

add_action( 'init', 'gutenberg_register_block_bindings_file_data_source' );
