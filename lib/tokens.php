<?php
/**
 * Token functions specific for the Gutenberg editor plugin.
 *
 * @package gutenberg
 */


function register_token( $namespace, $name, $replacer, $priority = 10 ) {
	add_filter(
		'render_token',
		function ( $rendered, $token ) use ( $namespace, $name, $replacer ) {
			if ( ! ( $namespace === $token->namespace && $name === $token->name ) ) {
				return $rendered;
			}

			return call_user_func( $replacer, $rendered, $token );
		},
		$priority,
		2
	);
}


function tokens_token_replacer( $token ) {
	return apply_filters( 'render_token', $token->fallback, $token );
}


function tokens_swap_tokens( $text ) {
	return WP_Token_parser::swap_tokens( 'tokens_token_replacer', $text );
}


function tokens_init() {
	require_once __DIR__ . '/../packages/tokens/token-parser.php';

	add_filter( 'the_content', 'tokens_swap_tokens', 1, 1000 );

	register_token( 'core', 'echo', function ( $rendered, $token ) { return $token->value; } );
	register_token( 'core', 'featured-image', function ( $rendered, $token ) { return get_the_post_thumbnail_url(); } );
	register_token( 'core', 'plugins-url', function ( $rendered, $token ) { return plugins_url(); } );
}

add_action( 'init', 'tokens_init' );
