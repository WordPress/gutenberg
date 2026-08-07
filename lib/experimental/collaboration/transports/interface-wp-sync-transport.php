<?php
/**
 * WP_Sync_Transport interface
 *
 * @package gutenberg
 */

if ( ! interface_exists( 'WP_Sync_Transport' ) ) {

	/**
	 * Contract for a collaborative-editing TRANSPORT — the layer that moves
	 * opaque update payloads between clients and the server. A transport owns
	 * connection shape, routes/endpoints, authentication, and delivery
	 * timing; it never interprets update data, which belongs to the room's
	 * WP_Sync_Engine. Engines and transports are therefore independently
	 * swappable.
	 *
	 * Each transport lives in its own sibling class under `transports/` and is
	 * registered by slug in WP_Sync_Transport_Registry. A single site config
	 * value (see `wp_get_collaboration_transport()`) selects the ACTIVE
	 * transport; the client negotiates against the announced list.
	 *
	 * @since 7.2.0
	 */
	interface WP_Sync_Transport {
		/**
		 * A short, stable machine slug identifying the transport on the wire
		 * (e.g. 'http-polling'). Must match the client transport registration.
		 *
		 * @since 7.2.0
		 *
		 * @return string Transport slug.
		 */
		public function get_slug(): string;

		/**
		 * The transport protocol version. Bumped only on a breaking change to
		 * the transport's wire framing; the client refuses a transport whose
		 * announced protocol it does not implement.
		 *
		 * @since 7.2.0
		 *
		 * @return int Protocol version.
		 */
		public function get_protocol_version(): int;

		/**
		 * Registers whatever REST routes (or other request-time endpoints)
		 * the transport needs. Called on `rest_api_init` for every registered
		 * transport, so a client can reach any of them; the announcement
		 * decides which one clients actually use. Out-of-band transports
		 * (e.g. a WebSocket daemon) may register only an auxiliary endpoint,
		 * or nothing.
		 *
		 * @since 7.2.0
		 *
		 * @return void
		 */
		public function register_routes(): void;
	}
}
