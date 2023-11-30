<?php
/**
 * Process wp-interactive directive attribute.
 *
 * @package wp-directives
 */

/**
 * Process wp-interactive directive attribute.
 *
 * @param WP_Directive_Processor $tags Tags.
 */
function gutenberg_interactivity_process_wp_interactive( $tags ) {
	if ( $tags->is_tag_closer() ) {
		$tags->pop_namespace();
		return;
	}

	$value  = $tags->get_attribute( 'data-wp-interactive' );
	$island = json_decode( $value, true );

	$tags->push_namespace( $island['namespace'] );
}
