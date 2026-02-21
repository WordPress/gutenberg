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

	// If the only inner block is a core/button attach directives directly to the rendered
	// button or anchor element to avoid a nested <button> situation.
	$inner_blocks = $block->inner_blocks;
	$only_one_block = 1 === count( $inner_blocks );
	$singular_block_name = $only_one_block ? $inner_blocks[0]->name : null;
	if ( $only_one_block && 'core/buttons' === $singular_block_name ) {
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

	// Default: wrap inner content in a <div role="button"> to allow block-level content
	// (e.g. <p>, <h*>) which would be invalid inside a native <button>.
	return wp_sprintf(
		'<div %1$s>%2$s</div>',
		get_block_wrapper_attributes(
			array_merge(
				$trigger_attrs,
				array(
					'id'       => $trigger_id,
					'role'     => 'button',
					'tabindex' => '0',
				)
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
