<?php
/**
 * Icon Collections: WP_Icon_Collections_Registry_Gutenberg class
 *
 * Changes to this class should be synced to the corresponding class
 * in WordPress core: src/wp-includes/class-wp-icon-collections-registry.php.
 *
 * @package gutenberg
 */

/**
 * Icon collections registry that reserves the `_builtin` collection for the
 * icons WordPress itself renders, so that they cannot be unregistered.
 */
class WP_Icon_Collections_Registry_Gutenberg extends WP_Icon_Collections_Registry {
	/**
	 * Registers an icon collection.
	 *
	 * Extends the base registry with support for the reserved `_builtin` slug.
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
		if ( '_builtin' !== $collection_slug ) {
			return parent::register( $collection_slug, $collection_properties );
		}

		if ( $this->is_registered( $collection_slug ) ) {
			_doing_it_wrong(
				__METHOD__,
				__( 'Icon collection is already registered.', 'gutenberg' ),
				'7.2.0'
			);
			return false;
		}

		if (
			! is_array( $collection_properties )
			|| ! isset( $collection_properties['label'] )
			|| ! is_string( $collection_properties['label'] )
		) {
			_doing_it_wrong(
				__METHOD__,
				__( 'Icon collection label must be a string.', 'gutenberg' ),
				'7.2.0'
			);
			return false;
		}

		$description = $collection_properties['description'] ?? '';

		$this->registered_collections[ $collection_slug ] = array(
			'slug'        => $collection_slug,
			'label'       => $collection_properties['label'],
			'description' => is_string( $description ) ? $description : '',
		);

		return true;
	}

	/**
	 * Unregisters an icon collection, except the built-in one.
	 *
	 * @param string $collection_slug Icon collection slug.
	 * @return bool True if the collection was unregistered with success and false otherwise.
	 */
	public function unregister( $collection_slug ) {
		if ( '_builtin' === $collection_slug ) {
			_doing_it_wrong(
				__METHOD__,
				sprintf(
					/* translators: %s: Icon collection slug. */
					__( 'The "%s" icon collection is used by WordPress and cannot be unregistered.', 'gutenberg' ),
					$collection_slug
				),
				'7.2.0'
			);
			return false;
		}

		return parent::unregister( $collection_slug );
	}

	/**
	 * Returns the shared registry instance.
	 *
	 * The base `$instance` slot is intentionally not redefined, so both
	 * `WP_Icon_Collections_Registry::get_instance()` (used by core) and this
	 * method share one instance. An existing base registry is upgraded,
	 * replaying the collections it holds so they are not lost.
	 *
	 * @return WP_Icon_Collections_Registry_Gutenberg The main instance.
	 */
	public static function get_instance() {
		if ( ! self::$instance instanceof self ) {
			$original_registry  = self::$instance;
			$gutenberg_registry = new self();

			if ( null !== $original_registry ) {
				foreach ( $original_registry->get_all_registered() as $collection ) {
					$gutenberg_registry->register(
						$collection['slug'],
						array(
							'label'       => $collection['label'],
							'description' => $collection['description'] ?? '',
						)
					);
				}
			}

			self::$instance = $gutenberg_registry;
		}

		return self::$instance;
	}
}

/**
 * Overrides the base `WP_Icon_Collections_Registry` singleton with the Gutenberg
 * registry so that all code using `WP_Icon_Collections_Registry::{method_name}()`
 * receives it.
 */
function gutenberg_override_wp_icon_collections_registry() {
	WP_Icon_Collections_Registry_Gutenberg::get_instance();
}
add_action( 'init', 'gutenberg_override_wp_icon_collections_registry', 0 );
