<?php

function register_block_core_sidebar_widget_area() {
	register_block_type_from_metadata(
		__DIR__ . '/sidebar-widget-area',
		array(
			'render_callback' => 'render_block_sidebar_widget_area',
		)
	);
}

function render_block_sidebar_widget_area( $attributes ) {
	ob_start();
	dynamic_sidebar( $attributes['id'] );
	$sidebar = ob_get_contents();
	ob_end_clean();
	return $sidebar;
}

add_action( 'init', 'register_block_core_sidebar_widget_area' );
