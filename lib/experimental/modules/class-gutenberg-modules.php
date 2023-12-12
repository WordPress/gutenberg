<?php
/**
 * Modules API: Gutenberg_Modules class.
 *
 * Native support for ES Modules and Import Maps.
 *
 * @package Gutenberg
 * @subpackage Modules
 */

/**
 * Gutenberg_Modules class
 */
class Gutenberg_Modules {
	/**
	 * An array of registered modules, keyed by module identifier.
	 *
	 * @var array
	 */
	private static $registered = array();

	/**
	 *
	 */
	private static $enqueued_modules_before_register = array();

	/**
	 * Registers the module if no module with that module identifier already
	 * exists.
	 *
	 * @param string           $module_identifier The identifier of the module. Should be unique. It will be used in the final import map.
	 * @param string           $src               Full URL of the module, or path of the script relative to the WordPress root directory.
	 * @param array            $dependencies      Optional. An array of module identifiers of the dependencies of this module. The dependencies can be strings or arrays. If they are arrays, they need an `id` key with the module identifier, and can contain a `type` key with either `static` or `dynamic`. By default, dependencies that don't contain a type are considered static.
	 * @param string|bool|null $version           Optional. Defaults to false. String specifying module version number. It is added to the URL as a query string for cache busting purposes. If SCRIPT_DEBUG is true, a timestamp is used. If it is set to false, a version number is automatically added equal to current installed WordPress version. If set to null, no version is added.
	 */
	public static function register( $module_identifier, $src, $dependencies = array(), $version = false ) {
		// Register the module if it's not already registered.
		if ( ! isset( self::$registered[ $module_identifier ] ) ) {
			$deps = array();
			foreach ( $dependencies as $dependency ) {
				if ( is_array( $dependency ) && isset( $dependency['id'] ) ) {
					$deps[] = array(
						'id'   => $dependency['id'],
						'type' => isset( $dependency['type'] ) && 'dynamic' === $dependency['type'] ? 'dynamic' : 'static',
					);
				} elseif ( is_string( $dependency ) ) {
					$deps[] = array(
						'id'   => $dependency,
						'type' => 'static',
					);
				}
			}

			self::$registered[ $module_identifier ] = array(
				'src'          => $src,
				'version'      => $version,
				'enqueued'     => in_array( $module_identifier, self::$enqueued_modules_before_register, true ),
				'dependencies' => $deps,
			);

		} else {
			// TODO: Check version, and if it's bigger, override.
		}
	}

	/**
	 * Enqueues a module in the page.
	 *
	 * @param string $module_identifier The identifier of the module.
	 */
	public static function enqueue( $module_identifier ) {
		if ( isset( self::$registered[ $module_identifier ] ) ) {
			self::$registered[ $module_identifier ]['enqueued'] = true;
		} else {
			self::$enqueued_modules_before_register[] = $module_identifier;
		}
	}

	/**
	 * Returns the import map array.
	 *
	 * @return array Associative array with 'imports' key mapping to an array of module identifiers and their respective source strings.
	 */
	public static function get_import_map() {
		$imports = array();
		foreach ( self::get_dependencies( array_keys( self::get_enqueued() ) ) as $module_identifier => $module ) {
			$imports[ $module_identifier ] = $module['src'] . self::get_version_query_string( $module['version'] );
		}
		return array( 'imports' => $imports );
	}

	/**
	 * Prints the import map.
	 */
	public static function print_import_map() {
		$import_map = self::get_import_map();
		if ( ! empty( $import_map['imports'] ) ) {
			echo '<script type="importmap">' . wp_json_encode( self::get_import_map(), JSON_HEX_TAG | JSON_HEX_AMP ) . '</script>';
		}
	}

	/**
	 * Prints all the enqueued modules using <script type="module">.
	 */
	public static function print_enqueued_modules() {
		foreach ( self::get_enqueued() as $module_identifier => $module ) {
			wp_print_script_tag(
				array(
					'type' => 'module',
					'src'  => $module['src'] . self::get_version_query_string( $module['version'] ),
					'id'   => $module_identifier,
				)
			);
		}
	}

	/**
	 * Prints the link tag with rel="modulepreload" for all the static
	 * dependencies of the enqueued modules.
	 */
	public static function print_preloaded_modules() {
		foreach ( self::get_dependencies( array_keys( self::get_enqueued() ), array( 'static' ) ) as $module_identifier => $module ) {
				echo '<link rel="modulepreload" href="' . $module['src'] . self::get_version_query_string( $module['version'] ) . '" id="' . $module_identifier . '">';
		}
	}

	/**
	 * Prints the necessary script to load import map polyfill for browsers that
	 * do not support import maps.
	 *
	 * TODO: Replace the polyfill with a simpler version that only provides
	 * support for import maps and load it only when the browser doesn't support
	 * import maps (https://github.com/guybedford/es-module-shims/issues/406).
	 */
	public static function print_import_map_polyfill() {
		$import_map = self::get_import_map();
		if ( ! empty( $import_map['imports'] ) ) {
			wp_print_script_tag(
				array(
					'src'   => gutenberg_url( '/build/modules/importmap-polyfill.min.js' ),
					'defer' => true,
				)
			);
		}
	}

	/**
	 * Gets the module's version. It either returns a timestamp (if SCRIPT_DEBUG
	 * is true), the explicit version of the module if it is set and not false, or
	 * an empty string if none of the above conditions are met.
	 *
	 * @param array $version The version of the module.
	 * @return string A string presenting the version.
	 */
	private static function get_version_query_string( $version ) {
		if ( defined( 'SCRIPT_DEBUG ' ) && SCRIPT_DEBUG ) {
			return '?ver=' . time();
		} elseif ( false === $version ) {
			return '?ver=' . get_bloginfo( 'version' );
		} elseif ( null !== $version ) {
			return '?ver=' . $version;
		}
		return '';
	}

	/**
	 *
	 */
	private static function get_enqueued() {
		$enqueued = array();
		foreach ( self::$registered as $module_identifier => $module ) {
			if ( true === $module['enqueued'] ) {
				$enqueued[ $module_identifier ] = $module;
			}
		}
		return $enqueued;
	}

	/**
	 * Returns all unique static and/or dynamic dependencies for the received
	 * modules. It's recursive, so it will also get the static or dynamic
	 * dependencies of the dependencies.
	 *
	 * @param array $modules The array of modules to get dependencies for.
	 * @param array $types   The type of dependencies to retrieve. It can be `static`, `dynamic` or both.
	 * @return array The array containing the unique dependencies of the modules.
	 */
	private static function get_dependencies( $module_identifiers, $types = array( 'static', 'dynamic' ) ) {
		return array_reduce(
			$module_identifiers,
			function ( $dependency_modules, $module_identifier ) use ( $types ) {
				$dependencies = array();
				foreach ( self::$registered[ $module_identifier ]['dependencies'] as $dependency ) {
					if ( in_array( $dependency['type'], $types, true ) && isset( self::$registered[ $dependency['id'] ] ) ) {
						$dependencies[ $dependency['id'] ] = self::$registered[ $dependency['id'] ];
					}
				}
				return array_merge( $dependency_modules, $dependencies, self::get_dependencies( array_keys( $dependencies ), $types ) );
			},
			array()
		);
	}
}

/**
 * Registers a JavaScript module. It will be added to the import map.
 *
 * @param string           $module_identifier The identifier of the module. Should be unique. It will be used in the final import map.
 * @param string           $src               Full URL of the module, or path of the script relative to the WordPress root directory.
 * @param array            $dependencies      Optional. An array of module identifiers of the dependencies of this module. The dependencies can be strings or arrays. If they are arrays, they need an `id` key with the module identifier, and can contain a `type` key with either `static` or `dynamic`. By default, dependencies are considered static.
 * @param string|bool|null $version           Optional. Defaults to false. String specifying module version number. It is added to the URL as a query string for cache busting purposes. If SCRIPT_DEBUG is true, a timestamp is used. If it is set to false, a version number is automatically added equal to current installed WordPress version. If set to null, no version is added.
 */
function gutenberg_register_module( $module_identifier, $src, $dependencies = array(), $version = false ) {
	Gutenberg_Modules::register( $module_identifier, $src, $dependencies, $version );
}

/**
 * Enqueues a JavaScript module. It will be added to both the import map and a
 * script tag with the "module" type.
 *
 * @param string $module_identifier The identifier of the module. Should be unique. It will be used in the final import map.
 */
function gutenberg_enqueue_module( $module_identifier ) {
	Gutenberg_Modules::enqueue( $module_identifier );
}

// Prints the import map in the head tag.
add_action( 'wp_head', array( 'Gutenberg_Modules', 'print_import_map' ) );

// Prints the enqueued modules in the head tag.
add_action( 'wp_head', array( 'Gutenberg_Modules', 'print_enqueued_modules' ) );

// Prints the preloaded modules in the head tag.
add_action( 'wp_head', array( 'Gutenberg_Modules', 'print_preloaded_modules' ) );

// Prints the script that loads the import map polyfill in the footer.
add_action( 'wp_footer', array( 'Gutenberg_Modules', 'print_import_map_polyfill' ), 11 );
