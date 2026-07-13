<?php

class WP_Icons_Registry_Gutenberg extends WP_Icons_Registry {
	/**
	 * Modified to point $manifest_path to Gutenberg packages
	 */
	protected function __construct() {
		$icons_directory = gutenberg_dir_path() . 'packages/icons/src';
		$icons_directory = trailingslashit( $icons_directory );
		$manifest_path   = $icons_directory . 'manifest.php';

		if ( ! is_readable( $manifest_path ) ) {
			wp_trigger_error(
				__METHOD__,
				__( 'Core icon collection manifest is missing or unreadable.', 'gutenberg' )
			);
			return;
		}

		$collection = include $manifest_path;

		if ( empty( $collection ) ) {
			wp_trigger_error(
				__METHOD__,
				__( 'Core icon collection manifest is empty or invalid.', 'gutenberg' )
			);
			return;
		}

		foreach ( $collection as $icon_name => $icon_data ) {
			if (
				empty( $icon_data['filePath'] )
				|| ! is_string( $icon_data['filePath'] )
			) {
				_doing_it_wrong(
					__METHOD__,
					__( 'Core icon collection manifest must provide valid a "filePath" for each icon.', 'gutenberg' ),
					'7.0.0'
				);
				return;
			}

			$this->register(
				'core/' . $icon_name,
				array(
					'label'     => $icon_data['label'],
					'file_path' => $icons_directory . $icon_data['filePath'],
				)
			);
		}
	}

	/**
	 * Registers an icon.
	 *
	 * @param string $icon_name       Icon name including namespace.
	 * @param array  $icon_properties {
	 *     List of properties for the icon.
	 *
	 *     @type string $label    Required. A human-readable label for the icon.
	 *     @type string $content  Optional. SVG markup for the icon.
	 *                            If not provided, the content will be retrieved from the `file_path` if set.
	 *                            If both `content` and `file_path` are not set, the icon will not be registered.
	 *     @type string $file_path Optional. The full path to the file containing the icon content.
	 * }
	 * @return bool True if the icon was registered with success and false otherwise.
	 */
	public function register( $icon_name, $icon_properties ) {
		if ( ! isset( $icon_name ) || ! is_string( $icon_name ) ) {
			_doing_it_wrong(
				__METHOD__,
				__( 'Icon name must be a string.', 'gutenberg' ),
				'7.0.0'
			);
			return false;
		}

		if ( preg_match( '/[A-Z]/', $icon_name ) ) {
			_doing_it_wrong(
				__METHOD__,
				__( 'Icon names must not contain uppercase characters.', 'gutenberg' ),
				'7.1.0'
			);
			return false;
		}

		$name_matcher = '/^[a-z][a-z0-9-]*\/[a-z][a-z0-9-]*$/';
		if ( ! preg_match( $name_matcher, $icon_name ) ) {
			_doing_it_wrong(
				__METHOD__,
				__( 'Icon names must contain a namespace prefix. Example: my-plugin/my-custom-icon', 'gutenberg' ),
				'7.1.0'
			);
			return false;
		}

		if ( $this->is_registered( $icon_name ) ) {
			_doing_it_wrong(
				__METHOD__,
				__( 'Icon is already registered.', 'gutenberg' ),
				'7.1.0'
			);
			return false;
		}

		$allowed_keys = array_fill_keys( array( 'label', 'content', 'file_path' ), 1 );
		foreach ( array_keys( $icon_properties ) as $key ) {
			if ( ! array_key_exists( $key, $allowed_keys ) ) {
				_doing_it_wrong(
					__METHOD__,
					sprintf(
						// translators: %s is the name of any user-provided key
						__( 'Invalid icon property: "%s".', 'gutenberg' ),
						$key
					),
					'7.0.0'
				);
				return false;
			}
		}

		if ( ! isset( $icon_properties['label'] ) || ! is_string( $icon_properties['label'] ) ) {
			_doing_it_wrong(
				__METHOD__,
				__( 'Icon label must be a string.', 'gutenberg' ),
				'7.0.0'
			);
			return false;
		}

		if (
			( ! isset( $icon_properties['content'] ) && ! isset( $icon_properties['file_path'] ) ) ||
			( isset( $icon_properties['content'] ) && isset( $icon_properties['file_path'] ) )
		) {
			_doing_it_wrong(
				__METHOD__,
				__( 'Icons must provide either `content` or `file_path`.', 'gutenberg' ),
				'7.0.0'
			);
			return false;
		}

		if ( isset( $icon_properties['content'] ) ) {
			if ( ! is_string( $icon_properties['content'] ) ) {
				_doing_it_wrong(
					__METHOD__,
					__( 'Icon content must be a string.', 'gutenberg' ),
					'7.0.0'
				);
				return false;
			}

			$sanitized_icon_content = $this->sanitize_icon_content( $icon_properties['content'] );
			if ( empty( $sanitized_icon_content ) ) {
				_doing_it_wrong(
					__METHOD__,
					__( 'Icon content does not contain valid SVG markup.', 'gutenberg' ),
					'7.0.0'
				);
				return false;
			}
		}

		$icon = array_merge(
			$icon_properties,
			array( 'name' => $icon_name )
		);

		$this->registered_icons[ $icon_name ] = $icon;

		return true;
	}

	/**
	 * Redefined to read the icon content from the `file_path` property.
	 *
	 * @param string $icon_name Icon name including namespace.
	 * @return string|null The content of the icon, if found.
	 */
	protected function get_content( $icon_name ) {
		if ( ! isset( $this->registered_icons[ $icon_name ]['content'] ) ) {
			$content = file_get_contents(
				$this->registered_icons[ $icon_name ]['file_path']
			);
			$content = $this->sanitize_icon_content( $content );

			if ( empty( $content ) ) {
				wp_trigger_error(
					__METHOD__,
					__( 'Icon content does not contain valid SVG markup.', 'gutenberg' )
				);
				return null;
			}

			$this->registered_icons[ $icon_name ]['content'] = $content;
		}
		return $this->registered_icons[ $icon_name ]['content'];
	}

	/**
	 * Modified to also search in icon labels
	 */
	public function get_registered_icons( $search = '' ) {
		$icons = array();

		foreach ( $this->registered_icons as $icon ) {
			if ( ! empty( $search )
				&& false === stripos( $icon['name'], $search )
				&& false === stripos( $icon['label'], $search )
			) {
				continue;
			}

			$icon['content'] = $icon['content'] ?? $this->get_content( $icon['name'] );
			$icons[]         = $icon;
		}

		return $icons;
	}

	/**
	 * Redefined to break away from base class.
	 */
	protected static $instance = null;

	/**
	 * Redefined to access new `$instance`
	 */
	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}
}

/**
 * Forces WP_Icons_Registry_Gutenberg instantiation and overrides WP_Icons_Registry
 * so that all code using WP_Icons_Registry::{method_name}() receives the Gutenberg
 * registry.
 */
function gutenberg_override_wp_icons_registry() {
	/*
	 * The plugin registers the `core/` icons from its own manifest, so core's
	 * registration would only re-register the same names on this registry.
	 */
	$wp_priority = has_action( 'init', '_wp_register_default_icons' );
	if ( false !== $wp_priority ) {
		remove_action( 'init', '_wp_register_default_icons', $wp_priority );
	}

	$reflection = new ReflectionClass( WP_Icons_Registry::class );
	$property   = $reflection->getProperty( 'instance' );
	/*
		* ReflectionProperty::setAccessible is:
		* - redundant as of 8.1.0, which made all properties accessible
		* - deprecated as of 8.5.0
		* - needed until 8.1.0, as property `instance` is private
		*/
	if ( PHP_VERSION_ID < 80100 ) {
		$property->setAccessible( true );
	}
	$original_registry  = $property->getValue( null );
	$gutenberg_registry = WP_Icons_Registry_Gutenberg::get_instance();

	// If the original registry was already instantiated, replay any icons outside
	// the `core/` namespace onto the Gutenberg registry so they are not lost.
	if ( null !== $original_registry ) {
		$register_method = new ReflectionMethod( WP_Icons_Registry_Gutenberg::class, 'register' );
		/*
		 * ReflectionMethod::setAccessible is:
		 * - redundant as of 8.1.0, which made all properties accessible
		 * - deprecated as of 8.5.0
		 * - needed until 8.1.0, as property `instance` is private
		 */
		if ( PHP_VERSION_ID < 80100 ) {
			$register_method->setAccessible( true );
		}
		foreach ( $original_registry->get_registered_icons() as $icon ) {
			if ( strpos( $icon['name'], 'core/' ) === 0 ) {
				continue;
			}
			$icon_properties = array( 'label' => $icon['label'] );
			if ( ! empty( $icon['content'] ) ) {
				$icon_properties['content'] = $icon['content'];
			} elseif ( ! empty( $icon['file_path'] ) ) {
				$icon_properties['file_path'] = $icon['file_path'];
			} else {
				continue;
			}
			$register_method->invoke( $gutenberg_registry, $icon['name'], $icon_properties );
		}
	}
	$property->setValue( null, $gutenberg_registry );
}
add_action( 'init', 'gutenberg_override_wp_icons_registry', 1 );
