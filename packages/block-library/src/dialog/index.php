<?php
/**
 * Dialog Block
 *
 * @package WordPress
 */

/**
 * Fallback to generate a unique dialogId if one is not provided.
 * This ensures programmatic usage of the dialog block works if a user forgets to
 * add an attribute.
 *
 * @hook render_block_data
 *
 * @param mixed $block Block.
 * @return mixed
 */
function block_core_dialog_id_fallback( $block ) {
	if ( 'core/dialog' === $block['blockName'] ) {
		if ( ! isset( $block['attrs']['dialogId'] ) || empty( $block['attrs']['dialogId'] ) ) {
			$block['attrs']['dialogId'] = wp_unique_id( 'dialog-' );
		}
	}
	return $block;
}
add_filter( 'render_block_data', 'block_core_dialog_id_fallback' );

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
	$block_id = array_key_exists( 'dialogId', $attributes ) ? $attributes['dialogId'] : null;

	if ( ! $block_id ) {
		_doing_it_wrong( 'core/dialog::render', esc_html__( 'The dialog block requires a dialogId attribute.', 'default' ), '1.0.0' );
		return '';
	}

	$block_wrapper_attrs = array(
		'data-wp-interactive' => 'core/dialog',
		'data-wp-context'     => wp_json_encode(
			array(
				'id' => $block_id,
			)
		),
		'data-wp-key'         => $block_id,
	);

	$block_wrapper_attrs = get_block_wrapper_attributes( $block_wrapper_attrs );

	return wp_sprintf(
		'<div %1$s>%2$s</div>',
		$block_wrapper_attrs, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		$content, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	);
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
