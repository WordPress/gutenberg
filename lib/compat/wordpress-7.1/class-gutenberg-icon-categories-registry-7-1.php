<?php

/**
 * WordPress 7.1 icon categories registry compatibility.
 *
 * @package gutenberg
 */

/**
 * Icon categories registry for the WordPress 7.1 compatibility layer.
 */
class Gutenberg_Icon_Categories_Registry_7_1 {
	/**
	 * Registered icon categories.
	 *
	 * @var array[]
	 */
	private $registered_categories = array();

	/**
	 * Container for the main instance of the class.
	 *
	 * @var Gutenberg_Icon_Categories_Registry_7_1|null
	 */
	private static $instance = null;

	/**
	 * Constructor.
	 *
	 * Keep this protected because this class is a singleton.
	 */
	protected function __construct() {}

	/**
	 * Registers an icon category.
	 *
	 * @param string $category_name       Unique category name.
	 * @param array  $category_properties {
	 *     List of category properties.
	 *
	 *     @type string $label       Required. A human-readable label for the category.
	 *     @type string $description Optional. A description for the category.
	 * }
	 * @return bool True on success, false otherwise.
	 */
	public function register( $category_name, $category_properties ) {
		if ( ! is_string( $category_name ) || '' === $category_name ) {
			_doing_it_wrong(
				__METHOD__,
				__( 'Icon category name must be a non-empty string.', 'gutenberg' ),
				'7.1.0'
			);
			return false;
		}

		if ( sanitize_key( $category_name ) !== $category_name ) {
			_doing_it_wrong(
				__METHOD__,
				__( 'Icon category name must contain only lowercase alphanumeric characters, dashes, and underscores.', 'gutenberg' ),
				'7.1.0'
			);
			return false;
		}

		if ( ! is_array( $category_properties ) ) {
			_doing_it_wrong(
				__METHOD__,
				__( 'Icon category properties must be an array.', 'gutenberg' ),
				'7.1.0'
			);
			return false;
		}

		if ( $this->is_registered( $category_name ) ) {
			_doing_it_wrong(
				__METHOD__,
				sprintf(
					/* translators: %s: Icon category name. */
					__( 'Icon category "%s" is already registered.', 'gutenberg' ),
					$category_name
				),
				'7.1.0'
			);
			return false;
		}

		$allowed_keys = array_fill_keys( array( 'label', 'description' ), true );
		foreach ( array_keys( $category_properties ) as $key ) {
			if ( ! isset( $allowed_keys[ $key ] ) ) {
				_doing_it_wrong(
					__METHOD__,
					sprintf(
						/* translators: %s: Invalid icon category property key. */
						__( 'Invalid icon category property: "%s".', 'gutenberg' ),
						$key
					),
					'7.1.0'
				);
				return false;
			}
		}

		if ( ! isset( $category_properties['label'] ) || ! is_string( $category_properties['label'] ) || '' === $category_properties['label'] ) {
			_doing_it_wrong(
				__METHOD__,
				__( 'Icon category label must be a non-empty string.', 'gutenberg' ),
				'7.1.0'
			);
			return false;
		}

		if ( isset( $category_properties['description'] ) && ! is_string( $category_properties['description'] ) ) {
			_doing_it_wrong(
				__METHOD__,
				__( 'Icon category description must be a string.', 'gutenberg' ),
				'7.1.0'
			);
			return false;
		}

		$category = array_merge(
			$category_properties,
			array( 'name' => $category_name )
		);

		$this->registered_categories[ $category_name ] = $category;

		return true;
	}

	/**
	 * Unregisters an icon category.
	 *
	 * @param string $category_name Category name.
	 * @return bool True if the category was unregistered, false otherwise.
	 */
	public function unregister( $category_name ) {
		if ( ! $this->is_registered( $category_name ) ) {
			return false;
		}

		unset( $this->registered_categories[ $category_name ] );
		return true;
	}

	/**
	 * Retrieves all registered icon categories.
	 *
	 * @return array[] Array of registered icon category objects.
	 */
	public function get_all_registered() {
		$categories = array_values( $this->registered_categories );
		usort(
			$categories,
			static function ( $left, $right ) {
				return strnatcasecmp( $left['name'], $right['name'] );
			}
		);

		return $categories;
	}

	/**
	 * Retrieves a single registered icon category.
	 *
	 * @param string $category_name Category name.
	 * @return array|null Registered category object, or null if not found.
	 */
	public function get_registered( $category_name ) {
		if ( ! $this->is_registered( $category_name ) ) {
			return null;
		}

		return $this->registered_categories[ $category_name ];
	}

	/**
	 * Checks if an icon category is registered.
	 *
	 * @param string $category_name Category name.
	 * @return bool True when the category exists.
	 */
	public function is_registered( $category_name ) {
		return isset( $this->registered_categories[ $category_name ] );
	}

	/**
	 * Returns the singleton instance.
	 *
	 * @return Gutenberg_Icon_Categories_Registry_7_1 Registry instance.
	 */
	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}
}
