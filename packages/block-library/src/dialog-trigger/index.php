<?php
/**
 * Dialog Trigger Block
 *
 * @package WordPress
 */

/**
 * Render the block callback
 *
 * @param array    $attributes Attributes.
 * @param string   $content Content.
 * @param WP_Block $block Block.
 * @return string HTML.
 */
function render_block_core_dialog_trigger( $attributes, $content, $block ) {
	$context_id = isset( $block->context['core/dialog-id'] ) ? $block->context['core/dialog-id'] : null;
	return wp_sprintf(
		'<button %1$s>%2$s</button>',
		get_block_wrapper_attributes(
			array(
				'class'                       => 'wp-block-dialog-trigger',
				'id'                          => wp_unique_id( 'dialog-trigger-' ),
				'aria-haspopup'               => 'dialog',
				'aria-controls'               => $context_id,
				'data-wp-bind--aria-expanded' => 'state.isOpen',
				'data-wp-interactive'         => 'core/dialog',
				'data-wp-on--click'           => 'actions.onClickOpen',
				'type'                        => 'button',
			)
		),
		$content,
	);
}

/**
 * Block init
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
