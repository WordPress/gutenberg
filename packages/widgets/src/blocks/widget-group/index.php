<?php
/**
 * Server-side rendering of the `core/widget-group` block.
 *
 * @package WordPress
 */


function render_block_core_widget_group( $attributes, $content, $block ) {
	global $wp_registered_sidebars, $_sidebar_being_rendered;

	if ( isset( $wp_registered_sidebars[ $_sidebar_being_rendered ] ) ) {
		$before_title = $wp_registered_sidebars[ $_sidebar_being_rendered ]['before_title'];
		$after_title  = $wp_registered_sidebars[ $_sidebar_being_rendered ]['after_title'];
	} else {
		$before_title = '<h2 class="widget-title">';
		$after_title  = '</h2>';
	}

	$html = '';

	if ( ! empty( $attributes['title'] ) ) {
		$html .= $before_title . $attributes['title'] . $after_title;
	}

	$html .= '<div class="wp-widget-group__inner-blocks">';
	foreach ( $block->inner_blocks as $inner_block ) {
		$html .= $inner_block->render();
	}
	$html .= '</div>';

	return $html;
}

/**
 * Registers the 'core/widget-group' block.
 */
function register_block_core_widget_group() {
	register_block_type_from_metadata(
		__DIR__ . '/widget-group',
		array(
			'render_callback' => 'render_block_core_widget_group',
		)
	);
}

add_action( 'init', 'register_block_core_widget_group' );

function note_sidebar_being_rendered( $index ) {
	global $_sidebar_being_rendered;
	$_sidebar_being_rendered = $index;
}
add_action( 'dynamic_sidebar_before', 'note_sidebar_being_rendered' );

function discard_sidebar_being_rendered( $index ) {
	global $_sidebar_being_rendered;
	unset( $_sidebar_being_rendered );
}
add_action( 'dynamic_sidebar_after', 'discard_sidebar_being_rendered' );
