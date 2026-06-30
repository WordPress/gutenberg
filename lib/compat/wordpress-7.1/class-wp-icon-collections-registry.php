<?php

if ( ! class_exists( 'WP_Icon_Collections_Registry' ) ) {
	class WP_Icon_Collections_Registry {
		/**
		 * Registered icon collections array.
		 *
		 * @var array[]
		 */
		protected $registered_collections = array();

		/**
		 * Container for the main instance of the class.
		 *
		 * @var WP_Icon_Collections_Registry|null
		 */
		protected static $instance = null;

		/**
		 * Registers an icon collection.
		 *
		 * @param string $collection_slug       Icon collection slug.
		 * @param array  $collection_properties {
		 *     List of properties for the icon collection.
		 *
		 *     @type string $label       Required. A human-readable label for the icon collection.
		 *     @type string $description Optional. A human-readable description for the icon collection.
		 * }
		 * @return bool True if the collection was registered with success and false otherwise.
		 */
		public function register( $collection_slug, $collection_properties ) {
			if ( ! isset( $collection_slug ) || ! is_string( $collection_slug ) ) {
				_doing_it_wrong(
					__METHOD__,
					__( 'Icon collection slug must be a string.', 'gutenberg' ),
					'7.1.0'
				);
				return false;
			}

			if ( ! preg_match( '/^[a-z0-9-]+$/', $collection_slug ) ) {
				_doing_it_wrong(
					__METHOD__,
					__( 'Icon collection slug must only contain lowercase alphanumeric characters and hyphens.', 'gutenberg' ),
					'7.1.0'
				);
				return false;
			}

			if ( $this->is_registered( $collection_slug ) ) {
				_doing_it_wrong(
					__METHOD__,
					__( 'Icon collection is already registered.', 'gutenberg' ),
					'7.1.0'
				);
				return false;
			}

			if ( ! is_array( $collection_properties ) ) {
				_doing_it_wrong(
					__METHOD__,
					__( 'Icon collection properties must be an array.', 'gutenberg' ),
					'7.1.0'
				);
				return false;
			}

			$allowed_keys = array( 'label', 'description' );
			foreach ( array_keys( $collection_properties ) as $key ) {
				if ( ! in_array( $key, $allowed_keys, true ) ) {
					_doing_it_wrong(
						__METHOD__,
						sprintf(
							/* translators: %s is the name of any user-provided key */
							__( 'Invalid icon collection property: "%s".', 'gutenberg' ),
							$key
						),
						'7.1.0'
					);
					return false;
				}
			}

			if ( ! isset( $collection_properties['label'] ) || ! is_string( $collection_properties['label'] ) ) {
				_doing_it_wrong(
					__METHOD__,
					__( 'Icon collection label must be a string.', 'gutenberg' ),
					'7.1.0'
				);
				return false;
			}

			$defaults = array(
				'description' => '',
			);

			$collection = array_merge(
				$defaults,
				$collection_properties,
				array( 'slug' => $collection_slug )
			);

			$this->registered_collections[ $collection_slug ] = $collection;

			return true;
		}

		/**
		 * Unregisters an icon collection.
		 *
		 * Any icons registered under the given collection are also unregistered.
		 *
		 * @param string $collection_slug Icon collection slug.
		 * @return bool True if the collection was unregistered with success and false otherwise.
		 */
		public function unregister( $collection_slug ) {
			if ( ! $this->is_registered( $collection_slug ) ) {
				_doing_it_wrong(
					__METHOD__,
					sprintf(
						/* translators: %s: Icon collection slug. */
						__( 'Icon collection "%s" not found.', 'gutenberg' ),
						$collection_slug
					),
					'7.1.0'
				);
				return false;
			}

			$icons_registry = WP_Icons_Registry_Gutenberg::get_instance();
			foreach ( $icons_registry->get_registered_icons() as $icon ) {
				if ( isset( $icon['collection'] ) && $icon['collection'] === $collection_slug ) {
					$icons_registry->unregister( $icon['name'] );
				}
			}

			unset( $this->registered_collections[ $collection_slug ] );

			return true;
		}

		/**
		 * Retrieves an array containing the properties of a registered icon collection.
		 *
		 * @param string $collection_slug Icon collection slug.
		 * @return array|null Registered collection properties, or `null` if the collection is not registered.
		 */
		public function get_registered( $collection_slug ) {
			if ( ! $this->is_registered( $collection_slug ) ) {
				return null;
			}

			return $this->registered_collections[ $collection_slug ];
		}

		/**
		 * Retrieves all registered icon collections.
		 *
		 * @return array[] Array of arrays containing the registered icon collections properties.
		 */
		public function get_all_registered() {
			return array_values( $this->registered_collections );
		}

		/**
		 * Checks if an icon collection is registered.
		 *
		 * @param string|null $collection_slug Icon collection slug.
		 * @return bool True if the icon collection is registered, false otherwise.
		 */
		public function is_registered( $collection_slug ) {
			return isset( $collection_slug, $this->registered_collections[ $collection_slug ] );
		}

		/**
		 * Utility method to retrieve the main instance of the class.
		 *
		 * The instance will be created if it does not exist yet.
		 *
		 * @return WP_Icon_Collections_Registry The main instance.
		 */
		public static function get_instance() {
			if ( null === self::$instance ) {
				self::$instance = new self();
			}

			return self::$instance;
		}
	}
}
