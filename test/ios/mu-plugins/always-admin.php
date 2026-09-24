<?php
/**
 * Every request runs as the admin, with no login and no browser cookie.
 *
 * The admin screens and the REST API validate the auth cookies themselves,
 * so the cookies are put into the request before WordPress reads them. The
 * session behind them is created once and kept in an option.
 */
add_action(
	'plugins_loaded',
	function () {
		if ( ! empty( $_COOKIE[ LOGGED_IN_COOKIE ] ) ) {
			return;
		}
		$expiration = time() + YEAR_IN_SECONDS;
		$sessions   = WP_Session_Tokens::get_instance( 1 );
		$token      = get_option( 'always_admin_token' );
		if ( ! $token || ! $sessions->verify( $token ) ) {
			$token = $sessions->create( $expiration );
			update_option( 'always_admin_token', $token );
		}
		foreach ( array(
			AUTH_COOKIE        => 'auth',
			SECURE_AUTH_COOKIE => 'secure_auth',
			LOGGED_IN_COOKIE   => 'logged_in',
		) as $name => $scheme ) {
			$_COOKIE[ $name ] = wp_generate_auth_cookie( 1, $expiration, $scheme, $token );
		}
	},
	0
);
