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
 * @param array  $attributes The block attributes.
 * @param string $content    The block content.
 *
 * @return string Returns the block content.
 */
function render_block_core_file( $attributes, $content ) {
	$content = block_core_file_describe_download_button( $content );

	if ( empty( $attributes['displayPreview'] ) ) {
		return $content;
	}

	// If it's interactive, enqueue the script module and add the directives.
	wp_enqueue_script_module( '@wordpress/block-library/file/view' );

	$processor = new WP_HTML_Tag_Processor( $content );
	if ( $processor->next_tag() ) {
		$processor->set_attribute( 'data-wp-interactive', 'core/file' );
	}

	// If there are no OBJECT elements, something might have already modified the block.
	if ( ! $processor->next_tag( 'OBJECT' ) ) {
		return $content;
	}

	$processor->set_attribute( 'data-wp-bind--hidden', '!state.hasPdfPreview' );
	$processor->set_attribute( 'hidden', true );

	$filename     = $processor->get_attribute( 'aria-label' );
	$has_filename = is_string( $filename ) && ! empty( $filename ) && 'PDF embed' !== $filename;
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

/**
 * Links the download button to the file name, so that screen readers announce
 * which file it downloads.
 *
 * The download button is an inner Button block, which cannot know the ID of
 * the file name link. Blocks saved before that change already have the
 * attribute on their `wp-block-file__button` link, and are left unchanged.
 *
 * @since 7.3.0
 *
 * @param string $content The block content.
 *
 * @return string The block content.
 */
function block_core_file_describe_download_button( $content ) {
	$processor    = new WP_HTML_Tag_Processor( $content );
	$file_name_id = null;

	while ( $processor->next_tag( 'A' ) ) {
		if ( $processor->has_class( 'wp-block-button__link' ) ) {
			if ( null === $file_name_id ) {
				return $content;
			}
			$processor->set_attribute( 'aria-describedby', $file_name_id );
			return $processor->get_updated_html();
		}

		$id = $processor->get_attribute( 'id' );
		if ( null === $file_name_id && is_string( $id ) && '' !== $id ) {
			$file_name_id = $id;
		}
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
