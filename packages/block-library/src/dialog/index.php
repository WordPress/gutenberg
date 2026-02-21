<?php
/**
 * Dialog Block
 *
 * @package WordPress
 */

/**
 * Ensures block context contains dialog anchor ID value.
 * If none is available for this instance of a dialog,
 * a unique one will be generated.
 *
 * @hook render_block_data
 *
 * @param mixed $block Block.
 * @return mixed
 */
function block_core_dialog_id_fallback( $context, $block ) {
	// If the block already has an ID, don't override it.
	if ( 'core/dialog' === $block['blockName'] ) {
		$tag_processor = new WP_HTML_Tag_Processor( $block['innerHTML'] );
		$tag_processor->next_tag();
		$id = $tag_processor->get_attribute( 'id' );
		if ( $id ) {
			$context['core/dialog-id'] = $id;
		} else {
			$context['core/dialog-id'] = wp_unique_id( 'wp-dialog-' );
		}
	}
	return $context;
}
add_filter( 'render_block_context', 'block_core_dialog_id_fallback', 10, 2 );

/**
 * Render the 'core/dialog' block.
 *
 * @param array  $attributes Block attributes.
 * @param string $content Block content.
 * @param WP_Block $block Block instance.
 *
 * @return string Returns the filtered block content.
 */
function render_block_core_dialog( $attributes, $content, $block ) {
	$block_context = $block->context;

	$block_id = array_key_exists( 'core/dialog-id', $block_context ) ? $block_context['core/dialog-id'] : false;

	if ( ! $block_id ) {
		_doing_it_wrong( 'render_block_core_dialog', esc_html__( 'The core/dialog block requires an id via block context.', 'default' ), '1.0.0' );
		return '';
	}

	$tag_processor = new WP_HTML_Tag_Processor( $content );
	$tag_processor->next_tag();
	// This ID is consumed by dialog-content via block context and used as that element's ID.
	// Here, the ID is removed from the dialog block to avoid duplication and then
	// added as a Interactivity API `wp-key` directive to ensure uniqueness.
	$tag_processor->remove_attribute( 'id' );

	$context = wp_json_encode( array( 'id' => $block_id ) );

	$tag_processor->set_attribute( 'data-wp-interactive', 'core/dialog/private' );
	$tag_processor->set_attribute( 'data-wp-key', $block_id );
	$tag_processor->set_attribute( 'data-wp-context', $context );
	$tag_processor->set_attribute( 'data-wp-init', 'callbacks.onInit' );

	return $tag_processor->get_updated_html();
}

/**
 * Registers the `core/dialog` block on server.
 *
 * @hook init
 * @return void
 */
function register_block_core_dialog() {
	register_block_type_from_metadata(
		__DIR__ . '/dialog',
		array(
			'render_callback' => 'render_block_core_dialog',
		)
	);
}
add_action( 'init', 'register_block_core_dialog' );
