<?php
/**
 * Plugin Name: Gutenberg Test Content Security Policy
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * Sends a Content Security Policy that allows neither 'unsafe-eval' nor
 * 'wasm-unsafe-eval' when the `csp` query parameter is `nonce` or `allowlist`.
 * The nonce policy relies on the filters that WordPress provides to add the
 * nonce to the scripts it prints.
 *
 * @package gutenberg-test-content-security-policy
 */

add_action(
	'init',
	static function () {
		$name = isset( $_GET['csp'] ) && is_string( $_GET['csp'] ) ? sanitize_key( wp_unslash( $_GET['csp'] ) ) : '';

		if ( 'nonce' === $name ) {
			$nonce      = base64_encode( random_bytes( 16 ) );
			$script_src = "'nonce-$nonce' 'strict-dynamic'";

			$add_nonce = static function ( $attributes ) use ( $nonce ) {
				$attributes['nonce'] = $nonce;
				return $attributes;
			};
			add_filter( 'wp_script_attributes', $add_nonce );
			add_filter( 'wp_inline_script_attributes', $add_nonce );
		} elseif ( 'allowlist' === $name ) {
			$script_src = "'self' 'unsafe-inline' blob:";
		} else {
			return;
		}

		add_action(
			'send_headers',
			static function () use ( $script_src ) {
				header( "Content-Security-Policy: script-src $script_src; object-src 'none'; base-uri 'none'" );
			}
		);
	}
);
