<?php
/**
 * WP_WebSocket_Token_Controller class
 *
 * @package gutenberg
 */

if ( ! class_exists( 'WP_WebSocket_Token_Controller' ) ) {

	/**
	 * Mints one-time, short-lived tokens used to authenticate WebSocket
	 * connections for the 'php-websocket' collaboration transport.
	 *
	 * The browser cannot attach custom headers to a WebSocket handshake, so
	 * the client requests a token over the (cookie- and nonce-authenticated)
	 * REST API and passes it as a query parameter on the WebSocket URL. The
	 * WebSocket server consumes the token (single use) and requires that the
	 * token's user matches the user authenticated by the logged_in cookie.
	 *
	 * @since 7.4.0
	 * @access private
	 */
	class WP_WebSocket_Token_Controller {
		/**
		 * REST API namespace.
		 *
		 * @since 7.4.0
		 * @var string
		 */
		const REST_NAMESPACE = 'wp-sync/v1';

		/**
		 * Transient prefix for stored tokens.
		 *
		 * @since 7.4.0
		 * @var string
		 */
		const TOKEN_TRANSIENT_PREFIX = 'wp_sync_ws_token_';

		/**
		 * Token time-to-live in seconds.
		 *
		 * @since 7.4.0
		 * @var int
		 */
		const TOKEN_TTL = 2 * MINUTE_IN_SECONDS;

		/**
		 * Registers REST API routes.
		 *
		 * @since 7.4.0
		 */
		public function register_routes(): void {
			register_rest_route(
				self::REST_NAMESPACE,
				'/ws-token',
				array(
					'methods'             => array( WP_REST_Server::CREATABLE ),
					'callback'            => array( $this, 'handle_request' ),
					'permission_callback' => array( $this, 'check_permissions' ),
				)
			);
		}

		/**
		 * Checks if the current user may request a WebSocket token.
		 *
		 * @since 7.4.0
		 *
		 * @return bool|WP_Error True if user has permission, otherwise WP_Error.
		 */
		public function check_permissions() {
			if ( ! current_user_can( 'edit_posts' ) ) {
				return new WP_Error(
					'rest_cannot_edit',
					__( 'You do not have permission to perform this action', 'gutenberg' ),
					array( 'status' => rest_authorization_required_code() )
				);
			}

			return true;
		}

		/**
		 * Mints a one-time token bound to the current user.
		 *
		 * @since 7.4.0
		 *
		 * @return WP_REST_Response Response containing the token.
		 */
		public function handle_request(): WP_REST_Response {
			$token = bin2hex( random_bytes( 32 ) );

			set_transient( self::TOKEN_TRANSIENT_PREFIX . $token, get_current_user_id(), self::TOKEN_TTL );

			return new WP_REST_Response(
				array(
					'expires_in' => self::TOKEN_TTL,
					'token'      => $token,
				),
				200
			);
		}

		/**
		 * Consumes a token, deleting it so it cannot be reused.
		 *
		 * @since 7.4.0
		 *
		 * @param string $token Token to consume.
		 * @return int|null User ID the token was minted for, or null if invalid.
		 */
		public static function consume_token( string $token ): ?int {
			if ( '' === $token || strlen( $token ) > 64 || ! ctype_xdigit( $token ) ) {
				return null;
			}

			$transient_key = self::TOKEN_TRANSIENT_PREFIX . $token;
			$user_id       = get_transient( $transient_key );

			if ( false === $user_id ) {
				return null;
			}

			delete_transient( $transient_key );

			$user_id = (int) $user_id;

			return $user_id > 0 ? $user_id : null;
		}
	}
}
