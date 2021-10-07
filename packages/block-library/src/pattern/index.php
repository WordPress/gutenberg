<?php

function register_block_core_pattern() {
	register_block_type_from_metadata(
		__DIR__ . '/pattern',
		array(
			'render_callback' => 'render_block_core_pattern',
		)
	);
}

function render_block_core_pattern( $attributes ) {
	$slug = $attributes['slug'];
	if ( class_exists( 'WP_Block_Patterns_Registry' ) && WP_Block_Patterns_Registry::get_instance()->is_registered( $slug ) ) {
		$pattern = WP_Block_Patterns_Registry::get_instance()->get_registered( $slug );
		return do_blocks( $pattern['content'] );

	}
}

add_action( 'init', 'register_block_core_pattern' );
