<?php
/**
 * WP_WebSocket_Sync_Transport class
 *
 * @package gutenberg
 */

if ( ! class_exists( 'WP_WebSocket_Sync_Transport' ) ) {

	/**
	 * The WebSocket transport's WEB-PROCESS half: the part that runs on
	 * ordinary requests. It registers the one-time token endpoint the browser
	 * needs to open a socket and reports the socket URL for the client
	 * announcement. The socket itself is served by a separate long-running
	 * daemon (WP_WebSocket_Sync_Server, started via
	 * `wp collaboration sync-server`), which drives rooms through the same
	 * engine seam as the REST transports.
	 *
	 * Because the transport is out-of-band, it registers no /updates-style
	 * route — only the auxiliary token route. Selecting it (the single config
	 * value = 'websocket') announces the socket URL to the client, which then
	 * connects to the daemon.
	 *
	 * @since 7.2.0
	 * @access private
	 */
	class WP_WebSocket_Sync_Transport implements WP_Sync_Transport {
		/**
		 * Transport slug (matches the client provider registration).
		 *
		 * @since 7.2.0
		 * @var string
		 */
		const TRANSPORT_SLUG = 'websocket';

		/**
		 * Transport protocol version.
		 *
		 * @since 7.2.0
		 * @var int
		 */
		const TRANSPORT_PROTOCOL = 1;

		/**
		 * The token REST controller.
		 *
		 * @since 7.2.0
		 * @var WP_WebSocket_Token_Controller
		 */
		private WP_WebSocket_Token_Controller $token_controller;

		/**
		 * Constructor. Storage and the engine registry are accepted for a
		 * uniform transport signature; the socket daemon (not this web-process
		 * half) drives them.
		 *
		 * @since 7.2.0
		 *
		 * @param WP_Sync_Storage         $storage Storage backend (unused here).
		 * @param WP_Sync_Engine_Registry $engines Engine registry (unused here).
		 */
		public function __construct( WP_Sync_Storage $storage, WP_Sync_Engine_Registry $engines ) {
			unset( $storage, $engines );
			$this->token_controller = new WP_WebSocket_Token_Controller();
		}

		/**
		 * The transport slug.
		 *
		 * @since 7.2.0
		 *
		 * @return string Slug.
		 */
		public function get_slug(): string {
			return self::TRANSPORT_SLUG;
		}

		/**
		 * The transport protocol version.
		 *
		 * @since 7.2.0
		 *
		 * @return int Protocol version.
		 */
		public function get_protocol_version(): int {
			return self::TRANSPORT_PROTOCOL;
		}

		/**
		 * Registers the one-time WebSocket token endpoint.
		 *
		 * @since 7.2.0
		 *
		 * @return void
		 */
		public function register_routes(): void {
			$this->token_controller->register_routes();
		}

		/**
		 * The socket URL the client should connect to. Defaults to a
		 * `ws://` URL on the configured host/port; filter
		 * `wp_sync_websocket_url` to point at a `wss://` termination in
		 * production.
		 *
		 * @since 7.2.0
		 *
		 * @return string WebSocket URL.
		 */
		public static function get_socket_url(): string {
			$host = defined( 'WP_SYNC_WEBSOCKET_HOST' ) ? (string) WP_SYNC_WEBSOCKET_HOST : '127.0.0.1';
			$port = defined( 'WP_SYNC_WEBSOCKET_PORT' ) ? (int) WP_SYNC_WEBSOCKET_PORT : 8787;
			$url  = sprintf( 'ws://%s:%d', $host, $port );

			/**
			 * Filters the WebSocket URL announced to clients. Production
			 * deployments MUST terminate TLS and return a `wss://` URL.
			 *
			 * @since 7.2.0
			 *
			 * @param string $url WebSocket URL.
			 */
			return (string) apply_filters( 'wp_sync_websocket_url', $url );
		}
	}
}
