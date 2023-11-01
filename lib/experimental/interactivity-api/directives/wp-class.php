<?php
/**
 * Process wp-class directive attribute.
 *
 * @package Gutenberg
 * @subpackage Interactivity API
 */

/**
 * Process wp-class directive attribute.
 *
 * @param WP_Directive_Processor $tags Tags.
 * @param WP_Directive_Context   $context Directive context.
 */
function gutenberg_interactivity_process_wp_class( $tags, $context ) {
	if ( $tags->is_tag_closer() ) {
		return;
	}

	$prefixed_attributes = $tags->get_attribute_names_with_prefix( 'data-wp-class--' );

	foreach ( $prefixed_attributes as $attr ) {
		list( , $class_name ) = WP_Directive_Processor::parse_attribute_name( $attr );
		if ( empty( $class_name ) ) {
			continue;
		}

		$expr      = $tags->get_attribute( $attr );
		$add_class = gutenberg_interactivity_evaluate_reference( $expr, $context->get_context() );
		if ( $add_class ) {
			$tags->add_class( $class_name );
		} else {
			$tags->remove_class( $class_name );
		}
	}
}
