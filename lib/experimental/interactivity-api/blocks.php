<?php
/**
 * Temporary compatibility shims for block APIs present in Gutenberg.
 *
 * @package gutenberg
 */

/**
 * Adds Interactivity API directives to the File block markup using the Tag Processor.
 *
 * @param string   $block_content Markup of the File block.
 * @param array    $block         The full block, including name and attributes.
 * @param WP_Block $instance      The block instance.
 *
 * @return string File block markup with the directives injected when applicable.
 */
function gutenberg_block_core_file_add_directives_to_content( $block_content, $block, $instance ) {
	if ( empty( $instance->attributes['displayPreview'] ) ) {
		return $block_content;
	}
	$processor = new WP_HTML_Tag_Processor( $block_content );
	$processor->next_tag();
	$processor->set_attribute( 'data-wp-island', '' );
	$processor->set_attribute( 'data-wp-init', 'effects.core.file.init' );
	return $processor->get_updated_html();
}
add_filter( 'render_block_core/file', 'gutenberg_block_core_file_add_directives_to_content', 10, 3 );

/**
 * Replaces view script for the File block with version using Interactivity API.
 *
 * @param array $metadata Block metadata as read in via block.json.
 *
 * @return array Filtered block type metadata.
 */
function gutenberg_block_core_file_update_view_script( $metadata ) {
	if ( 'core/file' === $metadata['name'] && str_contains( $metadata['file'], 'build/block-library/blocks' ) ) {
		$metadata['viewScript'] = array( 'file:./interactivity.min.js' );
	}
	return $metadata;
}
add_filter( 'block_type_metadata', 'gutenberg_block_core_file_update_view_script', 10, 1 );
