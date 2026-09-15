<?php
/**
 * Server-side rendering of the `core/files` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/files` block on the server.
 *
 * Marks the block as a list and each File block inside it as a list item, so
 * assistive technology announces the files as a list and how many there are.
 *
 * @since 7.2.0
 *
 * @param array  $attributes The block attributes.
 * @param string $content    The block content.
 *
 * @return string Returns the block content.
 */
function render_block_core_files( $attributes, $content ) {
	$processor = new WP_HTML_Tag_Processor( $content );
	if ( ! $processor->next_tag() ) {
		return $content;
	}
	$processor->set_bookmark( 'wrapper' );

	$has_files = false;
	while ( $processor->next_tag( array( 'class_name' => 'wp-block-file' ) ) ) {
		$processor->set_attribute( 'role', 'listitem' );
		$has_files = true;
	}

	// An empty list is announced as a list with no items, so leave it alone.
	if ( ! $has_files ) {
		return $content;
	}

	$processor->seek( 'wrapper' );
	$processor->set_attribute( 'role', 'list' );

	return $processor->get_updated_html();
}

/**
 * Registers the `core/files` block on the server.
 *
 * @since 7.2.0
 */
function register_block_core_files() {
	register_block_type_from_metadata(
		__DIR__ . '/files',
		array(
			'render_callback' => 'render_block_core_files',
		)
	);
}
add_action( 'init', 'register_block_core_files' );
