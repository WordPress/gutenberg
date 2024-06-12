<?php
/**
 * Add module fields from block metadata to WP_Block_Type settings.
 *
 * This filter allows us to register modules from block metadata and attach additional fields to
 * WP_Block_Type instances.
 *
 * @param array $settings Array of determined settings for registering a block type.
 * @param array $metadata Metadata provided for registering a block type.
 */
function gutenberg_filter_block_type_metadata_settings_register_view_module( $settings, $metadata = null ) {
	$module_fields = array(
		// @todo remove viewModule support in Gutenberg >= 17.8 (replaced by viewScriptModule).
		'viewModule' => 'view_script_module_ids',
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

add_filter( 'block_type_metadata_settings', 'gutenberg_filter_block_type_metadata_settings_register_view_module', 20, 2 );

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

	$module_path_norm    = wp_normalize_path( realpath( $path . '/' . $module_path ) );
	$module_uri          = get_block_asset_url( $module_path_norm );
	$module_asset        = ! empty( $module_asset_path ) ? require $module_asset_path : array();
	$module_dependencies = isset( $module_asset['dependencies'] ) ? $module_asset['dependencies'] : array();

	wp_register_script_module(
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
		// @todo remove viewModule support in Gutenberg >= 17.8 (replaced by viewScriptModule).
		'viewModule'       => 'view-script-module',
		'viewScriptModule' => 'view-script-module',
	);
	$asset_handle   = str_replace( '/', '-', $block_name ) .
		'-' . $field_mappings[ $field_name ];
	if ( $index > 0 ) {
		$asset_handle .= '-' . ( $index + 1 );
	}
	return $asset_handle;
}

/**
 * Registers a REST field for block types to provide view module IDs.
 *
 * Adds the `view_script_module_ids` and `view_module_ids` (deprecated) field to block type objects in the REST API, which
 * lists the script module IDs for any script modules associated with the
 * block's viewScriptModule key.
 */
function gutenberg_register_view_module_ids_rest_field() {
	// @todo remove view_module_ids support in Gutenberg >= 17.8 (replaced by view_script_module_ids).
	register_rest_field(
		'block-type',
		'view_module_ids',
		array(
			'get_callback' => function ( $item ) {
				$block_type = WP_Block_Type_Registry::get_instance()->get_registered( $item['name'] );
				if ( isset( $block_type->view_script_module_ids ) ) {
					return $block_type->view_script_module_ids;
				}
				return array();
			},
		)
	);
}

add_action( 'rest_api_init', 'gutenberg_register_view_module_ids_rest_field' );

/**
 * Registers the module if no module with that module identifier has already
 * been registered.
 *
 * @param string            $module_identifier The identifier of the module. Should be unique. It will be used in the final import map.
 * @param string            $src               Full URL of the module, or path of the script relative to the WordPress root directory.
 * @param array             $dependencies      Optional. An array of module identifiers of the dependencies of this module. The dependencies can be strings or arrays. If they are arrays, they need an `id` key with the module identifier, and can contain an `import` key with either `static` or `dynamic`. By default, dependencies that don't contain an import are considered static.
 * @param string|false|null $version           Optional. String specifying module version number. Defaults to false. It is added to the URL as a query string for cache busting purposes. If $version is set to false, the version number is the currently installed WordPress version. If $version is set to null, no version is added.
 * @deprecated 17.6.0 gutenberg_register_module is deprecated. Please use wp_register_script_module instead.
 */
function gutenberg_register_module( $module_identifier, $src = '', $dependencies = array(), $version = false ) {
	_deprecated_function( __FUNCTION__, 'Gutenberg 17.6.0', 'wp_register_script_module' );
	wp_script_modules()->register( $module_identifier, $src, $dependencies, $version );
}

/**
 * Marks the module to be enqueued in the page.
 *
 * @param string $module_identifier The identifier of the module.
 * @deprecated 17.6.0 gutenberg_enqueue_module is deprecated. Please use wp_enqueue_script_module instead.
 */
function gutenberg_enqueue_module( $module_identifier ) {
	_deprecated_function( __FUNCTION__, 'Gutenberg 17.6.0', 'wp_enqueue_script_module' );
	wp_script_modules()->enqueue( $module_identifier );
}

/**
 * Unmarks the module so it is not longer enqueued in the page.
 *
 * @param string $module_identifier The identifier of the module.
 * @deprecated 17.6.0 gutenberg_dequeue_module is deprecated. Please use wp_dequeue_script_module instead.
 */
function gutenberg_dequeue_module( $module_identifier ) {
	_deprecated_function( __FUNCTION__, 'Gutenberg 17.6.0', 'wp_dequeue_script_module' );
	wp_script_modules()->dequeue( $module_identifier );
}


/**
 * Print data associated with Script Modules in Script tags.
 *
 * This embeds data in the page HTML so that it is available on page load.
 *
 * Data can be associated with a given Script Module by using the
 * `script_module_data_{$module_id}` filter.
 *
 * The data for a given Script Module will be JSON serialized in a script tag with an ID
 * like `wp-script-module-data-{$module_id}`.
 */
function gutenberg_print_script_module_data(): void {
	$get_marked_for_enqueue = new ReflectionMethod( 'WP_Script_Modules', 'get_marked_for_enqueue' );
	$get_marked_for_enqueue->setAccessible( true );
	$get_import_map = new ReflectionMethod( 'WP_Script_Modules', 'get_import_map' );
	$get_import_map->setAccessible( true );

	$modules = array();
	foreach ( array_keys( $get_marked_for_enqueue->invoke( wp_script_modules() ) ) as $id ) {
		$modules[ $id ] = true;
	}
	foreach ( array_keys( $get_import_map->invoke( wp_script_modules() )['imports'] ) as $id ) {
		$modules[ $id ] = true;
	}

	foreach ( array_keys( $modules ) as $module_id ) {
		/**
		 * Filters data associated with a given Script Module.
		 *
		 * Script Modules may require data that is required for initialization or is essential to
		 * have immediately available on page load. These are suitable use cases for this data.
		 *
		 * This is best suited to a minimal set of data and is not intended to replace the REST API.
		 *
		 * If the filter returns no data (an empty array), nothing will be embedded in the page.
		 *
		 * The data for a given Script Module, if provided, will be JSON serialized in a script tag
		 * with an ID like `wp-script-module-data-{$module_id}`.
		 *
		 * The dynamic portion of the hook name, `$module_id`, refers to the Script Module ID that
		 * the data is associated with.
		 *
		 * @param array $data The data that should be associated with the array.
		 */
		$data = apply_filters( "script_module_data_{$module_id}", array() );

		if ( is_array( $data ) && ! empty( $data ) ) {
			/*
			 * This data will be printed as JSON inside a script tag like this:
			 *   <script type="application/json"></script>
			 *
			 * A script tag must be closed by a sequence beginning with `</`. It's impossible to
			 * close a script tag without using `<`. We ensure that `<` is escaped and `/` can
			 * remain unescaped, so `</script>` will be printed as `\u003C/script\u00E3`.
			 *
			 *   - JSON_HEX_TAG: All < and > are converted to \u003C and \u003E.
			 *   - JSON_UNESCAPED_SLASHES: Don't escape /.
			 *
			 * If the page will use UTF-8 encoding, it's safe to print unescaped unicode:
			 *
			 *   - JSON_UNESCAPED_UNICODE: Encode multibyte Unicode characters literally (instead of as `\uXXXX`).
			 *   - JSON_UNESCAPED_LINE_TERMINATORS: The line terminators are kept unescaped when
			 *     JSON_UNESCAPED_UNICODE is supplied. It uses the same behaviour as it was
			 *     before PHP 7.1 without this constant. Available as of PHP 7.1.0.
			 *
			 * The JSON specification requires encoding in UTF-8, so if the generated HTML page
			 * is not encoded in UTF-8 then it's not safe to include those literals. They must
			 * be escaped to avoid encoding issues.
			 *
			 * @see https://www.rfc-editor.org/rfc/rfc8259.html for details on encoding requirements.
			 * @see https://www.php.net/manual/en/json.constants.php for details on these constants.
			 * @see https://html.spec.whatwg.org/#script-data-state for details on script tag parsing.
			 */
			$json_encode_flags = JSON_HEX_TAG | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_LINE_TERMINATORS;
			if ( 'UTF-8' !== get_option( 'blog_charset' ) ) {
				$json_encode_flags = JSON_HEX_TAG | JSON_UNESCAPED_SLASHES;
			}

			wp_print_inline_script_tag(
				wp_json_encode( $data, $json_encode_flags ),
				array(
					'type' => 'application/json',
					'id'   => "wp-script-module-data-{$module_id}",
				)
			);
		}
	}
}

add_action( 'wp_footer', 'gutenberg_print_script_module_data' );
add_action( 'admin_print_footer_scripts', 'gutenberg_print_script_module_data' );
