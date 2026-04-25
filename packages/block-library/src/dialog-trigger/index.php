<?php
/**
 * Dialog Trigger Block
 *
 * @package WordPress
 */

/**
 * Render the 'core/dialog-trigger' block.
 *
 * The trigger must contain a single core/buttons block with one core/button
 * inside. Interactivity directives are applied directly to the rendered
 * <button> or <a> element.
 *
 * @param array    $attributes Attributes.
 * @param string   $content Content.
 * @param WP_Block $block Block.
 * @return string HTML.
 */
function render_block_core_dialog_trigger( $attributes, $content, $block ) {
	$context_id = isset( $block->context['core/dialog-id'] ) ? $block->context['core/dialog-id'] : null;
	$trigger_id = wp_unique_id( 'dialog-trigger-' );

	$trigger_attrs = array(
		'aria-haspopup'               => 'dialog',
		'aria-controls'               => $context_id,
		'aria-expanded'               => 'false',
		'data-wp-bind--aria-expanded' => 'state.dialog.isOpen',
		'data-wp-interactive'         => 'core/dialog/private',
		'data-wp-on--click'           => 'actions.onClickOpen',
		'data-wp-on--keydown'         => 'actions.onTriggerKeydown',
	);

	$tag_processor = new WP_HTML_Tag_Processor( $content );
	while ( $tag_processor->next_tag() ) {
		$tag = strtolower( $tag_processor->get_tag() );
		if ( 'button' === $tag || 'a' === $tag ) {
			$tag_processor->add_class( 'wp-block-dialog-trigger' );
			$tag_processor->set_attribute( 'id', $trigger_id );
			foreach ( $trigger_attrs as $attr => $value ) {
				$tag_processor->set_attribute( $attr, $value );
			}
			if ( 'button' === $tag && ! $tag_processor->get_attribute( 'type' ) ) {
				$tag_processor->set_attribute( 'type', 'button' );
			}
			break;
		}
	}

	return $tag_processor->get_updated_html();
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
