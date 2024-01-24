<?php
/**
 * Process wp-context directive attribute.
 *
 * @package wp-directives
 */

/**
 * Process wp-context directive attribute.
 *
 * @param WP_Directive_Processor $tags Tags.
 * @param WP_Directive_Context   $context Directive context.
 * @param string                 $ns Namespace.
 */
function gutenberg_interactivity_process_wp_context( $tags, $context, $ns ) {
	if ( $tags->is_tag_closer() ) {
		$context->rewind_context();
		return;
	}

	$attr_value = $tags->get_attribute( 'data-wp-context' );

	//Separate namespace and value from the context directive attribute.
	list( $ns, $data ) = is_string( $attr_value ) && ! empty( $attr_value )
		? WP_Directive_Processor::parse_attribute_value( $attr_value, $ns )
		: array( $ns, null );

	// Add parsed data to the context under the corresponding namespace.
	$context->set_context( array( $ns => is_array( $data ) ? $data : array() ) );
}
