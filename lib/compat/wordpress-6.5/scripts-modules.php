<?php
/**
 * Script Modules API: Module functions
 *
 * @since 6.5.0
 *
 * @package WordPress
 * @subpackage Script Modules
 */

/**
 * Retrieves the main WP_Script_Modules instance.
 *
 * This function provides access to the WP_Script_Modules instance, creating one
 * if it doesn't exist yet.
 *
 * @since 6.5.0
 *
 * @return WP_Script_Modules The main WP_Script_Modules instance.
 */
function gutenberg_modules() {
	static $instance = null;
	if ( is_null( $instance ) ) {
		$instance = new WP_Script_Modules();
		$instance->add_hooks();
	}
	return $instance;
}

/**
 * Registers the module if no module with that module identifier has already
 * been registered.
 *
 * @since 6.5.0
 *
 * @param string                                                        $module_id The identifier of the module.
 *                                                                                 Should be unique. It will be used
 *                                                                                 in the final import map.
 * @param string                                                        $src       Full URL of the module, or path of
 *                                                                                 the module relative to the
 *                                                                                 WordPress root directory.
 * @param array<string|array{id: string, import?: 'static'|'dynamic' }> $deps      Optional. An array of module
 *                                                                                 identifiers of the dependencies of
 *                                                                                 this module. The dependencies can
 *                                                                                 be strings or arrays. If they are
 *                                                                                 arrays, they need an `id` key with
 *                                                                                 the module identifier, and can
 *                                                                                 contain an `import` key with either
 *                                                                                 `static` or `dynamic`. By default,
 *                                                                                 dependencies that don't contain an
 *                                                                                 `import` key are considered static.
 * @param string|false|null                                             $version   Optional. String specifying the
 *                                                                                 module version number. Defaults to
 *                                                                                 false. It is added to the URL as a
 *                                                                                 query string for cache busting
 *                                                                                 purposes. If $version is set to
 *                                                                                 false, the version number is the
 *                                                                                 currently installed WordPress
 *                                                                                 version. If $version is set to
 *                                                                                 null, no version is added.
 */
function gutenberg_register_module( $module_id, $src, $deps = array(), $version = false ) {
	gutenberg_modules()->register( $module_id, $src, $deps, $version );
}

/**
 * Marks the module to be enqueued in the page.
 *
 * If a src is provided and the module has not been registered yet, it will be
 * registered.
 *
 * @since 6.5.0
 *
 * @param string                                                        $module_id The identifier of the module.
 *                                                                                 Should be unique. It will be used
 *                                                                                 in the final import map.
 * @param string                                                        $src       Optional. Full URL of the module,
 *                                                                                 or path of the module relative to
 *                                                                                 the WordPress root directory. If
 *                                                                                 it is provided and the module has
 *                                                                                 not been registered yet, it will be
 *                                                                                 registered.
 * @param array<string|array{id: string, import?: 'static'|'dynamic' }> $deps      Optional. An array of module
 *                                                                                 identifiers of the dependencies of
 *                                                                                 this module. The dependencies can
 *                                                                                 be strings or arrays. If they are
 *                                                                                 arrays, they need an `id` key with
 *                                                                                 the module identifier, and can
 *                                                                                 contain an `import` key with either
 *                                                                                 `static` or `dynamic`. By default,
 *                                                                                 dependencies that don't contain an
 *                                                                                 `import` key are considered static.
 * @param string|false|null                                             $version   Optional. String specifying the
 *                                                                                 module version number. Defaults to
 *                                                                                 false. It is added to the URL as a
 *                                                                                 query string for cache busting
 *                                                                                 purposes. If $version is set to
 *                                                                                 false, the version number is the
 *                                                                                 currently installed WordPress
 *                                                                                 version. If $version is set to
 *                                                                                 null, no version is added.
 */
function gutenberg_enqueue_module( $module_id, $src = '', $deps = array(), $version = false ) {
	gutenberg_modules()->enqueue( $module_id, $src, $deps, $version );
}

/**
 * Unmarks the module so it is no longer enqueued in the page.
 *
 * @since 6.5.0
 *
 * @param string $module_id The identifier of the module.
 */
function gutenberg_dequeue_module( $module_id ) {
	gutenberg_modules()->dequeue( $module_id );
}

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
