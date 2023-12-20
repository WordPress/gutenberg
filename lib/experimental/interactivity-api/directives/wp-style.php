<?php
/**
 * Process wp-style directive attribute.
 *
 * @package Gutenberg
 * @subpackage Interactivity API
 */

/**
 * Process wp-style directive attribute.
 *
 * @param WP_Directive_Processor $tags Tags.
 * @param WP_Directive_Context   $context Directive context.
 */
function gutenberg_interactivity_process_wp_style( $tags, $context ) {
	if ( $tags->is_tag_closer() ) {
		return;
	}

	$prefixed_attributes = $tags->get_attribute_names_with_prefix( 'data-wp-style--' );

	foreach ( $prefixed_attributes as $attr ) {
		list( , $style_name ) = WP_Directive_Processor::parse_attribute_name( $attr );
		if ( empty( $style_name ) ) {
			continue;
		}

		$expr        = $tags->get_attribute( $attr );
		$style_value = gutenberg_interactivity_evaluate_reference( $expr, $context->get_context() );
		if ( $style_value ) {
			$style_attr = $tags->get_attribute( 'style' );
			$style_attr = gutenberg_interactivity_set_style( $style_attr, $style_name, $style_value );
			$tags->set_attribute( 'style', $style_attr );
		} else {
			// TODO: Do we want to unset styles if they're null?
		}
	}
}

/**
 * Set style.
 *
 * @param string $style Existing style to amend.
 * @param string $name  Style property name.
 * @param string $value Style property value.
 * @return string Amended styles.
 */
function gutenberg_interactivity_set_style( $style, $name, $value ) {
	$style_assignments = explode( ';', $style );
	$modified          = false;
	foreach ( $style_assignments as $style_assignment ) {
		list( $style_name ) = explode( ':', $style_assignment );
		if ( trim( $style_name ) === $name ) {
			// TODO: Retain surrounding whitespace from $style_value, if any.
			$style_assignment = $style_name . ': ' . $value;
			$modified         = true;
			break;
		}
	}

	if ( ! $modified ) {
		$new_style_assignment = $name . ': ' . $value;
		// If the last element is empty or whitespace-only, we insert
		// the new "key: value" pair before it.
		if ( empty( trim( end( $style_assignments ) ) ) ) {
			array_splice( $style_assignments, - 1, 0, $new_style_assignment );
		} else {
			array_push( $style_assignments, $new_style_assignment );
		}
	}
	return implode( ';', $style_assignments );
}
