<?php
/**
 * Temporary compatibility shims for block APIs present in Gutenberg.
 *
 * @package gutenberg
 */

/**
 * Process the block bindings attribute for pattern overrides.
 *
 * @param string   $block_content Block Content.
 * @param array    $parsed_block  The full block, including name and attributes.
 * @param WP_Block $block_instance The block instance.
 */
function gutenberg_process_pattern_overrides_bindings( $block_content, $parsed_block, $block_instance ) {
	$pattern_overrides_source = get_block_bindings_source( 'core/pattern-overrides' );

	// Return early if the pattern overrides source is not registered.
	if ( null === $pattern_overrides_source ) {
		return $block_content;
	}

	$supported_block_attrs = array(
		'core/paragraph' => array( 'content' ),
		'core/heading'   => array( 'content' ),
		'core/image'     => array( 'id', 'url', 'title', 'alt' ),
		'core/button'    => array( 'url', 'text', 'linkTarget', 'rel' ),
	);

	// If the block isn't one of the supported block types or isn't inside a pattern, return.
	if (
		! isset( $supported_block_attrs[ $block_instance->name ] ) ||
		! isset( $block_instance->context['pattern/overrides'] ) ||
		empty( $parsed_block['attrs']['metadata']['name'] )
	) {
		return $block_content;
	}

	$modified_block_content = $block_content;
	foreach ( $supported_block_attrs[ $block_instance->name ] as $attribute_name ) {
		$source_value = $pattern_overrides_source->get_value( array(), $block_instance, $attribute_name );

		// If the value is not null, process the HTML based on the block and the attribute.
		if ( ! is_null( $source_value ) ) {
			$modified_block_content = gutenberg_block_bindings_replace_html( $modified_block_content, $block_instance->name, $attribute_name, $source_value );
		}
	}

	return $modified_block_content;
}

add_filter( 'render_block', 'gutenberg_process_pattern_overrides_bindings', 20, 3 );
