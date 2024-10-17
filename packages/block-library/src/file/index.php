<?php
/**
 * Server-side rendering of the `core/file` block.
 *
 * @package WordPress
 */

/**
 * When the `core/file` block is rendering, check if we need to enqueue the `wp-block-file-view` script.
 *
 * @since 5.8.0
 *
 * @param array    $attributes The block attributes.
 * @param string   $content    The block content.
 * @param WP_Block $block      The parsed block.
 *
 * @return string Returns the block content.
 */
function render_block_core_file( $attributes, $content ) {
	// If it's interactive, enqueue the script module and add the directives.
	if ( ! empty( $attributes['displayPreview'] ) ) {
		wp_enqueue_script_module( '@wordpress/block-library/file/view' );

		$processor = new WP_HTML_Tag_Processor( $content );
		$processor->next_tag();
		$processor->set_attribute( 'data-wp-interactive', 'core/file' );
		$processor->next_tag( 'object' );
		$processor->set_attribute( 'data-wp-bind--hidden', '!state.hasPdfPreview' );
		$processor->set_attribute( 'hidden', true );

		$filename     = $processor->get_attribute( 'aria-label' );
		$has_filename = ! empty( $filename ) && 'PDF embed' !== $filename;
		$label        = $has_filename ? sprintf(
			/* translators: %s: filename. */
			__( 'Embed of %s.' ),
			$filename
		) : __( 'PDF embed' );

		// Update object's aria-label attribute if present in block HTML.
		// Match an aria-label attribute from an object tag.
		$processor->set_attribute( 'aria-label', $label );

		return $processor->get_updated_html();
	}

	return $content;
}

/**
 * Registers the `core/file` block on server.
 *
 * @since 5.8.0
 */
function register_block_core_file() {
	register_block_type_from_metadata(
		__DIR__ . '/file',
		array(
			'render_callback' => 'render_block_core_file',
		)
	);
}
add_action( 'init', 'register_block_core_file' );
