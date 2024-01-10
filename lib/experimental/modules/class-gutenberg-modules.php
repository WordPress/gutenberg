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
	 * An array of module identifiers that were enqueued before registered.
	 *
	 * @var array
	 */
	private static $enqueued_modules_before_register = array();

	/**
	 * Registers the module if no module with that module identifier has already
	 * been registered.
	 *
	 * @param string            $module_identifier The identifier of the module. Should be unique. It will be used in the final import map.
	 * @param string            $src               Full URL of the module, or path of the script relative to the WordPress root directory.
	 * @param array             $dependencies      Optional. An array of module identifiers of the dependencies of this module. The dependencies can be strings or arrays. If they are arrays, they need an `id` key with the module identifier, and can contain a `type` key with either `static` or `dynamic`. By default, dependencies that don't contain a type are considered static.
	 * @param string|false|null $version           Optional. String specifying module version number. Defaults to false. It is added to the URL as a query string for cache busting purposes. If SCRIPT_DEBUG is true, the version is the current timestamp. If $version is set to false, the version number is the currently installed WordPress version. If $version is set to null, no version is added.
	 */
	public static function register( $module_identifier, $src, $dependencies = array(), $version = false ) {
		if ( ! isset( self::$registered[ $module_identifier ] ) ) {
			$deps = array();
			foreach ( $dependencies as $dependency ) {
				if ( isset( $dependency['id'] ) ) {
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
		}
	}

	/**
	 * Marks the module to be enqueued in the page.
	 *
	 * @param string $module_identifier The identifier of the module.
	 */
	public static function enqueue( $module_identifier ) {
		if ( isset( self::$registered[ $module_identifier ] ) ) {
			self::$registered[ $module_identifier ]['enqueued'] = true;
		} elseif ( ! in_array( $module_identifier, self::$enqueued_modules_before_register, true ) ) {
			self::$enqueued_modules_before_register[] = $module_identifier;
		}
	}

	/**
	 * Unmarks the module so it is no longer enqueued in the page.
	 *
	 * @param string $module_identifier The identifier of the module.
	 */
	public static function dequeue( $module_identifier ) {
		if ( isset( self::$registered[ $module_identifier ] ) ) {
			self::$registered[ $module_identifier ]['enqueued'] = false;
		}
		$key = array_search( $module_identifier, self::$enqueued_modules_before_register, true );
		if ( false !== $key ) {
			array_splice( self::$enqueued_modules_before_register, $key, 1 );
		}
	}

	/**
	 * Returns the import map array.
	 *
	 * @return array Array with an 'imports' key mapping to an array of module identifiers and their respective source URLs, including the version query.
	 */
	public static function get_import_map() {
		$imports = array();
		foreach ( self::get_dependencies( array_keys( self::get_enqueued() ) ) as $module_identifier => $module ) {
			$imports[ $module_identifier ] = $module['src'] . self::get_version_query_string( $module['version'] );
		}
		return array( 'imports' => $imports );
	}

	/**
	 * Prints the import map using a script tag with an type="importmap" attribute.
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
	 * Prints the the static dependencies of the enqueued modules using link tags
	 * with rel="modulepreload" attributes.
	 */
	public static function print_module_preloads() {
		foreach ( self::get_dependencies( array_keys( self::get_enqueued() ), array( 'static' ) ) as $module_identifier => $module ) {
			if ( true !== $module['enqueued'] ) {
				echo sprintf(
					'<link rel="modulepreload" href="%s" id="%s">',
					esc_attr( $module['src'] . self::get_version_query_string( $module['version'] ) ),
					esc_attr( $module_identifier )
				);
			}
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
		$test = 'HTMLScriptElement.supports && HTMLScriptElement.supports("importmap")';
		$src  = gutenberg_url( '/build/modules/importmap-polyfill.min.js' );

		echo (
			// Test presence of feature...
			'<script>( ' . $test . ' ) || ' .
			/*
			 * ...appending polyfill on any failures. Cautious viewers may balk
			 * at the `document.write`. Its caveat of synchronous mid-stream
			 * blocking write is exactly the behavior we need though.
			 */
			'document.write( \'<script src="' .
			$src .
			'"></scr\' + \'ipt>\' );</script>'
		);
	}

	/**
	 * Gets the version of a module.
	 *
	 * If SCRIPT_DEBUG is true, the version is the current timestamp. If $version
	 * is set to false, the version number is the currently installed WordPress
	 * version. If $version is set to null, no version is added.
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
	 * Retrieves an array of enqueued modules.
	 *
	 * @return array Array of modules keyed by module identifier.
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
	 * Retrieves all the dependencies for given modules depending on type.
	 *
	 * This method is recursive to also retrieve dependencies of the dependencies.
	 * It will consolidate an array containing unique dependencies based on the
	 * requested types ('static' or 'dynamic').
	 *
	 * @param array $module_identifiers The identifiers of the modules for which to gather dependencies.
	 * @param array $types              Optional. Types of dependencies to retrieve: 'static', 'dynamic', or both. Default is both.
	 * @return array Array of modules keyed by module identifier.
	 */
	private static function get_dependencies( $module_identifiers, $types = array( 'static', 'dynamic' ) ) {
		return array_reduce(
			$module_identifiers,
			function ( $dependency_modules, $module_identifier ) use ( $types ) {
				$dependencies = array();
				foreach ( self::$registered[ $module_identifier ]['dependencies'] as $dependency ) {
					if (
						in_array( $dependency['type'], $types, true ) &&
						isset( self::$registered[ $dependency['id'] ] ) &&
						! isset( $dependency_modules[ $dependency['id'] ] )
					) {
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
 * Registers the module if no module with that module identifier has already
 * been registered.
 *
 * @param string            $module_identifier The identifier of the module. Should be unique. It will be used in the final import map.
 * @param string            $src               Full URL of the module, or path of the script relative to the WordPress root directory.
 * @param array             $dependencies      Optional. An array of module identifiers of the dependencies of this module. The dependencies can be strings or arrays. If they are arrays, they need an `id` key with the module identifier, and can contain a `type` key with either `static` or `dynamic`. By default, dependencies that don't contain a type are considered static.
 * @param string|false|null $version           Optional. String specifying module version number. Defaults to false. It is added to the URL as a query string for cache busting purposes. If SCRIPT_DEBUG is true, the version is the current timestamp. If $version is set to false, the version number is the currently installed WordPress version. If $version is set to null, no version is added.
 */
function gutenberg_register_module( $module_identifier, $src, $dependencies = array(), $version = false ) {
	Gutenberg_Modules::register( $module_identifier, $src, $dependencies, $version );
}

/**
 * Marks the module to be enqueued in the page.
 *
 * @param string $module_identifier The identifier of the module.
 */
function gutenberg_enqueue_module( $module_identifier ) {
	Gutenberg_Modules::enqueue( $module_identifier );
}

/**
 * Unmarks the module so it is not longer enqueued in the page.
 *
 * @param string $module_identifier The identifier of the module.
 */
function gutenberg_dequeue_module( $module_identifier ) {
	Gutenberg_Modules::dequeue( $module_identifier );
}

$modules_position = wp_is_block_theme() ? 'wp_head' : 'wp_footer';
// Prints the import map in the head tag in block themes. Otherwise in the footer.
add_action( $modules_position, array( 'Gutenberg_Modules', 'print_import_map' ) );

// Prints the enqueued modules in the head tag in block themes. Otherwise in the footer.
add_action( $modules_position, array( 'Gutenberg_Modules', 'print_enqueued_modules' ) );

// Prints the preloaded modules in the head tag in block themes. Otherwise in the footer.
add_action( $modules_position, array( 'Gutenberg_Modules', 'print_module_preloads' ) );

// Prints the script that loads the import map polyfill in the footer.
add_action( 'wp_head', array( 'Gutenberg_Modules', 'print_import_map_polyfill' ), 11 );

/**
 * Add module fields from block metadata to WP_Block_Type settings.
 *
 * This filter allows us to register modules from block metadata and attach additional fields to
 * WP_Block_Type instances.
 *
 * @param array $settings Array of determined settings for registering a block type.
 * @param array $metadata Metadata provided for registering a block type.
 */
function gutenberg_filter_block_type_metadata_settings_register_modules( $settings, $metadata = null ) {
	$module_fields = array(
		'viewModule' => 'view_module_ids',
	);
	foreach ( $module_fields as $metadata_field_name => $settings_field_name ) {
		if ( ! empty( $settings[ $metadata_field_name ] ) ) {
			$metadata[ $metadata_field_name ] = $settings[ $metadata_field_name ];
		}
		if ( ! empty( $metadata[ $metadata_field_name ] ) ) {
			$modules           = $metadata[ $metadata_field_name ];
			$processed_modules = array();
			if ( is_array( $modules ) ) {
				for ( $index = 0; $index < count( $modules ); $index++ ) {
					$processed_modules[] = gutenberg_register_block_module_id(
						$metadata,
						$metadata_field_name,
						$index
					);
				}
			} else {
				$processed_modules[] = gutenberg_register_block_module_id(
					$metadata,
					$metadata_field_name
				);
			}
			$settings[ $settings_field_name ] = $processed_modules;
		}
	}

	return $settings;
}

add_filter( 'block_type_metadata_settings', 'gutenberg_filter_block_type_metadata_settings_register_modules', 10, 2 );

/**
 * Enqueue modules associated with the block.
 *
 * @param string   $block_content The block content.
 * @param array    $block         The full block, including name and attributes.
 * @param WP_Block $instance      The block instance.
 */
function gutenberg_filter_render_block_enqueue_view_modules( $block_content, $parsed_block, $block_instance ) {
	$block_type = $block_instance->block_type;

	if ( ! empty( $block_type->view_module_ids ) ) {
		foreach ( $block_type->view_module_ids as $module_id ) {
			gutenberg_enqueue_module( $module_id );
		}
	}

	return $block_content;
}

add_filter( 'render_block', 'gutenberg_filter_render_block_enqueue_view_modules', 10, 3 );

/**
 * Finds a module ID for the selected block metadata field. It detects
 * when a path to file was provided and finds a corresponding asset file
 * with details necessary to register the module under an automatically
 * generated module ID.
 *
 * This is analogous to the `register_block_script_handle` in WordPress Core.
 *
 * @param array  $metadata   Block metadata.
 * @param string $field_name Field name to pick from metadata.
 * @param int    $index      Optional. Index of the script to register when multiple items passed.
 *                           Default 0.
 * @return string Module ID.
 */
function gutenberg_register_block_module_id( $metadata, $field_name, $index = 0 ) {
	if ( empty( $metadata[ $field_name ] ) ) {
		return false;
	}

	$module_id = $metadata[ $field_name ];
	if ( is_array( $module_id ) ) {
		if ( empty( $module_id[ $index ] ) ) {
			return false;
		}
		$module_id = $module_id[ $index ];
	}

	$module_path = remove_block_asset_path_prefix( $module_id );
	if ( $module_id === $module_path ) {
		return $module_id;
	}

	$path                  = dirname( $metadata['file'] );
	$module_asset_raw_path = $path . '/' . substr_replace( $module_path, '.asset.php', - strlen( '.js' ) );
	$module_id             = gutenberg_generate_block_asset_module_id( $metadata['name'], $field_name, $index );
	$module_asset_path     = wp_normalize_path( realpath( $module_asset_raw_path ) );

	if ( empty( $module_asset_path ) ) {
		_doing_it_wrong(
			__FUNCTION__,
			sprintf(
				// This string is from WordPress Core. See `register_block_script_handle`.
				// Translators: This is a translation from WordPress Core (default). No need to translate.
				__( 'The asset file (%1$s) for the "%2$s" defined in "%3$s" block definition is missing.', 'default' ),
				$module_asset_raw_path,
				$field_name,
				$metadata['name']
			),
			'6.5.0'
		);
		return false;
	}

	$module_path_norm    = wp_normalize_path( realpath( $path . '/' . $module_path ) );
	$module_uri          = get_block_asset_url( $module_path_norm );
	$module_asset        = require $module_asset_path;
	$module_dependencies = isset( $module_asset['dependencies'] ) ? $module_asset['dependencies'] : array();

	gutenberg_register_module(
		$module_id,
		$module_uri,
		$module_dependencies,
		isset( $module_asset['version'] ) ? $module_asset['version'] : false
	);

	return $module_id;
}

/**
 * Generates the module ID for an asset based on the name of the block
 * and the field name provided.
 *
 * This is analogous to the `generate_block_asset_handle` in WordPress Core.
 *
 * @param string $block_name Name of the block.
 * @param string $field_name Name of the metadata field.
 * @param int    $index      Optional. Index of the asset when multiple items passed.
 *                           Default 0.
 * @return string Generated module ID for the block's field.
 */
function gutenberg_generate_block_asset_module_id( $block_name, $field_name, $index = 0 ) {
	if ( str_starts_with( $block_name, 'core/' ) ) {
		$asset_handle = str_replace( 'core/', 'wp-block-', $block_name );
		if ( str_starts_with( $field_name, 'editor' ) ) {
			$asset_handle .= '-editor';
		}
		if ( str_starts_with( $field_name, 'view' ) ) {
			$asset_handle .= '-view';
		}
		if ( $index > 0 ) {
			$asset_handle .= '-' . ( $index + 1 );
		}
		return $asset_handle;
	}

	$field_mappings = array(
		'viewModule' => 'view-module',
	);
	$asset_handle   = str_replace( '/', '-', $block_name ) .
		'-' . $field_mappings[ $field_name ];
	if ( $index > 0 ) {
		$asset_handle .= '-' . ( $index + 1 );
	}
	return $asset_handle;
}

function gutenberg_register_view_module_ids_rest_field() {
	register_rest_field(
		'block-type',
		'view_module_ids',
		array(
			'get_callback' => function ( $item ) {
				$block_type = WP_Block_Type_Registry::get_instance()->get_registered( $item['name'] );
				if ( isset( $block_type->view_module_ids ) ) {
					return $block_type->view_module_ids;
				}
				return array();
			},
		)
	);
}

add_action( 'rest_api_init', 'gutenberg_register_view_module_ids_rest_field' );
