<?php
/**
 * Initialization and wp-admin integration for the Gutenberg editor plugin.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

function gutenberg_output_block_widget( $options, $block ) {
	echo $options['before_widget'];
	echo render_block( $block );
	echo $options['after_widget'];
}

function gutenberg_swap_out_sidebars_blocks_for_block_widgets( $sidebars_items ) {
	global $wp_registered_widgets;

	foreach ( $sidebars_items as $sidebar_id => $items ) {
		foreach ( $items as $index => $item ) {
			if ( ! is_array( $item ) || ! isset( $item['blockName'] ) ) {
				continue;
			}

			$widget_id = 'block-widget-' . md5( serialize( $item ) );

			$sidebars_items[ $sidebar_id ][ $index ] = $widget_id;

			if ( isset( $wp_registered_widgets[ $widget_id ] ) ) {
				continue;
			}

			wp_register_sidebar_widget(
				$widget_id,
				// TODO: Can we get the block's title somehow?
				/* translators: %s: Name of the block */
				sprintf( __( 'Block: %s', 'gutenberg' ), $item['blockName'] ),
				'gutenberg_output_block_widget',
				array(
					'classname'   => 'block-widget',
					'description' => sprintf(
						/* translators: %s: Name of the block */
						__( 'Displays a ‘%s’ block.', 'gutenberg' ),
						$item['blockName']
					),
				),
				$item
			);
		}
	}

	return $sidebars_items;
}
add_filter( 'sidebars_widgets', 'gutenberg_swap_out_sidebars_blocks_for_block_widgets' );

function gutenberg_swap_out_sidebars_block_widgets_for_blocks( $sidebars_widgets ) {
	global $wp_registered_widgets;

	foreach ( $sidebars_widgets as $sidebar_id => $widgets ) {
		foreach ( $widgets as $index => $widget_id ) {
			if ( 0 !== strpos( $widget_id, 'block-widget-' ) ) {
				continue;
			}

			if ( ! isset( $wp_registered_widgets[ $widget_id ] ) ) {
				unset( $sidebars_widgets[ $sidebar_id ][ $index ] );
				continue;
			}

			$block = $wp_registered_widgets[ $widget_id ]['params'][0];

			$sidebars_widgets[ $sidebar_id ][ $index ] = $block;
		}
	}

	return $sidebars_widgets;
}
add_filter( 'pre_update_option_sidebars_widgets', 'gutenberg_swap_out_sidebars_block_widgets_for_blocks' );

function gutenberg_get_sidebars_items() {
	remove_filter( 'sidebars_widgets', 'gutenberg_swap_out_sidebars_blocks_for_block_widgets' );
	$sidebars_widgets = wp_get_sidebars_widgets();
	add_filter( 'sidebars_widgets', 'gutenberg_swap_out_sidebars_blocks_for_block_widgets' );
	return $sidebars_widgets;
}

function gutenberg_set_sidebars_items( $sidebars_items ) {
	remove_filter( 'pre_update_option_sidebars_widgets', 'gutenberg_swap_out_sidebars_block_widgets_for_blocks' );
	wp_set_sidebars_widgets( $sidebars_items );
	add_filter( 'pre_update_option_sidebars_widgets', 'gutenberg_swap_out_sidebars_block_widgets_for_blocks' );
}
