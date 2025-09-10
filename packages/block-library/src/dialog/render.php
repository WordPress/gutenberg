<?php
/**
 * Server-side rendering of the `prc-block/dialog` block.
 *
 * @package prc-block-library
 */

$block_id = array_key_exists( 'dialogId', $attributes ) ? $attributes['dialogId'] : null;

if ( ! $block_id ) {
	_doing_it_wrong( 'dialog/render', esc_html__( 'The dialog block requires a dialogId attribute.', 'prc-block-library' ), '1.0.0' );
	return '';
}

$block_wrapper_attrs = array(
	'data-wp-interactive' => 'prc-block/dialog',
	'data-wp-context'     => wp_json_encode(
		array(
			'id' => $block_id,
		)
	),
	'data-wp-key'         => $block_id,
);

$block_wrapper_attrs = get_block_wrapper_attributes( $block_wrapper_attrs );

echo wp_sprintf(
	'<div %1$s>%2$s</div>',
	$block_wrapper_attrs, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	$content, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
);
