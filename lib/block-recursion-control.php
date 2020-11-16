<?php
/**
 * Blocks API: Block recursion control functions.
 *
 * @package gutenberg
 */

/**
 * Determines whether or not to process this content.
 *
 * @param string|integer $id Unique ID for the content.
 * @param string $block_name Block name.
 * @return bool - true if recursion hasn't been detected.
 */
function gutenberg_process_this_content( $id, $block_name ) {
	$recursion_control = WP_Block_Recursion_Control::get_instance();
	return $recursion_control->process_this_content( $id, $block_name );
}

/**
 * Pops the last item of processed content.
 *
 * As we return to the previous level we can clear the processed content.
 * Basically this is something we have to do while processing certain inner blocks:
 *
 * - core/post-content
 * - core/template-part
 * - core/block
 * - core/post-excerpt - possibly
 *
 * Note: The top level is within the template, which loads the template parts and/or queries.
 */
function gutenberg_clear_processed_content() {
	$recursion_control = WP_Block_Recursion_Control::get_instance();
	$recursion_control->clear_processed_content();
}
