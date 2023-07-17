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
	if ( null === $value ) {
		// No data-wp-context directive.
		return;
	}

	$new_context = json_decode( $value, true );
	if ( null === $new_context ) {
		// Invalid JSON defined in the directive.
		return;
	}

	$context->set_context( $new_context );
}
