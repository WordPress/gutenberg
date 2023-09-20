<?php
/**
 * Process wp-text directive attribute.
 *
 * @package Gutenberg
 * @subpackage Interactivity API
 */

/**
 * Process wp-text directive attribute.
 *
 * @param WP_Directive_Processor $tags Tags.
 * @param WP_Directive_Context   $context Directive context.
 */
function gutenberg_interactivity_process_wp_text( $tags, $context ) {
	if ( $tags->is_tag_closer() ) {
		return;
	}

	$value = $tags->get_attribute( 'data-wp-text' );
	if ( null === $value ) {
		return;
	}

	$text = gutenberg_interactivity_evaluate_reference( $value, $context->get_context() );
	$tags->set_inner_html( esc_html( $text ) );
}
