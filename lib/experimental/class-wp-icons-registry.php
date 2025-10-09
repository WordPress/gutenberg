<?php
/**
 * Icons API: WP_Icons_Registry class
 *
 * @package gutenberg
 */

/**
 * Class used for interacting with icons.
 */
if ( ! class_exists( 'WP_Icons_Registry' ) ) {
	class WP_Icons_Registry {
		/**
		 * Registered icons array.
		 *
		 * @var array[]
		 */
		private $registered_icons = array();


		/**
		 * Container for the main instance of the class.
		 *
		 * @var WP_Icons_Registry|null
		 */
		private static $instance = null;

		/**
		 * Constructs the controller.
		 *
		 * Temporary. See method `register_core_icons` for rationale.
		 */
		public function __construct() {
			$this->register_core_icons();
		}

		/**
		 * Registers an icon.
		 *
		 *
		 * @param string $icon_name       Icon name including namespace.
		 * @param array  $icon_properties {
		 *     List of properties for the icon.
		 *
		 *     @type string $title    Required. A human-readable title for the icon.
		 *     @type string $content  Optional. SVG markup for the icon.
		 *                            If not provided, the content will be retrieved from the `filePath` if set.
		 *                            If both `content` and `filePath` are not set, the icon will not be registered.
		 *     @type string $filePath Optional. The full path to the file containing the icon content.
		 * }
		 * @return bool True if the icon was registered with success and false otherwise.
		 */
		private function register( $icon_name, $icon_properties ) {
			if ( ! isset( $icon_name ) || ! is_string( $icon_name ) ) {
				_doing_it_wrong(
					__METHOD__,
					__( 'Icon name must be a string.', 'gutenberg' ),
					''
				);
				return false;
			}

			if ( ! isset( $icon_properties['title'] ) || ! is_string( $icon_properties['title'] ) ) {
				_doing_it_wrong(
					__METHOD__,
					__( 'Icon title must be a string.', 'gutenberg' ),
					''
				);
				return false;
			}

			if ( ! isset( $icon_properties['filePath'] ) ) {
				if ( ! isset( $icon_properties['content'] ) || ! is_string( $icon_properties['content'] ) ) {
					_doing_it_wrong(
						__METHOD__,
						__( 'Icon content must be a string.', 'gutenberg' ),
						''
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
		 * Unregisters an icon.
		 *
		 *
		 * @param string $icon_name Icon name including namespace.
		 * @return bool True if the icon was unregistered with success and false otherwise.
		 */
		private function unregister( $icon_name ) {
			if ( ! $this->is_registered( $icon_name ) ) {
				_doing_it_wrong(
					__METHOD__,
					/* translators: %s: Icon name. */
					sprintf( __( 'Icon "%s" not found.', 'gutenberg' ), $icon_name ),
					''
				);
				return false;
			}

			unset( $this->registered_icons[ $icon_name ] );

			return true;
		}

		/**
		 * Retrieves the content of a registered icon.
		 *
		 * @param string $icon_name Icon name including namespace.
		 * @return string The content of the icon.
		 * @since 6.9.0
		 */
		private function get_content( $icon_name ) {
			if ( ! isset( $this->registered_icons[ $icon_name ]['content'] ) && isset( $this->registered_icons[ $icon_name ]['filePath'] ) ) {
				ob_start();
				include $this->registered_icons[ $icon_name ]['filePath'];
				$this->registered_icons[ $icon_name ]['content'] = ob_get_clean();
				unset( $this->registered_icons[ $icon_name ]['filePath'] );
			}
			return $this->registered_icons[ $icon_name ]['content'];
		}

		/**
		 * Retrieves an array containing the properties of a registered icon.
		 *
		 *
		 * @param string $icon_name Icon name including namespace.
		 * @return array|null Registered icon properties or `null` if the icon is not registered.
		 */
		public function get_registered( $icon_name ) {
			if ( ! $this->is_registered( $icon_name ) ) {
				return null;
			}

			$icon            = $this->registered_icons[ $icon_name ];
			$content         = $this->get_content( $icon_name );
			$icon['content'] = $content;

			return $icon;
		}

		/**
		 * Retrieves all registered icons.
		 *
		 * @return array[] Array of arrays containing the registered icon properties.
		 */
		public function get_all_registered() {
			$icons = $this->registered_icons;

			foreach ( $icons as $index => $icon ) {
				$content                    = $this->get_content( $icon['name'] );
				$icons[ $index ]['content'] = $content;
			}

			return array_values( $icons );
		}

		/**
		 * Checks if an icon is registered.
		 *
		 *
		 * @param string $icon_name Icon name including namespace.
		 * @return bool True if the icon is registered, false otherwise.
		 */
		public function is_registered( $icon_name ) {
			return isset( $this->registered_icons[ $icon_name ] );
		}

		/**
		 * Magic method for object serialization.
		 *
		 */
		public function __wakeup() {
			if ( ! $this->registered_icons ) {
				return;
			}
			if ( ! is_array( $this->registered_icons ) ) {
				throw new UnexpectedValueException();
			}
			foreach ( $this->registered_icons as $value ) {
				if ( ! is_array( $value ) ) {
					throw new UnexpectedValueException();
				}
			}
		}

		/**
		 * Utility method to retrieve the main instance of the class.
		 *
		 * The instance will be created if it does not exist yet.
		 *
		 *
		 * @return WP_Icons_Registry The main instance.
		 */
		public static function get_instance() {
			if ( null === self::$instance ) {
				self::$instance = new self();
			}

			return self::$instance;
		}

		/**
		 * Registers core icons from the `@wordpress/icons` package.
		 *
		 * Exists only temporarily as this new class (and associated features)
		 * is in testing. Hard-coding the registration of core icons by calling
		 * this method in the constructor allows us to keep method `register`
		 * private for this release.
		 */
		private function register_core_icons() {
			$icons_directory = __DIR__ . '/../../packages/icons/src/library/';

			if ( ! is_dir( $icons_directory ) ) {
				return;
			}

			$svg_files = glob( $icons_directory . '*.svg' );

			foreach ( $svg_files as $svg_file ) {
				$icon_name   = basename( $svg_file, '.svg' );
				$svg_content = file_get_contents( $svg_file );

				if ( false === $svg_content ) {
					continue;
				}

				$title = ucwords( str_replace( array( '-', '_' ), ' ', $icon_name ) );

				$this->register(
					'core/' . $icon_name,
					array(
						'title'   => $title,
						'content' => $svg_content,
					)
				);
			}
		}
	}
}
