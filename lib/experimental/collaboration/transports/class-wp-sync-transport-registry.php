<?php
/**
 * WP_Sync_Transport_Registry class
 *
 * @package gutenberg
 */

if ( ! class_exists( 'WP_Sync_Transport_Registry' ) ) {

	/**
	 * Registers collaborative-editing transports by slug and decides which
	 * one the server announces as active.
	 *
	 * Mirrors WP_Sync_Engine_Registry: built-in transports register here, a
	 * filter lets plugins add more, and a single site config value picks the
	 * active one. Adding a transport is a matter of dropping a sibling class
	 * under `transports/` and registering it — selection code never changes.
	 *
	 * @since 7.2.0
	 * @access private
	 */
	class WP_Sync_Transport_Registry {
		/**
		 * Registered transports, keyed by slug (insertion order preserved).
		 *
		 * @since 7.2.0
		 * @var array<string, WP_Sync_Transport>
		 */
		private array $transports = array();

		/**
		 * Constructor. Registers the built-in transports, then lets plugins
		 * register more via the `wp_sync_transports` filter.
		 *
		 * @since 7.2.0
		 *
		 * @param WP_Sync_Storage         $storage Storage backend.
		 * @param WP_Sync_Engine_Registry $engines Engine registry the
		 *                                         transports drive rooms through.
		 */
		public function __construct( WP_Sync_Storage $storage, WP_Sync_Engine_Registry $engines ) {
			/**
			 * Filters the registered sync transports.
			 *
			 * The framework ships NO transports of its own: a plugin (e.g.
			 * Gutenberg Sync Engines) supplies them here. With none registered
			 * a session has no transport to negotiate and degrades to the
			 * classic post lock.
			 *
			 * Return an array of WP_Sync_Transport instances.
			 *
			 * @since 7.2.0
			 *
			 * @param WP_Sync_Transport[]     $transports Transports to register.
			 * @param WP_Sync_Storage         $storage    Storage backend.
			 * @param WP_Sync_Engine_Registry $engines    Engine registry.
			 */
			$extra = apply_filters( 'wp_sync_transports', array(), $storage, $engines );
			if ( is_array( $extra ) ) {
				foreach ( $extra as $transport ) {
					if ( $transport instanceof WP_Sync_Transport ) {
						$this->register( $transport );
					}
				}
			}
		}

		/**
		 * Registers a transport (last registration of a slug wins).
		 *
		 * @since 7.2.0
		 *
		 * @param WP_Sync_Transport $transport Transport instance.
		 * @return void
		 */
		public function register( WP_Sync_Transport $transport ): void {
			$this->transports[ $transport->get_slug() ] = $transport;
		}

		/**
		 * Returns a registered transport by slug.
		 *
		 * @since 7.2.0
		 *
		 * @param string $slug Transport slug.
		 * @return WP_Sync_Transport|null Transport, or null if not registered.
		 */
		public function get_transport( string $slug ): ?WP_Sync_Transport {
			return $this->transports[ $slug ] ?? null;
		}

		/**
		 * Returns all registered transports.
		 *
		 * @since 7.2.0
		 *
		 * @return array<string, WP_Sync_Transport> Transports keyed by slug.
		 */
		public function get_transports(): array {
			return $this->transports;
		}

		/**
		 * The active transport slug: the configured one when registered,
		 * otherwise any registered transport, or '' when the registry is
		 * empty (no transport plugin active → RTC disabled).
		 *
		 * @since 7.2.0
		 *
		 * @return string Active transport slug, or ''.
		 */
		public function get_active_slug(): string {
			$configured = wp_get_collaboration_transport();
			if ( isset( $this->transports[ $configured ] ) ) {
				return $configured;
			}
			$slugs = array_keys( $this->transports );
			return $slugs[0] ?? '';
		}

		/**
		 * The transport slugs to announce to clients, active FIRST. The
		 * client picks the first announced slug it can provide, so ordering
		 * expresses the server's preference while still degrading to any
		 * mutually-supported transport.
		 *
		 * @since 7.2.0
		 *
		 * @return string[] Ordered transport slugs.
		 */
		public function get_announced_slugs(): array {
			$active = $this->get_active_slug();
			if ( '' === $active ) {
				return array();
			}
			$slugs = array( $active );
			foreach ( array_keys( $this->transports ) as $slug ) {
				if ( $slug !== $active ) {
					$slugs[] = $slug;
				}
			}
			return $slugs;
		}

		/**
		 * Registers the routes of every transport (all are reachable; the
		 * announcement decides which the client uses).
		 *
		 * @since 7.2.0
		 *
		 * @return void
		 */
		public function register_all_routes(): void {
			foreach ( $this->transports as $transport ) {
				$transport->register_routes();
			}
		}
	}
}
