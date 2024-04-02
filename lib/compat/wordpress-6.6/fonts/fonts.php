<?php

function gutenberg_register_font_post_type_args( $arg, $post_type ) {
	if ( 'wp_font_face' === $post_type ) {
		$arg['rest_controller_class'] = 'Gutenberg_REST_Font_Faces_Controller';
	}

	return $arg;
}
add_filter( 'register_post_type_args', 'gutenberg_register_font_post_type_args', 10, 2 );
