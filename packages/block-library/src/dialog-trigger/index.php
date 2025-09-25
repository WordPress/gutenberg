<?php
/**
 * Dialog Trigger Block
 *
 * @package WordPress
 */

/**
 * Render the 'core/dialog-trigger' block.
 *
 * @param array    $attributes Attributes.
 * @param string   $content Content.
 * @param WP_Block $block Block.
 * @return string HTML.
 */
function render_block_core_dialog_trigger( $attributes, $content, $block ) {
	$context_id = isset( $block->context['core/dialog-id'] ) ? $block->context['core/dialog-id'] : null;
	$trigger_template = '<button %1$s>%2$s</button>';
	// @TODO: This is temporary test code during PR review phase.
	if ( WP_DEBUG ) {
		$trigger_template .= '<button data-wp-interactive="core/dialog/test" data-wp-on--click="actions.onClickOpen">TEST 3RD PARTY INTERACTION.</button>';
	}
	return wp_sprintf(
		$trigger_template,
		get_block_wrapper_attributes(
			array(
				'class'                       => 'wp-block-dialog-trigger',
				'id'                          => wp_unique_id( 'dialog-trigger-' ),
				'aria-haspopup'               => 'dialog',
				'aria-controls'               => $context_id,
				'data-wp-bind--aria-expanded' => 'state.isOpen',
				'data-wp-interactive'         => 'core/dialog/private',
				'data-wp-on--click'           => 'actions.onClickOpen',
				'type'                        => 'button',
			)
		),
		$content,
	);
}

/**
 * Registers the `core/dialog-trigger` block on server.
 *
 * @hook init
 * @return void
 */
function register_block_core_dialog_trigger() {
	register_block_type_from_metadata(
		__DIR__ . '/dialog-trigger',
		array(
			'render_callback' => 'render_block_core_dialog_trigger',
		)
	);
}
add_action( 'init', 'register_block_core_dialog_trigger' );
