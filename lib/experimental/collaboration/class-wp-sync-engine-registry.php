<?php
/**
 * WP_Sync_Engine_Registry class
 *
 * @package gutenberg
 */

if ( ! class_exists( 'WP_Sync_Engine_Registry' ) ) {

	/**
	 * Registry of available sync engines and the site's engine selection.
	 *
	 * Engines register here; transports resolve the engine for each room
	 * through here. Swapping engines is a configuration change (the
	 * `wp_sync_engine` option or the `wp_sync_engine_for_room` filter), never
	 * a transport change.
	 *
	 * @since 7.2.0
	 * @access private
	 */
	class WP_Sync_Engine_Registry {
		/**
		 * Conventional default engine slug (used when the `wp_sync_engine`
		 * option is unset). Only takes effect if a plugin has registered an
		 * engine by this slug; otherwise the registry falls back to the
		 * first registered engine, or stays empty (RTC disabled) when no
		 * engine plugin is active.
		 *
		 * @since 7.2.0
		 * @var string
		 */
		const DEFAULT_ENGINE = 'intent-log';

		/**
		 * Registered engines by slug.
		 *
		 * @since 7.2.0
		 * @var array<string, WP_Sync_Engine>
		 */
		private array $engines = array();

		/**
		 * Constructor. Registers built-in engines, then lets plugins register
		 * theirs.
		 *
		 * @since 7.2.0
		 *
		 * @param WP_Sync_Storage $storage Storage backend engines should use.
		 */
		public function __construct( WP_Sync_Storage $storage ) {
			/**
			 * Filters the registered sync engines.
			 *
			 * The framework ships NO engines of its own: a plugin (e.g.
			 * Gutenberg Sync Engines) supplies them here. With none registered
			 * the registry is empty, so real-time collaboration finds no
			 * engine to negotiate and degrades to the classic post lock.
			 *
			 * Return an array of WP_Sync_Engine instances. Keys are ignored;
			 * engines are indexed by their slug.
			 *
			 * @since 7.2.0
			 *
			 * @param WP_Sync_Engine[] $engines Engines to register.
			 * @param WP_Sync_Storage  $storage Storage backend engines should use.
			 */
			$extra_engines = apply_filters( 'wp_sync_engines', array(), $storage );
			if ( is_array( $extra_engines ) ) {
				foreach ( $extra_engines as $engine ) {
					if ( $engine instanceof WP_Sync_Engine ) {
						$this->register( $engine );
					}
				}
			}
		}

		/**
		 * Registers an engine, indexed by its slug.
		 *
		 * @since 7.2.0
		 *
		 * @param WP_Sync_Engine $engine Engine instance.
		 */
		public function register( WP_Sync_Engine $engine ): void {
			$this->engines[ $engine->get_slug() ] = $engine;
		}

		/**
		 * Returns a registered engine by slug.
		 *
		 * @since 7.2.0
		 *
		 * @param string $slug Engine slug.
		 * @return WP_Sync_Engine|null Engine, or null if not registered.
		 */
		public function get_engine( string $slug ): ?WP_Sync_Engine {
			return $this->engines[ $slug ] ?? null;
		}

		/**
		 * Returns the configured engine slug for a room.
		 *
		 * Site-wide selection via the `wp_sync_engine` option, overridable per
		 * room with the `wp_sync_engine_for_room` filter. Falls back to the
		 * default engine when the configured slug is not registered, so a
		 * misconfiguration degrades to working defaults instead of a broken
		 * site.
		 *
		 * @since 7.2.0
		 *
		 * @param string $room Room identifier.
		 * @return string Engine slug (always a registered engine).
		 */
		public function get_engine_slug_for_room( string $room ): string {
			$slug = get_option( 'wp_sync_engine', self::DEFAULT_ENGINE );
			if ( ! is_string( $slug ) || '' === $slug ) {
				$slug = self::DEFAULT_ENGINE;
			}

			/**
			 * Filters the sync engine slug used for a room.
			 *
			 * @since 7.2.0
			 *
			 * @param string $slug Engine slug.
			 * @param string $room Room identifier.
			 */
			$slug = apply_filters( 'wp_sync_engine_for_room', $slug, $room );

			if ( isset( $this->engines[ $slug ] ) ) {
				return $slug;
			}

			// Configured engine not registered: fall back to any registered
			// engine so a misconfiguration still works, or '' when the
			// registry is empty (no engine plugin active → RTC disabled).
			$slugs = array_keys( $this->engines );
			return $slugs[0] ?? '';
		}

		/**
		 * The slugs of all registered engines.
		 *
		 * @since 7.2.0
		 *
		 * @return string[] Registered engine slugs.
		 */
		public function get_engine_slugs(): array {
			return array_keys( $this->engines );
		}

		/**
		 * Returns the engine instance for a room, or null when no engine is
		 * registered (no engine plugin active).
		 *
		 * @since 7.2.0
		 *
		 * @param string $room Room identifier.
		 * @return WP_Sync_Engine|null Engine instance, or null.
		 */
		public function get_engine_for_room( string $room ): ?WP_Sync_Engine {
			$slug = $this->get_engine_slug_for_room( $room );
			return '' !== $slug ? $this->engines[ $slug ] : null;
		}

		/**
		 * Returns the update types accepted by any registered engine.
		 *
		 * Used to build the transport request schema. Individual engines
		 * still reject types they do not handle.
		 *
		 * @since 7.2.0
		 *
		 * @return string[] Union of accepted update types.
		 */
		public function get_all_update_types(): array {
			$types = array();
			foreach ( $this->engines as $engine ) {
				$types = array_merge( $types, $engine->get_update_types() );
			}

			return array_values( array_unique( $types ) );
		}
	}
}
