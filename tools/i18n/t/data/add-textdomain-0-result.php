<?php
function call_some_i18n_methods() {
	__( 'Hello World', 'test-domain' );
	_e( 'Hello World', 'test-domain' );
	_n( 'Single', 'Plural', 1, 'test-domain' );
	_n_noop( 'Single Noop', 'Plural Noop', 1, 'test-domain' );
	_x( 'Hello World', 'Testing', 'test-domain' );
	_ex( 'Hello World', 'Testing', 'test-domain' );
	_nx( 'Hello World', 'Testing', 'test-domain' );
	_nx_noop( 'Hello World Noop', 'Testing', 'test-domain' );
	esc_attr__( 'Attribute', 'test-domain' );
	esc_html__( 'HTML', 'test-domain' );
	esc_attr_e( 'Attribute', 'test-domain' );
	esc_html_e( 'HTML', 'test-domain' );
	esc_attr_x( 'Attribute', 'Testing', 'test-domain' );
	esc_html_x( 'HTML', 'Testing', 'test-domain' );
	translate_nooped_plural( 'Plural Noop', 2, 'test-domain' );
}
