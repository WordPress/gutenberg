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

	$new_context = json_decode(
		is_string( $value ) && ! empty( $value ) ? $value : '{}',
		true
	);

	$context->set_context( $new_context ?? array() );
}
