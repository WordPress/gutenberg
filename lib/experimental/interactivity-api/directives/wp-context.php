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
 */
function gutenberg_interactivity_process_wp_context( $tags, $context ) {
	if ( $tags->is_tag_closer() ) {
		$context->rewind_context();
		return;
	}

	$value = $tags->get_attribute( 'data-wp-context' );

	/**
	 * Separate namespace and value from the context directive attribute. A
	 * check to ensure it's a non-empty string in order to avoid exceptions.
	 */
	list( $ns, $value ) = WP_Directive_Processor::parse_value_ns(
		is_string( $value ) && ! empty( $value ) ? $value : '{}'
	);

	// If there's no directive namespace, use the inherited one.
	$ns = $ns ?? $tags->get_namespace();

	$new_context = json_decode( $value, true );
	$context->set_context( array( $ns => $new_context ?? array() ) );
}
