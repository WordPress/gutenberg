<?php
/**
 * Temporary compatibility shims for block APIs present in Gutenberg.
 *
 * @package gutenberg
 */

 /**
 * Process the block bindings attribute.
 *
 * @param string   $block_content Block Content.
 * @param array    $parsed_block  The full block, including name and attributes.
 * @param WP_Block $block_instance The block instance.
 * @return string  Block content with the bind applied.
 */
function gutenberg_process_pullquote_bindings( $block_content, $parsed_block, $block_instance ) {
	if (
		empty( $parsed_block['attrs']['metadata']['bindings'] )
	) {
		return $block_content;
	}


	$bindings     = $parsed_block['attrs']['metadata']['bindings'];
	$block_reader = new WP_HTML_Tag_Processor( $block_content );
    $block_type   = WP_Block_Type_Registry::get_instance()->get_registered( $block_instance->name );

	while ( $block_reader->next_tag() ) {
		$current_tag = $block_reader->get_tag();
		if ( 'P' === $current_tag && ! empty( $bindings['value'] ) ) {
			$value_binding_source     = get_block_bindings_source( $bindings['value']['source'] );
			$value_args               = ! empty( $bindings['value']['args'] ) && is_array( $bindings['value']['args'] ) ? $bindings['value']['args'] : array();
			$block_type->uses_context = array_merge( $block_type->uses_context, $value_binding_source->uses_context );
			$block_instance->refresh_context_dependents();
			$value = $value_binding_source->get_value( $value_args, $block_instance, 'value' );
			$block_reader->set_attribute( 'data-value', $value );
		} else if ( 'CITE' === $current_tag && ! empty( $bindings['citation'] ) ) {
			$citation_binding_source  = get_block_bindings_source( $bindings['citation']['source'] );
			$citation_args            = ! empty( $bindings['citation']['args'] ) && is_array( $bindings['citation']['args'] ) ? $bindings['citation']['args'] : array();
			$citation                 = $citation_binding_source->get_value( $citation_args, $block_instance, 'citation' );
			$block_type->uses_context = array_merge( $block_type->uses_context, $value_binding_source->uses_context );
			$block_instance->refresh_context_dependents();
			$block_reader->set_attribute( 'data-citation', $citation );
		}
	}

	return $block_reader->get_updated_html();
}


add_filter( 'render_block_core/pullquote', 'gutenberg_process_pullquote_bindings', 20, 3 );
