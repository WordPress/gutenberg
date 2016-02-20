<?php
function call_some_i18n_methods() {
	__( 'Hello World' );
	_e( 'Hello World' );
	_n( 'Single', 'Plural', 1 );
	_n_noop( 'Single Noop', 'Plural Noop', 1 );
	_x( 'Hello World', 'Testing' );
	_ex( 'Hello World', 'Testing' );
	_nx( 'Hello World', 'Testing' );
	_nx_noop( 'Hello World Noop', 'Testing' );
	esc_attr__( 'Attribute' );
	esc_html__( 'HTML' );
	esc_attr_e( 'Attribute' );
	esc_html_e( 'HTML' );
	esc_attr_x( 'Attribute', 'Testing' );
	esc_html_x( 'HTML', 'Testing' );
	translate_nooped_plural( 'Plural Noop', 2 );
}
