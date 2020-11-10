<?php
/**
 * Functions to register client-side assets (scripts and stylesheets) for the
 * Gutenberg editor plugin.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

/**
 * Retrieves the root plugin path.
 *
 * @return string Root path to the gutenberg plugin.
 *
 * @since 0.1.0
 */
function gutenberg_dir_path() {
	return plugin_dir_path( __DIR__ );
}

/**
 * Retrieves a URL to a file in the gutenberg plugin.
 *
 * @param  string $path Relative path of the desired file.
 *
 * @return string       Fully qualified URL pointing to the desired file.
 *
 * @since 0.1.0
 */
function gutenberg_url( $path ) {
	return plugins_url( $path, __DIR__ );
}

/**
 * Registers a script according to `wp_register_script`. Honors this request by
 * reassigning internal dependency properties of any script handle already
 * registered by that name. It does not deregister the original script, to
 * avoid losing inline scripts which may have been attached.
 *
 * @since 4.1.0
 *
 * @param WP_Scripts       $scripts   WP_Scripts instance.
 * @param string           $handle    Name of the script. Should be unique.
 * @param string           $src       Full URL of the script, or path of the script relative to the WordPress root directory.
 * @param array            $deps      Optional. An array of registered script handles this script depends on. Default empty array.
 * @param string|bool|null $ver       Optional. String specifying script version number, if it has one, which is added to the URL
 *                                    as a query string for cache busting purposes. If version is set to false, a version
 *                                    number is automatically added equal to current installed WordPress version.
 *                                    If set to null, no version is added.
 * @param bool             $in_footer Optional. Whether to enqueue the script before </body> instead of in the <head>.
 *                                    Default 'false'.
 */
function gutenberg_override_script( $scripts, $handle, $src, $deps = array(), $ver = false, $in_footer = false ) {
	$script = $scripts->query( $handle, 'registered' );
	if ( $script ) {
		/*
		 * In many ways, this is a reimplementation of `wp_register_script` but
		 * bypassing consideration of whether a script by the given handle had
		 * already been registered.
		 */

		// See: `_WP_Dependency::__construct` .
		$script->src  = $src;
		$script->deps = $deps;
		$script->ver  = $ver;
		$script->args = $in_footer;

		/*
		 * The script's `group` designation is an indication of whether it is
		 * to be printed in the header or footer. The behavior here defers to
		 * the arguments as passed. Specifically, group data is not assigned
		 * for a script unless it is designated to be printed in the footer.
		 */

		// See: `wp_register_script` .
		unset( $script->extra['group'] );
		if ( $in_footer ) {
			$script->add_data( 'group', 1 );
		}
	} else {
		$scripts->add( $handle, $src, $deps, $ver, $in_footer );
	}

	/*
	 * `WP_Dependencies::set_translations` will fall over on itself if setting
	 * translations on the `wp-i18n` handle, since it internally adds `wp-i18n`
	 * as a dependency of itself, exhausting memory. The same applies for the
	 * polyfill and hooks scripts, which are dependencies _of_ `wp-i18n`.
	 *
	 * See: https://core.trac.wordpress.org/ticket/46089
	 */
	if ( ! in_array( $handle, array( 'wp-i18n', 'wp-polyfill', 'wp-hooks' ), true ) ) {
		$scripts->set_translations( $handle, 'default' );
	}

	// Remove this check once the minimum supported WordPress version is at least 5.7.
	if ( 'wp-i18n' === $handle ) {
		$ltr    = 'rtl' === _x( 'ltr', 'text direction', 'default' ) ? 'rtl' : 'ltr';
		$output = sprintf( "wp.i18n.setLocaleData( { 'text direction\u0004ltr': [ '%s' ] }, 'default' );", $ltr );
		$scripts->add_inline_script( 'wp-i18n', $output, 'after' );
	}
}

/**
 * Filters the default translation file load behavior to load the Gutenberg
 * plugin translation file, if available.
 *
 * @param string|false $file   Path to the translation file to load. False if
 *                             there isn't one.
 * @param string       $handle Name of the script to register a translation
 *                             domain to.
 *
 * @return string|false Filtered path to the Gutenberg translation file, if
 *                      available.
 */
function gutenberg_override_translation_file( $file, $handle ) {
	if ( ! $file ) {
		return $file;
	}

	// Ignore scripts whose handle does not have the "wp-" prefix.
	if ( 'wp-' !== substr( $handle, 0, 3 ) ) {
		return $file;
	}

	// Ignore scripts that are not found in the expected `build/` location.
	$script_path = gutenberg_dir_path() . 'build/' . substr( $handle, 3 ) . '/index.js';
	if ( ! file_exists( $script_path ) ) {
		return $file;
	}

	/*
	 * The default file will be in the plugins language directory, omitting the
	 * domain since Gutenberg assigns the script translations as the default.
	 *
	 * Example: /www/wp-content/languages/plugins/de_DE-07d88e6a803e01276b9bfcc1203e862e.json
	 *
	 * The logic of `load_script_textdomain` is such that it will assume to
	 * search in the plugins language directory, since the assigned source of
	 * the overridden Gutenberg script originates in the plugins directory.
	 *
	 * The plugin translation files each begin with the slug of the plugin, so
	 * it's a simple matter of prepending the Gutenberg plugin slug.
	 */
	$path_parts              = pathinfo( $file );
	$plugin_translation_file = (
		$path_parts['dirname'] .
		'/gutenberg-' .
		$path_parts['basename']
	);

	return $plugin_translation_file;
}
add_filter( 'load_script_translation_file', 'gutenberg_override_translation_file', 10, 2 );

/**
 * Registers a style according to `wp_register_style`. Honors this request by
 * deregistering any style by the same handler before registration.
 *
 * @since 4.1.0
 *
 * @param WP_Styles        $styles WP_Styles instance.
 * @param string           $handle Name of the stylesheet. Should be unique.
 * @param string           $src    Full URL of the stylesheet, or path of the stylesheet relative to the WordPress root directory.
 * @param array            $deps   Optional. An array of registered stylesheet handles this stylesheet depends on. Default empty array.
 * @param string|bool|null $ver    Optional. String specifying stylesheet version number, if it has one, which is added to the URL
 *                                 as a query string for cache busting purposes. If version is set to false, a version
 *                                 number is automatically added equal to current installed WordPress version.
 *                                 If set to null, no version is added.
 * @param string           $media  Optional. The media for which this stylesheet has been defined.
 *                                 Default 'all'. Accepts media types like 'all', 'print' and 'screen', or media queries like
 *                                 '(orientation: portrait)' and '(max-width: 640px)'.
 */
function gutenberg_override_style( $styles, $handle, $src, $deps = array(), $ver = false, $media = 'all' ) {
	$style = $styles->query( $handle, 'registered' );
	if ( $style ) {
		$styles->remove( $handle );
	}
	$styles->add( $handle, $src, $deps, $ver, $media );
}

/**
 * Registers vendor JavaScript files to be used as dependencies of the editor
 * and plugins.
 *
 * This function is called from a script during the plugin build process, so it
 * should not call any WordPress PHP functions.
 *
 * @since 0.1.0
 *
 * @param WP_Scripts $scripts WP_Scripts instance.
 */
function gutenberg_register_vendor_scripts( $scripts ) {
	$suffix = SCRIPT_DEBUG ? '' : '.min';

	$react_suffix = ( SCRIPT_DEBUG ? '.development' : '.production' ) . $suffix;
	gutenberg_register_vendor_script(
		$scripts,
		'react',
		'https://unpkg.com/react@17.0.1/umd/react' . $react_suffix . '.js',
		array( 'wp-polyfill' )
	);
	gutenberg_register_vendor_script(
		$scripts,
		'react-dom',
		'https://unpkg.com/react-dom@17.0.1/umd/react-dom' . $react_suffix . '.js',
		array( 'react' )
	);

	/*
	 * This script registration and the corresponding function should be removed
	 * removed once the plugin is updated to support WordPress 5.7.0 and newer.
	 */
	gutenberg_register_vendor_script(
		$scripts,
		'object-fit-polyfill',
		'https://unpkg.com/objectFitPolyfill@2.3.5/dist/objectFitPolyfill.min.js',
		array(),
		'2.3.5'
	);
}
add_action( 'wp_default_scripts', 'gutenberg_register_vendor_scripts' );

/**
 * Registers all the WordPress packages scripts that are in the standardized
 * `build/` location.
 *
 * @since 4.5.0
 *
 * @param WP_Scripts $scripts WP_Scripts instance.
 */
function gutenberg_register_packages_scripts( $scripts ) {
	// When in production, use the plugin's version as the default asset version;
	// else (for development or test) default to use the current time.
	$default_version = defined( 'GUTENBERG_VERSION' ) && ! ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) ? GUTENBERG_VERSION : time();

	foreach ( glob( gutenberg_dir_path() . 'build/*/index.js' ) as $path ) {
		// Prefix `wp-` to package directory to get script handle.
		// For example, `…/build/a11y/index.js` becomes `wp-a11y`.
		$handle = 'wp-' . basename( dirname( $path ) );

		// Replace `.js` extension with `.asset.php` to find the generated dependencies file.
		$asset_file   = substr( $path, 0, -3 ) . '.asset.php';
		$asset        = file_exists( $asset_file )
			? require( $asset_file )
			: null;
		$dependencies = isset( $asset['dependencies'] ) ? $asset['dependencies'] : array();
		$version      = isset( $asset['version'] ) ? $asset['version'] : $default_version;

		// Add dependencies that cannot be detected and generated by build tools.
		switch ( $handle ) {
			case 'wp-block-library':
				array_push( $dependencies, 'editor' );
				break;

			case 'wp-edit-post':
				array_push( $dependencies, 'media-models', 'media-views', 'postbox' );
				break;

			case 'wp-edit-site':
				array_push( $dependencies, 'wp-dom-ready' );
				break;
		}

		// Get the path from Gutenberg directory as expected by `gutenberg_url`.
		$gutenberg_path = substr( $path, strlen( gutenberg_dir_path() ) );

		gutenberg_override_script(
			$scripts,
			$handle,
			gutenberg_url( $gutenberg_path ),
			$dependencies,
			$version,
			true
		);
	}
}
add_action( 'wp_default_scripts', 'gutenberg_register_packages_scripts' );

/**
 * Registers all the WordPress packages styles that are in the standardized
 * `build/` location.
 *
 * @since 6.7.0

 * @param WP_Styles $styles WP_Styles instance.
 */
function gutenberg_register_packages_styles( $styles ) {
	// When in production, use the plugin's version as the asset version;
	// else (for development or test) default to use the current time.
	$version = defined( 'GUTENBERG_VERSION' ) && ! ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) ? GUTENBERG_VERSION : time();

	// Editor Styles.
	gutenberg_override_style(
		$styles,
		'wp-block-editor',
		gutenberg_url( 'build/block-editor/style.css' ),
		array( 'wp-components' ),
		$version
	);
	$styles->add_data( 'wp-block-editor', 'rtl', 'replace' );

	gutenberg_override_style(
		$styles,
		'wp-editor',
		gutenberg_url( 'build/editor/style.css' ),
		array( 'wp-components', 'wp-block-editor', 'wp-nux', 'wp-reusable-blocks' ),
		$version
	);
	$styles->add_data( 'wp-editor', 'rtl', 'replace' );

	gutenberg_override_style(
		$styles,
		'wp-edit-post',
		gutenberg_url( 'build/edit-post/style.css' ),
		array( 'wp-components', 'wp-block-editor', 'wp-editor', 'wp-edit-blocks', 'wp-block-library', 'wp-nux' ),
		$version
	);
	$styles->add_data( 'wp-edit-post', 'rtl', 'replace' );

	gutenberg_override_style(
		$styles,
		'wp-components',
		gutenberg_url( 'build/components/style.css' ),
		array( 'dashicons' ),
		$version
	);
	$styles->add_data( 'wp-components', 'rtl', 'replace' );

	$block_library_filename = gutenberg_should_load_separate_block_assets() ? 'common' : 'style';
	gutenberg_override_style(
		$styles,
		'wp-block-library',
		gutenberg_url( 'build/block-library/' . $block_library_filename . '.css' ),
		array(),
		$version
	);
	$styles->add_data( 'wp-block-library', 'rtl', 'replace' );
	$styles->add_data( 'wp-block-library', 'path', gutenberg_dir_path() . 'build/block-library/' . $block_library_filename . '.css' );

	gutenberg_override_style(
		$styles,
		'wp-format-library',
		gutenberg_url( 'build/format-library/style.css' ),
		array( 'wp-block-editor', 'wp-components' ),
		$version
	);
	$styles->add_data( 'wp-format-library', 'rtl', 'replace' );

	$wp_edit_blocks_dependencies = array(
		'wp-components',
		'wp-editor',
		// This need to be added before the block library styles,
		// The block library styles override the "reset" styles.
		'wp-reset-editor-styles',
		'wp-block-library',
		'wp-reusable-blocks',
	);

	// Only load the default layout and margin styles for themes without theme.json file.
	if ( ! WP_Theme_JSON_Resolver::theme_has_support() ) {
		$wp_edit_blocks_dependencies[] = 'wp-editor-classic-layout-styles';
	}

	global $editor_styles;
	if ( ! is_array( $editor_styles ) || count( $editor_styles ) === 0 ) {
		// Include opinionated block styles if no $editor_styles are declared, so the editor never appears broken.
		$wp_edit_blocks_dependencies[] = 'wp-block-library-theme';
	}

	gutenberg_override_style(
		$styles,
		'wp-reset-editor-styles',
		gutenberg_url( 'build/block-library/reset.css' ),
		array( 'common', 'forms' ), // Make sure the reset is loaded after the default WP Adminn styles.
		$version
	);
	$styles->add_data( 'wp-reset-editor-styles', 'rtl', 'replace' );

	gutenberg_override_style(
		$styles,
		'wp-editor-classic-layout-styles',
		gutenberg_url( 'build/edit-post/classic.css' ),
		array(),
		$version
	);
	$styles->add_data( 'wp-editor-classic-layout-styles', 'rtl', 'replace' );

	gutenberg_override_style(
		$styles,
		'wp-edit-blocks',
		gutenberg_url( 'build/block-library/editor.css' ),
		$wp_edit_blocks_dependencies,
		$version
	);
	$styles->add_data( 'wp-edit-blocks', 'rtl', 'replace' );

	gutenberg_override_style(
		$styles,
		'wp-nux',
		gutenberg_url( 'build/nux/style.css' ),
		array( 'wp-components' ),
		$version
	);
	$styles->add_data( 'wp-nux', 'rtl', 'replace' );

	gutenberg_override_style(
		$styles,
		'wp-block-library-theme',
		gutenberg_url( 'build/block-library/theme.css' ),
		array(),
		$version
	);
	$styles->add_data( 'wp-block-library-theme', 'rtl', 'replace' );

	gutenberg_override_style(
		$styles,
		'wp-list-reusable-blocks',
		gutenberg_url( 'build/list-reusable-blocks/style.css' ),
		array( 'wp-components' ),
		$version
	);
	$styles->add_data( 'wp-list-reusable-block', 'rtl', 'replace' );

	gutenberg_override_style(
		$styles,
		'wp-edit-navigation',
		gutenberg_url( 'build/edit-navigation/style.css' ),
		array( 'wp-components', 'wp-block-editor', 'wp-edit-blocks' ),
		$version
	);
	$styles->add_data( 'wp-edit-navigation', 'rtl', 'replace' );

	gutenberg_override_style(
		$styles,
		'wp-edit-site',
		gutenberg_url( 'build/edit-site/style.css' ),
		array( 'wp-components', 'wp-block-editor', 'wp-edit-blocks' ),
		$version
	);
	$styles->add_data( 'wp-edit-site', 'rtl', 'replace' );

	gutenberg_override_style(
		$styles,
		'wp-edit-widgets',
		gutenberg_url( 'build/edit-widgets/style.css' ),
		array( 'wp-components', 'wp-block-editor', 'wp-edit-blocks', 'wp-reusable-blocks' ),
		$version
	);
	$styles->add_data( 'wp-edit-widgets', 'rtl', 'replace' );

	gutenberg_override_style(
		$styles,
		'wp-block-directory',
		gutenberg_url( 'build/block-directory/style.css' ),
		array( 'wp-block-editor', 'wp-components' ),
		$version
	);
	$styles->add_data( 'wp-block-directory', 'rtl', 'replace' );

	gutenberg_override_style(
		$styles,
		'wp-customize-widgets',
		gutenberg_url( 'build/customize-widgets/style.css' ),
		array( 'wp-components', 'wp-block-editor', 'wp-edit-blocks' ),
		$version
	);
	$styles->add_data( 'wp-customize-widgets', 'rtl', 'replace' );

	gutenberg_override_style(
		$styles,
		'wp-reusable-blocks',
		gutenberg_url( 'build/reusable-blocks/style.css' ),
		array( 'wp-components' ),
		$version
	);
	$styles->add_data( 'wp-reusable-block', 'rtl', 'replace' );
}
add_action( 'wp_default_styles', 'gutenberg_register_packages_styles' );

/**
 * Registers common scripts and styles to be used as dependencies of the editor
 * and plugins.
 *
 * @since 0.1.0
 */
function gutenberg_enqueue_block_editor_assets() {
	if ( defined( 'GUTENBERG_LIVE_RELOAD' ) && GUTENBERG_LIVE_RELOAD ) {
		$live_reload_url = ( GUTENBERG_LIVE_RELOAD === true ) ? 'http://localhost:35729/livereload.js' : GUTENBERG_LIVE_RELOAD;

		wp_enqueue_script(
			'gutenberg-live-reload',
			$live_reload_url
		);
	}
}
add_action( 'enqueue_block_editor_assets', 'gutenberg_enqueue_block_editor_assets' );

/**
 * Retrieves a unique and reasonably short and human-friendly filename for a
 * vendor script based on a URL and the script handle.
 *
 * @param  string $handle The name of the script.
 * @param  string $src    Full URL of the external script.
 *
 * @return string         Script filename suitable for local caching.
 *
 * @since 0.1.0
 */
function gutenberg_vendor_script_filename( $handle, $src ) {
	$filename = basename( $src );
	$match    = preg_match(
		'/^'
		. '(?P<ignore>.*?)'
		. '(?P<suffix>\.min)?'
		. '(?P<extension>\.js)'
		. '(?P<extra>.*)'
		. '$/',
		$filename,
		$filename_pieces
	);

	$prefix = $handle;
	$suffix = $match ? $filename_pieces['suffix'] : '';
	$hash   = substr( md5( $src ), 0, 8 );

	return "${prefix}${suffix}.${hash}.js";
}

/**
 * Registers a vendor script from a URL, preferring a locally cached version if
 * possible, or downloading it if the cached version is unavailable or
 * outdated.
 *
 * @param WP_Scripts       $scripts   WP_Scripts instance.
 * @param string           $handle    Name of the script.
 * @param string           $src       Full URL of the external script.
 * @param array            $deps      Optional. An array of registered script handles this
 *                                    script depends on.
 * @param string|bool|null $ver       Optional. String specifying script version number, if it has one, which is added to the URL
 *                                    as a query string for cache busting purposes. If version is set to false, a version
 *                                    number is automatically added equal to current installed WordPress version.
 *                                    If set to null, no version is added.
 * @param bool             $in_footer Optional. Whether to enqueue the script before </body> instead of in the <head>.
 *                                    Default 'false'.
 *
 * @since 0.1.0
 */
function gutenberg_register_vendor_script( $scripts, $handle, $src, $deps = array(), $ver = null, $in_footer = false ) {
	if ( defined( 'GUTENBERG_LOAD_VENDOR_SCRIPTS' ) && ! GUTENBERG_LOAD_VENDOR_SCRIPTS ) {
		return;
	}

	$filename = gutenberg_vendor_script_filename( $handle, $src );

	if ( defined( 'GUTENBERG_LIST_VENDOR_ASSETS' ) && GUTENBERG_LIST_VENDOR_ASSETS ) {
		echo "$src|$filename\n";
		return;
	}

	$full_path = gutenberg_dir_path() . 'vendor/' . $filename;

	$needs_fetch = (
		defined( 'GUTENBERG_DEVELOPMENT_MODE' ) && GUTENBERG_DEVELOPMENT_MODE && (
			! file_exists( $full_path ) ||
			time() - filemtime( $full_path ) >= DAY_IN_SECONDS
		)
	);

	if ( $needs_fetch ) {
		// Determine whether we can write to this file.  If not, don't waste
		// time doing a network request.
		// @codingStandardsIgnoreStart

		$is_writable = is_writable( $full_path );
		if ( $is_writable ) {
			$f = @fopen( $full_path, 'a' );
			if ( ! $f ) {
				$is_writable = false;
			} else {
				fclose( $f );
			}
		}

		// @codingStandardsIgnoreEnd
		if ( ! $is_writable ) {
			// Failed to open the file for writing, probably due to server
			// permissions.  Enqueue the script directly from the URL instead.
			gutenberg_override_script( $scripts, $handle, $src, $deps, $ver, $in_footer );
			return;
		}

		$response = wp_remote_get( $src );
		if ( wp_remote_retrieve_response_code( $response ) === 200 ) {
			$f = fopen( $full_path, 'w' );
			fwrite( $f, wp_remote_retrieve_body( $response ) );
			fclose( $f );
		} elseif ( ! filesize( $full_path ) ) {
			// The request failed. If the file is already cached, continue to
			// use this file. If not, then unlink the 0 byte file, and enqueue
			// the script directly from the URL.
			gutenberg_override_script( $scripts, $handle, $src, $deps, $ver, $in_footer );
			unlink( $full_path );
			return;
		}
	}
	gutenberg_override_script(
		$scripts,
		$handle,
		gutenberg_url( 'vendor/' . $filename ),
		$deps,
		$ver,
		$in_footer
	);
}

/**
 * Extends block editor settings to remove the Gutenberg's `editor-styles.css`;
 *
 * @param array $settings Default editor settings.
 *
 * @return array Filtered editor settings.
 */
function gutenberg_extend_block_editor_styles( $settings ) {
	if ( empty( $settings['styles'] ) ) {
		$settings['styles'] = array();
	} else {
		/*
		 * WordPress versions prior to 5.8 include a legacy editor styles file
		 * that need to be removed.
		 * This code can be removed from the Gutenberg plugin when the supported WP
		 * version is 5.8
		 */
		$default_styles_file = is_rtl() ?
			ABSPATH . WPINC . '/css/dist/editor/editor-styles-rtl.css' :
			ABSPATH . WPINC . '/css/dist/editor/editor-styles.css';

		if ( file_exists( $default_styles_file ) ) {
			$default_styles = file_get_contents(
				$default_styles_file
			);

			/*
			* Iterate backwards from the end of the array since the preferred
			* insertion point in case not found is prepended as first entry.
			*/
			for ( $i = count( $settings['styles'] ) - 1; $i >= 0; $i-- ) {
				if ( isset( $settings['styles'][ $i ]['css'] ) &&
						$default_styles === $settings['styles'][ $i ]['css'] ) {
					break;
				}
			}

			if ( isset( $i ) && $i >= 0 ) {
				unset( $settings['styles'][ $i ] );
			}
		}
	}

	// Remove the default font editor styles for FSE themes.
	if ( WP_Theme_JSON_Resolver::theme_has_support() ) {
		foreach ( $settings['styles'] as $j => $style ) {
			if ( 0 === strpos( $style['css'], 'body { font-family:' ) ) {
				unset( $settings['styles'][ $j ] );
			}
		}
	}

	return $settings;
}
add_filter( 'block_editor_settings', 'gutenberg_extend_block_editor_styles' );

/**
 * Adds a flag to the editor settings to know whether we're in FSE theme or not.
 *
 * @param array $settings Default editor settings.
 *
 * @return array Filtered editor settings.
 */
function gutenberg_extend_block_editor_settings_with_fse_theme_flag( $settings ) {
	$settings['supportsTemplateMode'] = gutenberg_supports_block_templates();

	// Enable the new layout options for themes with a theme.json file.
	$settings['supportsLayout'] = WP_Theme_JSON_Resolver::theme_has_support();

	return $settings;
}
add_filter( 'block_editor_settings', 'gutenberg_extend_block_editor_settings_with_fse_theme_flag' );

/**
 * Sets the editor styles to be consumed by JS.
 */
function gutenberg_extend_block_editor_styles_html() {
	$handles = array(
		'wp-block-editor',
		'wp-block-library',
		'wp-edit-blocks',
	);

	$block_registry = WP_Block_Type_Registry::get_instance();

	foreach ( $block_registry->get_all_registered() as $block_type ) {
		if ( ! empty( $block_type->style ) ) {
			$handles[] = $block_type->style;
		}

		if ( ! empty( $block_type->editor_style ) ) {
			$handles[] = $block_type->editor_style;
		}
	}

	$handles = array_unique( $handles );
	$done    = wp_styles()->done;

	ob_start();

	wp_styles()->done = array();
	wp_styles()->do_items( $handles );
	wp_styles()->done = $done;

	$editor_styles = wp_json_encode( array( 'html' => ob_get_clean() ) );

	echo "<script>window.__editorStyles = $editor_styles</script>";
}
add_action( 'admin_footer-toplevel_page_gutenberg-edit-site', 'gutenberg_extend_block_editor_styles_html' );

/**
 * Adds a polyfill for object-fit in environments which do not support it.
 *
 * The script registration occurs in `gutenberg_register_vendor_scripts`, which
 * should be removed in coordination with this function.
 *
 * Remove this when the minimum supported version is WordPress 5.7
 *
 * @see gutenberg_register_vendor_scripts
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/object-fit
 *
 * @since 9.1.0
 *
 * @param WP_Scripts $scripts WP_Scripts object.
 */
function gutenberg_add_object_fit_polyfill( $scripts ) {
	did_action( 'init' ) && $scripts->add_inline_script(
		'wp-polyfill',
		wp_get_script_polyfill(
			$scripts,
			array(
				'"objectFit" in document.documentElement.style' => 'object-fit-polyfill',
			)
		)
	);
}
add_action( 'wp_default_scripts', 'gutenberg_add_object_fit_polyfill', 20 );
