<?php
/**
 * Adds settings to the block editor.
 *
 * @package gutenberg
 */

/**
 * Replaces core 'styles' and '__experimentalFeatures' block editor settings from
 * wordpress-develop/block-editor.php with the Gutenberg versions. Much of the
 * code is copied from get_block_editor_settings() in that file.
 *
 * This hook should run first as it completely replaces the core settings that
 * other hooks may need to update.
 *
 * Note: The settings that are WP version specific should be handled inside the `compat` directory.
 *
 * @param array $settings Existing block editor settings.
 *
 * @return array New block editor settings.
 */
function gutenberg_get_block_editor_settings( $settings ) {
	$global_styles = array();
	$presets       = array(
		array(
			'css'            => 'variables',
			'__unstableType' => 'presets',
			'isGlobalStyles' => true,
		),
		array(
			'css'            => 'presets',
			'__unstableType' => 'presets',
			'isGlobalStyles' => true,
		),
	);
	foreach ( $presets as $preset_style ) {
		$actual_css = gutenberg_get_global_stylesheet( array( $preset_style['css'] ) );
		if ( '' !== $actual_css ) {
			$preset_style['css'] = $actual_css;
			$global_styles[]     = $preset_style;
		}
	}

	$block_classes = array(
		'css'            => 'styles',
		'__unstableType' => 'theme',
		'isGlobalStyles' => true,
	);
	$actual_css    = gutenberg_get_global_stylesheet( array( $block_classes['css'] ) );
	if ( '' !== $actual_css ) {
		$block_classes['css'] = $actual_css;
		$global_styles[]      = $block_classes;
	}

	// Get any additional css from the customizer and add it before global styles custom CSS.
	$global_styles[] = array(
		'css'            => wp_get_custom_css(),
		'__unstableType' => 'user',
		'isGlobalStyles' => false,
	);

	/*
	 * Add the custom CSS as a separate stylesheet so any invalid CSS
	 * entered by users does not break other global styles.
	 */
	$global_styles[] = array(
		'css'            => gutenberg_get_global_stylesheet( array( 'custom-css' ) ),
		'__unstableType' => 'user',
		'isGlobalStyles' => true,
	);

	$settings['styles'] = array_merge( $global_styles, get_block_editor_theme_styles() );

	$settings['__experimentalFeatures'] = gutenberg_get_global_settings();
	// These settings may need to be updated based on data coming from theme.json sources.
	if ( isset( $settings['__experimentalFeatures']['color']['palette'] ) ) {
		$colors_by_origin   = $settings['__experimentalFeatures']['color']['palette'];
		$settings['colors'] = $colors_by_origin['custom'] ?? $colors_by_origin['theme'] ?? $colors_by_origin['default'];
	}
	if ( isset( $settings['__experimentalFeatures']['color']['gradients'] ) ) {
		$gradients_by_origin   = $settings['__experimentalFeatures']['color']['gradients'];
		$settings['gradients'] = $gradients_by_origin['custom'] ?? $gradients_by_origin['theme'] ?? $gradients_by_origin['default'];
	}
	if ( isset( $settings['__experimentalFeatures']['typography']['fontSizes'] ) ) {
		$font_sizes_by_origin  = $settings['__experimentalFeatures']['typography']['fontSizes'];
		$settings['fontSizes'] = $font_sizes_by_origin['custom'] ?? $font_sizes_by_origin['theme'] ?? $font_sizes_by_origin['default'];
	}
	if ( isset( $settings['__experimentalFeatures']['color']['custom'] ) ) {
		$settings['disableCustomColors'] = ! $settings['__experimentalFeatures']['color']['custom'];
		unset( $settings['__experimentalFeatures']['color']['custom'] );
	}
	if ( isset( $settings['__experimentalFeatures']['color']['customGradient'] ) ) {
		$settings['disableCustomGradients'] = ! $settings['__experimentalFeatures']['color']['customGradient'];
		unset( $settings['__experimentalFeatures']['color']['customGradient'] );
	}
	if ( isset( $settings['__experimentalFeatures']['typography']['customFontSize'] ) ) {
		$settings['disableCustomFontSizes'] = ! $settings['__experimentalFeatures']['typography']['customFontSize'];
		unset( $settings['__experimentalFeatures']['typography']['customFontSize'] );
	}
	if ( isset( $settings['__experimentalFeatures']['typography']['lineHeight'] ) ) {
		$settings['enableCustomLineHeight'] = $settings['__experimentalFeatures']['typography']['lineHeight'];
		unset( $settings['__experimentalFeatures']['typography']['lineHeight'] );
	}
	if ( isset( $settings['__experimentalFeatures']['spacing']['units'] ) ) {
		$settings['enableCustomUnits'] = $settings['__experimentalFeatures']['spacing']['units'];
		unset( $settings['__experimentalFeatures']['spacing']['units'] );
	}
	if ( isset( $settings['__experimentalFeatures']['spacing']['padding'] ) ) {
		$settings['enableCustomSpacing'] = $settings['__experimentalFeatures']['spacing']['padding'];
		unset( $settings['__experimentalFeatures']['spacing']['padding'] );
	}
	if ( isset( $settings['__experimentalFeatures']['spacing']['customSpacingSize'] ) ) {
		$settings['disableCustomSpacingSizes'] = ! $settings['__experimentalFeatures']['spacing']['customSpacingSize'];
		unset( $settings['__experimentalFeatures']['spacing']['customSpacingSize'] );
	}

	if ( isset( $settings['__experimentalFeatures']['spacing']['spacingSizes'] ) ) {
		$spacing_sizes_by_origin  = $settings['__experimentalFeatures']['spacing']['spacingSizes'];
		$settings['spacingSizes'] = $spacing_sizes_by_origin['custom'] ?? $spacing_sizes_by_origin['theme'] ?? $spacing_sizes_by_origin['default'];
	}

	$settings['canEditCSS'] = current_user_can( 'edit_css' );

	return $settings;
}
add_filter( 'block_editor_settings_all', 'gutenberg_get_block_editor_settings', 0 );
/**
 * Injects view script modules into the iframed editor's resolved assets.
 *
 * WP Core's _wp_get_iframed_editor_assets() captures classic styles and scripts
 * for the editor iframe but does not include script modules. Without this filter,
 * blocks whose interactivity is implemented via viewScriptModule (e.g. using the
 * Interactivity API or any ES module) will have their JS silently skipped inside
 * the Site Editor canvas because the iframe document has no import map and no
 * <script type="module"> execution tags.
 *
 * This filter runs after Core has populated __unstableResolvedAssets and appends:
 *  1. An importmap containing every view module and its static dependencies.
 *  2. A <script type="module"> execution tag for each view module so the browser
 *     actually evaluates it inside the iframe.
 *
 * @param array $settings Block editor settings.
 * @return array Modified settings with view modules appended to resolved assets.
 */
function gutenberg_inject_view_modules_into_iframed_editor_assets( $settings ) {
	// Only proceed when Core has already populated the resolved assets scripts
	// string (i.e. iframed editor mode is active).
	if ( ! isset( $settings['__unstableResolvedAssets']['scripts'] ) ) {
		return $settings;
	}

	$script_modules = wp_script_modules();
	$block_registry = WP_Block_Type_Registry::get_instance();

	// Collect every view script module ID declared by registered block types.
	$view_module_ids = array();
	foreach ( $block_registry->get_all_registered() as $block_type ) {
		if ( ! empty( $block_type->view_script_module_ids ) ) {
			foreach ( $block_type->view_script_module_ids as $module_id ) {
				$view_module_ids[] = $module_id;
			}
		}
	}

	$view_module_ids = array_unique( $view_module_ids );

	if ( empty( $view_module_ids ) ) {
		return $settings;
	}

	// Build accessor closures that abstract over the two possible internal
	// representations of a registered module (array vs object), and also over
	// whether WP_Script_Modules exposes a public get_registered() method.
	if ( method_exists( $script_modules, 'get_registered' ) ) {
		$get_src  = static function ( $id ) use ( $script_modules ) {
			$module = $script_modules->get_registered( $id );
			return null !== $module ? ( $module['src'] ?? null ) : null;
		};
		$get_deps = static function ( $id ) use ( $script_modules ) {
			$module = $script_modules->get_registered( $id );
			return null !== $module ? ( $module['dependencies'] ?? array() ) : array();
		};
	} else {
		// Fallback: read the private $registered property via reflection.
		$reflection = new ReflectionClass( $script_modules );
		$prop       = $reflection->getProperty( 'registered' );
		$prop->setAccessible( true );
		$registered = $prop->getValue( $script_modules );

		$get_src  = static function ( $id ) use ( $registered ) {
			$module = $registered[ $id ] ?? null;
			if ( is_array( $module ) ) {
				return $module['src'] ?? null;
			}
			return is_object( $module ) ? ( $module->src ?? null ) : null;
		};
		$get_deps = static function ( $id ) use ( $registered ) {
			$module = $registered[ $id ] ?? null;
			if ( is_array( $module ) ) {
				return $module['dependencies'] ?? array();
			}
			return is_object( $module ) ? ( $module->dependencies ?? array() ) : array();
		};
	}

	// Walk the dependency graph starting from the view modules to build a
	// complete import map (module specifier → URL).
	$import_map_entries = array();
	$to_process         = $view_module_ids;
	$visited            = array();

	while ( ! empty( $to_process ) ) {
		$module_id = array_shift( $to_process );

		if ( isset( $visited[ $module_id ] ) ) {
			continue;
		}
		$visited[ $module_id ] = true;

		$src = $get_src( $module_id );
		if ( $src ) {
			$import_map_entries[ $module_id ] = $src;
		}

		foreach ( $get_deps( $module_id ) as $dep ) {
			if ( is_array( $dep ) ) {
				$dep_id = $dep['id'] ?? null;
			} elseif ( is_object( $dep ) ) {
				$dep_id = $dep->id ?? null;
			} else {
				$dep_id = $dep;
			}

			if ( $dep_id && ! isset( $visited[ $dep_id ] ) ) {
				$to_process[] = $dep_id;
			}
		}
	}

	if ( empty( $import_map_entries ) ) {
		return $settings;
	}

	// Serialize the import map. The spec requires it to appear before any
	// <script type="module"> elements; since we append everything together
	// the ordering within our addition is correct.
	$import_map_html  = '<script type="importmap" id="wp-importmap-block-view-modules">';
	$import_map_html .= wp_json_encode( array( 'imports' => $import_map_entries ), JSON_UNESCAPED_SLASHES );
	$import_map_html .= '</script>' . "\n";

	// One execution tag per view module so the browser evaluates it.
	$module_scripts_html = '';
	foreach ( $view_module_ids as $module_id ) {
		if ( ! isset( $import_map_entries[ $module_id ] ) ) {
			continue;
		}
		$safe_id              = preg_replace( '/[^a-zA-Z0-9\-_]/', '-', $module_id );
		$encoded_id           = wp_json_encode( $module_id );
		$module_scripts_html .= '<script type="module" id="' . esc_attr( $safe_id ) . '-js-module">import ' . $encoded_id . ';</script>' . "\n";
	}

	$settings['__unstableResolvedAssets']['scripts'] .= $import_map_html . $module_scripts_html;

	// Dequeue view modules from the global WP_Script_Modules queue so that
	// admin_print_footer_scripts does not also print them to the parent admin
	// page. View modules belong exclusively in the iframe canvas; having them
	// in the admin-page queue causes a second execution in the wrong window.
	foreach ( $view_module_ids as $module_id ) {
		if ( isset( $import_map_entries[ $module_id ] ) ) {
			wp_dequeue_script_module( $module_id );
		}
	}

	return $settings;
}
// Run last so __unstableResolvedAssets is already populated by Core before we append.
add_filter( 'block_editor_settings_all', 'gutenberg_inject_view_modules_into_iframed_editor_assets', PHP_INT_MAX );
