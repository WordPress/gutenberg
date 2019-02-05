<?php
/**
 * Server-side rendering of the `core/calendar` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/calendar` block on server.
 *
 * @param array $attributes The block attributes.
 *
 * @return string Returns the block content.
 */
function render_block_core_calendar( $attributes ) {
	global $monthnum, $year;
	if ( isset( $attributes['month'] ) ) {
		$monthnum = $attributes['month'];
	}

	if ( isset( $attributes['year'] ) ) {
		$year = $attributes['year'];
	}
	$custom_class_name = empty( $attributes['className'] ) ? '' : ' ' . $attributes['className'];
	$align_class_name  = empty( $attributes['align'] ) ? '' : ' ' . "align{$attributes['align']}";

	return sprintf(
		'<div class="%1$s">%2$s</div>',
		esc_attr( 'wp-block-calendar' . $custom_class_name . $align_class_name ),
		get_calendar( true, false )
	);
}

/**
 * Registers the `core/calendar` block on server.
 */
function register_block_core_calendar() {
	register_block_type(
		'core/calendar',
		array(
			'attributes'      => array(
				'align'     => array(
					'type' => 'string',
				),
				'className' => array(
					'type' => 'string',
				),
				'month'  => array(
					'type' => 'integer',
				),
				'year'      => array(
					'type' => 'integer',
				),
			),
			'render_callback' => 'render_block_core_calendar',
		)
	);
}

add_action( 'init', 'register_block_core_calendar' );
