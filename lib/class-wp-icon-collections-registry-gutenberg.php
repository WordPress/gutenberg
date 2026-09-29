<?php
/**
 * Icons API: Gutenberg icon collections registry.
 *
 * @package gutenberg
 */

/**
 * Adds collection visibility to the WordPress icon collections registry.
 *
 * @since 7.2.0
 */
class WP_Icon_Collections_Registry_Gutenberg extends WP_Icon_Collections_Registry {

	/**
	 * Registers an icon collection.
	 *
	 * @param string $collection_slug       Icon collection slug.
	 * @param array  $collection_properties {
	 *     List of properties for the icon collection.
	 *
	 *     @type string $label       Required. A human-readable label for the icon collection.
	 *     @type string $description Optional. A human-readable description for the icon collection.
	 *     @type bool   $public      Optional. Whether the collection and its icons are exposed through
	 *                               the REST API and selectable in the editor's Icon block. Icons in
	 *                               non-public collections remain available via {@see wp_get_icon()}.
	 *                               Default true.
	 * }
	 * @return bool True if the collection was registered successfully, false otherwise.
	 */
	public function register( $collection_slug, $collection_properties ) {
		if ( ! is_array( $collection_properties ) ) {
			return parent::register( $collection_slug, $collection_properties );
		}

		if ( array_key_exists( 'public', $collection_properties ) && ! is_bool( $collection_properties['public'] ) ) {
			_doing_it_wrong(
				__METHOD__,
				__( 'Icon collection public property must be a boolean.', 'gutenberg' ),
				'7.2.0'
			);
			return false;
		}

		$public = $collection_properties['public'] ?? true;
		unset( $collection_properties['public'] );

		if ( ! parent::register( $collection_slug, $collection_properties ) ) {
			return false;
		}

		$this->registered_collections[ $collection_slug ]['public'] = $public;
		return true;
	}

	/**
	 * Returns the shared registry instance, preserving existing collections.
	 *
	 * @return WP_Icon_Collections_Registry_Gutenberg The shared registry instance.
	 */
	public static function get_instance() {
		if ( ! self::$instance instanceof self ) {
			$original_registry  = self::$instance;
			$gutenberg_registry = new self();

			if ( null !== $original_registry ) {
				foreach ( $original_registry->get_all_registered() as $collection ) {
					$slug = $collection['slug'];
					unset( $collection['slug'] );
					$gutenberg_registry->register( $slug, $collection );
				}
			}

			self::$instance = $gutenberg_registry;
		}

		return self::$instance;
	}
}

/**
 * Upgrades the shared collection registry before default collections are registered.
 */
function gutenberg_override_wp_icon_collections_registry() {
	WP_Icon_Collections_Registry_Gutenberg::get_instance();
}
add_action( 'init', 'gutenberg_override_wp_icon_collections_registry', -1 );
