<?php
/**
 * Gutenberg_Modules class.
 *
 * Native support for ES Modules and Import Maps.
 *
 * @package Gutenberg
 * @subpackage Modules
 */
class Gutenberg_Modules {
	/**
	 * An array of registered modules, keyed by module identifier.
	 *
	 * @var array
	 */
	private static $registered = array();


	/**
	 * An array of queued modules.
	 *
	 * @var string[]
	 */
	private static $enqueued = array();

	/**
	 * Registers the module if no module with that module identifier already
	 * exists.
	 *
	 * @param string $module_identifier The identifier of the module. Should be unique. It will be used in the final import map.
	 * @param string $src               Full URL of the module, or path of the script relative to the WordPress root directory.
	 * @param array  $args     {
	 *      Optional array of arguments.
	 *
	 *      @type string|bool $ver Optional. String specifying script version number, if it has one, it is added to the URL
	 *                             as a query string for cache busting purposes. If version is set to false, a version
	 *                             number is automatically added equal to current installed WordPress version. If SCRIPT_DEBUG
	 *                             is set to true, it uses the timestamp instead.
	 * }
	 */
	public static function register( $module_identifier, $src, $args = array() ) {
		// Register the module if it's not already registered.
		if ( ! isset( self::$registered[ $module_identifier ] ) ) {
			self::$registered[ $module_identifier ] = array(
				'src'  => $src,
				'args' => $args,
			);
		}
	}

	/**
	 * Enqueues a module for output in the page.
	 *
	 * @param string $module_identifier The identifier of the module.
	 * @param string $src               Optional. Full URL of the module, or path of the script relative to the WordPress root directory.
	 * @param array  $args     {
	 *      Optional array of arguments.
	 *
	 *      @type string|bool $ver Optional. String specifying script version number, if it has one, it is added to the URL
	 *                             as a query string for cache busting purposes. If version is set to false, a version
	 *                             number is automatically added equal to current installed WordPress version. If SCRIPT_DEBUG
	 *                             is set to true, it uses the timestamp instead.
	 * }
	 */
	public static function enqueue( $module_identifier, $src = null, $args = array() ) {
		// Register the module if a source is provided and it's not already registered.
		if ( $src && ! isset( self::$registered[ $module_identifier ] ) ) {
			self::register( $module_identifier, $src, $args );
		}

		// Add the module to the queue if it's not already there.
		if ( ! in_array( $module_identifier, self::$enqueued, true ) ) {
			self::$enqueued[] = $module_identifier;
		}
	}

	/**
	 * Returns the import map array.
	 *
	 * @return string The import map.
	 */
	public static function get_import_map() {
		$import_map = array(
			'imports' => array(),
		);

		foreach ( self::$registered as $module_identifier => $module_data ) {
			$version = SCRIPT_DEBUG ? '?ver=' . time() : '?ver=' . $module_data['args']['version'] || '';

			$import_map['imports'][ $module_identifier ] = $module_data['src'] . $version;
		}

		return $import_map;
	}

	/**
	 * Prints the import map
	 */
	public static function print_import_map() {
		echo '<script type="importmap">' . wp_json_encode( self::get_import_map(), JSON_HEX_TAG | JSON_HEX_AMP ) . '</script>';
	}

	/**
	 * Prints all enqueued modules using script tags with type "module".
	 */
	public static function print_enqueued_modules() {
		foreach ( self::$enqueued as $module_identifier ) {
			if ( isset( self::$registered[ $module_identifier ] ) ) {
				$module  = self::$registered[ $module_identifier ];
				$version = SCRIPT_DEBUG ? '?ver=' . time() : '?ver=' . $module['args']['version'] || '';
				echo '<script type="module" src="' . $module['src'] . $version . '" id="' . $module_identifier . '"></script>';
			}
		}
	}
}

/**
 * Registers a JavaScript module. It will be added to the import map.
 *
 * @param string $module_identifier The identifier of the module. Should be unique. It will be used in the final import map.
 * @param string $src               Full URL of the module, or path of the script relative to the WordPress root directory.
 * @param array  $args     {
 *      Optional array of arguments.
 *
 *      @type string|bool $ver Optional. String specifying script version number, if it has one, it is added to the URL
 *                             as a query string for cache busting purposes. If version is set to false, a version
 *                             number is automatically added equal to current installed WordPress version. If SCRIPT_DEBUG
 *                             is set to true, it uses the timestamp instead.
 * }
 */
function gutenberg_register_module( $module_identifier, $src, $args = array() ) {
	Gutenberg_Modules::register( $module_identifier, $src, $args );
}

/**
 * Enqueues a JavaScript module. It will be added to both the import map and a
 * script tag with the "module" type.
 *
 * It registers the module if a source is provided but it won't overwrites the
 * value if there is an existing one.
 *
 * @param string $module_identifier The identifier of the module. Should be unique. It will be used in the final import map.
 * @param string $src               Optional. Full URL of the module, or path of the script relative to the WordPress root directory.
 * @param array  $args     {
 *      Optional array of arguments.
 *
 *      @type string|bool $ver Optional. String specifying script version number, if it has one, it is added to the URL
 *                             as a query string for cache busting purposes. If version is set to false, a version
 *                             number is automatically added equal to current installed WordPress version. If SCRIPT_DEBUG
 *                             is set to true, it uses the timestamp instead.
 * }
 */
function gutenberg_enqueue_module( $module_identifier, $src = '', $args = array() ) {
	Gutenberg_Modules::enqueue( $module_identifier, $src, $args );
}

// Attach the above function to 'wp_head' action hook.
add_action( 'wp_head', array( 'Gutenberg_Modules', 'print_import_map' ) );

// Attach the new function to 'wp_head' action hook.
add_action( 'wp_head', array( 'Gutenberg_Modules', 'print_enqueued_modules' ) );
