<?php
/**
 * Process the wp-interactive directive.
 *
 * @package Gutenberg
 * @subpackage Interactivity API
 */

/**
 * Process wp-interactive directive.
 *
 * @param WP_Directive_Processor $tags Tags.
 * @param WP_Directive_Context   $context Directive context.
 * @param string                 $ns Namespace.
 * @param array                  $ns_stack Namespace stack.
 */
function gutenberg_interactivity_process_wp_interactive( $tags, $context, $ns, &$ns_stack ) {
	// Pop the current namespace if this is the closing tag of an island.
	if ( $tags->is_tag_closer() ) {
		array_pop( $ns_stack );
		return;
	}

	/*
	 * Decode the data-wp-interactive attribute. In the case it is not a valid
	 * JSON string, NULL is stored in `$island_data`.
	 */
	$island      = $tags->get_attribute( 'data-wp-interactive' );
	$island_data = is_string( $island ) && ! empty( $island )
		? json_decode( $island, true )
		: null;

	/*
	 * Push the newly defined namespace, or the current one if the island
	 * definition was invalid or does not contain a namespace.
	 *
	 * This is done because the function pops out the current namespace from the
	 * stack whenever it finds an island's closing tag, independently of whether
	 * the island definition was correct or it contained a valid namespace.
	 */
	$ns_stack[] = isset( $island_data ) && $island_data['namespace']
		? $island_data['namespace']
		: $ns;
}
