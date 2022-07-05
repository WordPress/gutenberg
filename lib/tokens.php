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


function tokens_core_replacer( $rendered, $token ) {
	global $post_id;

	if ( 'core' !== $token->namespace ) {
		return $rendered;
	}

	switch ( $token->name ) {
		case 'featured-image':
			return get_the_post_thumbnail_url();

		case 'permalink':
			$permalink = get_permalink( is_int( $token->value ) ? $token->value : $post_id );

			return false !== $permalink ? $permalink : '';

		case 'plugins_url':
			return plugins_url();

		default:
			return $token->fallback;
	}
}


function tokens_token_replacer( $token ) {
	return apply_filters( 'render_token', $token->fallback, $token );
}


function tokens_swap_tokens( $text ) {
	return WP_Token_parser::swap_tokens( 'tokens_token_replacer', $text );
}


function tokens_init() {
	require_once __DIR__ . '/../packages/tokens/token-parser.php';

	add_filter( 'render_token', 'tokens_core_replacer', 2, 10 );
	add_filter( 'the_content', 'tokens_swap_tokens', 1, 1000 );
}

add_action( 'init', 'tokens_init' );
