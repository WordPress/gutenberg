<?php
/**
 * Script Modules API: Script Module functions
 *
 * @since 6.5.0
 *
 * @package WordPress
 * @subpackage Script Modules
 */

if ( ! function_exists( 'wp_script_modules' ) ) {
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
	function wp_script_modules(): WP_Script_Modules {
		global $wp_script_modules;

		if ( ! ( $wp_script_modules instanceof WP_Script_Modules ) ) {
			$wp_script_modules = new WP_Script_Modules();
		}
		return $wp_script_modules;
	}
	wp_script_modules()->add_hooks();

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
			'viewScriptModule' => 'view_script_module_ids',
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
	 * @param string   $block_content  The block content.
	 * @param array    $parsed_block   The full block, including name and attributes.
	 * @param WP_Block $block_instance The block instance.
	 */
	function gutenberg_filter_render_block_enqueue_view_script_modules( $block_content, $parsed_block, $block_instance ) {
		$block_type = $block_instance->block_type;

		if ( ! empty( $block_type->view_script_module_ids ) ) {
			foreach ( $block_type->view_script_module_ids as $module_id ) {
				wp_enqueue_script_module( $module_id );
			}
		}

		return $block_content;
	}

	add_filter( 'render_block', 'gutenberg_filter_render_block_enqueue_view_script_modules', 10, 3 );

	/**
	 * Registers a REST field for block types to provide view script module IDs.
	 *
	 * Adds the `view_script_module_ids` and `view_module_ids` (deprecated) field to block type objects in the REST API, which
	 * lists the script module IDs for any script modules associated with the
	 * block's viewScriptModule key.
	 */
	function gutenberg_register_view_script_module_ids_rest_field() {
		register_rest_field(
			'block-type',
			'view_script_module_ids',
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

	add_action( 'rest_api_init', 'gutenberg_register_view_script_module_ids_rest_field' );
}

if ( ! function_exists( 'wp_register_script_module' ) ) {
	/**
	 * Registers the script module if no script module with that script module
	 * identifier has already been registered.
	 *
	 * @since 6.5.0
	 *
	 * @param string            $id       The identifier of the script module. Should be unique. It will be used in the
	 *                                    final import map.
	 * @param string            $src      Optional. Full URL of the script module, or path of the script module relative
	 *                                    to the WordPress root directory. If it is provided and the script module has
	 *                                    not been registered yet, it will be registered.
	 * @param array             $deps     {
	 *                                        Optional. List of dependencies.
	 *
	 *                                        @type string|array $0... {
	 *                                            An array of script module identifiers of the dependencies of this script
	 *                                            module. The dependencies can be strings or arrays. If they are arrays,
	 *                                            they need an `id` key with the script module identifier, and can contain
	 *                                            an `import` key with either `static` or `dynamic`. By default,
	 *                                            dependencies that don't contain an `import` key are considered static.
	 *
	 *                                            @type string $id     The script module identifier.
	 *                                            @type string $import Optional. Import type. May be either `static` or
	 *                                                                 `dynamic`. Defaults to `static`.
	 *                                        }
	 *                                    }
	 * @param string|false|null $version  Optional. String specifying the script module version number. Defaults to false.
	 *                                    It is added to the URL as a query string for cache busting purposes. If $version
	 *                                    is set to false, the version number is the currently installed WordPress version.
	 *                                    If $version is set to null, no version is added.
	 */
	function wp_register_script_module( string $id, string $src, array $deps = array(), $version = false ) {
		wp_script_modules()->register( $id, $src, $deps, $version );
	}
}

if ( ! function_exists( 'wp_enqueue_script_module' ) ) {
	/**
	 * Marks the script module to be enqueued in the page.
	 *
	 * If a src is provided and the script module has not been registered yet, it
	 * will be registered.
	 *
	 * @since 6.5.0
	 *
	 * @param string            $id       The identifier of the script module. Should be unique. It will be used in the
	 *                                    final import map.
	 * @param string            $src      Optional. Full URL of the script module, or path of the script module relative
	 *                                    to the WordPress root directory. If it is provided and the script module has
	 *                                    not been registered yet, it will be registered.
	 * @param array             $deps     {
	 *                                        Optional. List of dependencies.
	 *
	 *                                        @type string|array $0... {
	 *                                            An array of script module identifiers of the dependencies of this script
	 *                                            module. The dependencies can be strings or arrays. If they are arrays,
	 *                                            they need an `id` key with the script module identifier, and can contain
	 *                                            an `import` key with either `static` or `dynamic`. By default,
	 *                                            dependencies that don't contain an `import` key are considered static.
	 *
	 *                                            @type string $id     The script module identifier.
	 *                                            @type string $import Optional. Import type. May be either `static` or
	 *                                                                 `dynamic`. Defaults to `static`.
	 *                                        }
	 *                                    }
	 * @param string|false|null $version  Optional. String specifying the script module version number. Defaults to false.
	 *                                    It is added to the URL as a query string for cache busting purposes. If $version
	 *                                    is set to false, the version number is the currently installed WordPress version.
	 *                                    If $version is set to null, no version is added.
	 */
	function wp_enqueue_script_module( string $id, string $src = '', array $deps = array(), $version = false ) {
		wp_script_modules()->enqueue( $id, $src, $deps, $version );
	}
}

if ( ! function_exists( 'wp_dequeue_script_module' ) ) {
	/**
	 * Unmarks the script module so it is no longer enqueued in the page.
	 *
	 * @since 6.5.0
	 *
	 * @param string $id The identifier of the script module.
	 */
	function wp_dequeue_script_module( string $id ) {
		wp_script_modules()->dequeue( $id );
	}
}

if ( ! function_exists( 'wp_deregister_script_module' ) ) {
	/**
	 * Deregisters the script module.
	 *
	 * @since 6.5.0
	 *
	 * @param string $id The identifier of the script module.
	 */
	function wp_deregister_script_module( string $id ) {
		wp_script_modules()->deregister( $id );
	}
}
