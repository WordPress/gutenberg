<?php
/**
 * WP_Sync_Server_CLI_Command class
 *
 * @package gutenberg
 */

if ( ! class_exists( 'WP_Sync_Server_CLI_Command' ) && defined( 'WP_CLI' ) && WP_CLI ) {

	/**
	 * WP-CLI commands for the experimental collaboration sync server.
	 *
	 * @since 7.4.0
	 * @access private
	 */
	class WP_Sync_Server_CLI_Command {
		/**
		 * Starts the experimental PHP WebSocket sync server.
		 *
		 * EXPERIMENTAL. This server speaks plain ws:// and must be run behind
		 * TLS termination (wss://) in production. The one-time authentication
		 * token travels as a URL query parameter on the WebSocket handshake,
		 * so without TLS it is visible to any on-path observer and may be
		 * recorded by intermediaries. It is intended for evaluating the
		 * 'php-websocket' collaboration transport.
		 *
		 * ## OPTIONS
		 *
		 * [--host=<host>]
		 * : Host or IP address to bind.
		 * ---
		 * default: 127.0.0.1
		 * ---
		 *
		 * [--port=<port>]
		 * : TCP port to bind.
		 * ---
		 * default: 8787
		 * ---
		 *
		 * ## EXAMPLES
		 *
		 *     wp collaboration sync-server --host=127.0.0.1 --port=8787
		 *
		 * @since 7.4.0
		 *
		 * @param array $args       Positional arguments (unused).
		 * @param array $assoc_args Associative arguments.
		 */
		public function sync_server( $args, $assoc_args ) {
			if ( ! function_exists( 'wp_is_collaboration_allowed' ) || ! wp_is_collaboration_allowed() ) {
				WP_CLI::error( 'Real-time collaboration is not allowed on this site (WP_ALLOW_COLLABORATION).' );
			}

			$host = isset( $assoc_args['host'] ) ? (string) $assoc_args['host'] : '127.0.0.1';
			$port = isset( $assoc_args['port'] ) ? (int) $assoc_args['port'] : 8787;

			if ( $port < 1 || $port > 65535 ) {
				WP_CLI::error( 'Invalid port.' );
			}

			$storage = new WP_Sync_Post_Meta_Storage();
			$sync    = new WP_HTTP_Polling_Sync_Server( $storage );
			$server  = new WP_WebSocket_Sync_Server( $sync, $host, $port );

			WP_CLI::log( 'Starting experimental collaboration WebSocket sync server. Press Ctrl+C to stop.' );

			$result = $server->run();

			if ( is_wp_error( $result ) ) {
				WP_CLI::error( $result->get_error_message() );
			}
		}
	}

	WP_CLI::add_command( 'collaboration sync-server', array( new WP_Sync_Server_CLI_Command(), 'sync_server' ) );
}
