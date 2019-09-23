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
	return plugin_dir_path( dirname( __FILE__ ) );
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
	return plugins_url( $path, dirname( __FILE__ ) );
}

/**
 * Registers a script according to `wp_register_script`. Honors this request by
 * reassigning internal dependency properties of any script handle already
 * registered by that name. It does not deregister the original script, to
 * avoid losing inline scripts which may have been attached.
 *
 * @since 4.1.0
 *
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
function gutenberg_override_script( $handle, $src, $deps = array(), $ver = false, $in_footer = false ) {
	global $wp_scripts;

	$script = $wp_scripts->query( $handle, 'registered' );
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
		wp_register_script( $handle, $src, $deps, $ver, $in_footer );
	}

	/*
	 * `WP_Dependencies::set_translations` will fall over on itself if setting
	 * translations on the `wp-i18n` handle, since it internally adds `wp-i18n`
	 * as a dependency of itself, exhausting memory. The same applies for the
	 * polyfill script, which is a dependency _of_ `wp-i18n`.
	 *
	 * See: https://core.trac.wordpress.org/ticket/46089
	 */
	if ( 'wp-i18n' !== $handle && 'wp-polyfill' !== $handle ) {
		wp_set_script_translations( $handle, 'default' );
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

	if ( ! is_readable( $plugin_translation_file ) ) {
		return $file;
	}

	return $plugin_translation_file;
}
add_filter( 'load_script_translation_file', 'gutenberg_override_translation_file', 10, 2 );

/**
 * Registers a style according to `wp_register_style`. Honors this request by
 * deregistering any style by the same handler before registration.
 *
 * @since 4.1.0
 *
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
function gutenberg_override_style( $handle, $src, $deps = array(), $ver = false, $media = 'all' ) {
	wp_deregister_style( $handle );
	wp_register_style( $handle, $src, $deps, $ver, $media );
}

/**
 * Registers all the WordPress packages scripts that are in the standardized
 * `build/` location.
 *
 * @since 4.5.0
 */
function gutenberg_register_packages_scripts() {
	foreach ( glob( gutenberg_dir_path() . 'build/*/index.js' ) as $path ) {
		// Prefix `wp-` to package directory to get script handle.
		// For example, `…/build/a11y/index.js` becomes `wp-a11y`.
		$handle = 'wp-' . basename( dirname( $path ) );

		// Replace `.js` extension with `.asset.php` to find the generated dependencies file.
		$asset_file   = substr( $path, 0, -3 ) . '.asset.php';
		$asset        = file_exists( $asset_file )
			? require_once( $asset_file )
			: null;
		$dependencies = isset( $asset['dependencies'] ) ? $asset['dependencies'] : array();
		$version      = isset( $asset['version'] ) ? $asset['version'] : filemtime( $path );

		// Add dependencies that cannot be detected and generated by build tools.
		switch ( $handle ) {
			case 'wp-block-library':
				array_push( $dependencies, 'editor' );
				break;

			case 'wp-edit-post':
				array_push( $dependencies, 'media-models', 'media-views', 'postbox' );
				break;
		}

		// Get the path from Gutenberg directory as expected by `gutenberg_url`.
		$gutenberg_path = substr( $path, strlen( gutenberg_dir_path() ) );

		gutenberg_override_script(
			$handle,
			gutenberg_url( $gutenberg_path ),
			$dependencies,
			$version,
			true
		);
	}
}

/**
 * Registers common scripts and styles to be used as dependencies of the editor
 * and plugins.
 *
 * @since 0.1.0
 */
function gutenberg_register_scripts_and_styles() {
	global $wp_scripts;

	gutenberg_register_vendor_scripts();
	gutenberg_register_packages_scripts();

	// Add nonce middleware which accounts for the absence of the heartbeat
	// listener. This relies on API Fetch implementation running middlewares in
	// order of last added, and that the original nonce middleware would defer
	// to an X-WP-Nonce header already being present. This inline script should
	// be removed once the following Core ticket is resolved in assigning the
	// nonce received from heartbeat to the created middleware.
	//
	// See: https://core.trac.wordpress.org/ticket/46107 .
	// See: https://github.com/WordPress/gutenberg/pull/13451 .
	global $wp_scripts;
	if ( isset( $wp_scripts->registered['wp-api-fetch'] ) ) {
		$wp_scripts->registered['wp-api-fetch']->deps[] = 'wp-hooks';
	}
	wp_add_inline_script(
		'wp-api-fetch',
		sprintf(
			'wp.apiFetch.nonceMiddleware = wp.apiFetch.createNonceMiddleware( "%s" );' .
			'wp.apiFetch.use( wp.apiFetch.nonceMiddleware );' .
			'wp.apiFetch.nonceEndpoint = "%s";',
			( wp_installing() && ! is_multisite() ) ? '' : wp_create_nonce( 'wp_rest' ),
			admin_url( 'admin-ajax.php?action=gutenberg_rest_nonce' )
		),
		'after'
	);

	// TEMPORARY: Core does not (yet) provide persistence migration from the
	// introduction of the block editor and still calls the data plugins.
	// We unset the existing inline scripts first.
	$wp_scripts->registered['wp-data']->extra['after'] = array();
	wp_add_inline_script(
		'wp-data',
		implode(
			"\n",
			array(
				'( function() {',
				'	var userId = ' . get_current_user_ID() . ';',
				'	var storageKey = "WP_DATA_USER_" + userId;',
				'	wp.data',
				'		.use( wp.data.plugins.persistence, { storageKey: storageKey } );',
				'	wp.data.plugins.persistence.__unstableMigrate( { storageKey: storageKey } );',
				'} )();',
			)
		)
	);

	// Editor Styles.
	// This empty stylesheet is defined to ensure backward compatibility.
	gutenberg_override_style( 'wp-blocks', false );

	gutenberg_override_style(
		'wp-block-editor',
		gutenberg_url( 'build/block-editor/style.css' ),
		array( 'wp-components', 'wp-editor-font' ),
		filemtime( gutenberg_dir_path() . 'build/editor/style.css' )
	);
	wp_style_add_data( 'wp-block-editor', 'rtl', 'replace' );

	gutenberg_override_style(
		'wp-editor',
		gutenberg_url( 'build/editor/style.css' ),
		array( 'wp-components', 'wp-block-editor', 'wp-nux', 'wp-block-directory' ),
		filemtime( gutenberg_dir_path() . 'build/editor/style.css' )
	);
	wp_style_add_data( 'wp-editor', 'rtl', 'replace' );

	gutenberg_override_style(
		'wp-edit-post',
		gutenberg_url( 'build/edit-post/style.css' ),
		array( 'wp-components', 'wp-block-editor', 'wp-editor', 'wp-edit-blocks', 'wp-block-library', 'wp-nux' ),
		filemtime( gutenberg_dir_path() . 'build/edit-post/style.css' )
	);
	wp_style_add_data( 'wp-edit-post', 'rtl', 'replace' );

	gutenberg_override_style(
		'wp-components',
		gutenberg_url( 'build/components/style.css' ),
		array(),
		filemtime( gutenberg_dir_path() . 'build/components/style.css' )
	);
	wp_style_add_data( 'wp-components', 'rtl', 'replace' );

	gutenberg_override_style(
		'wp-block-library',
		gutenberg_url( 'build/block-library/style.css' ),
		array(),
		filemtime( gutenberg_dir_path() . 'build/block-library/style.css' )
	);
	wp_style_add_data( 'wp-block-library', 'rtl', 'replace' );

	gutenberg_override_style(
		'wp-format-library',
		gutenberg_url( 'build/format-library/style.css' ),
		array( 'wp-block-editor', 'wp-components' ),
		filemtime( gutenberg_dir_path() . 'build/format-library/style.css' )
	);
	wp_style_add_data( 'wp-format-library', 'rtl', 'replace' );

	gutenberg_override_style(
		'wp-edit-blocks',
		gutenberg_url( 'build/block-library/editor.css' ),
		array(
			'wp-components',
			'wp-editor',
			'wp-block-library',
			// Always include visual styles so the editor never appears broken.
			'wp-block-library-theme',
		),
		filemtime( gutenberg_dir_path() . 'build/block-library/editor.css' )
	);
	wp_style_add_data( 'wp-edit-blocks', 'rtl', 'replace' );

	gutenberg_override_style(
		'wp-nux',
		gutenberg_url( 'build/nux/style.css' ),
		array( 'wp-components' ),
		filemtime( gutenberg_dir_path() . 'build/nux/style.css' )
	);
	wp_style_add_data( 'wp-nux', 'rtl', 'replace' );

	gutenberg_override_style(
		'wp-block-library-theme',
		gutenberg_url( 'build/block-library/theme.css' ),
		array(),
		filemtime( gutenberg_dir_path() . 'build/block-library/theme.css' )
	);
	wp_style_add_data( 'wp-block-library-theme', 'rtl', 'replace' );

	gutenberg_override_style(
		'wp-list-reusable-blocks',
		gutenberg_url( 'build/list-reusable-blocks/style.css' ),
		array( 'wp-components' ),
		filemtime( gutenberg_dir_path() . 'build/list-reusable-blocks/style.css' )
	);
	wp_style_add_data( 'wp-list-reusable-block', 'rtl', 'replace' );

	gutenberg_override_style(
		'wp-edit-widgets',
		gutenberg_url( 'build/edit-widgets/style.css' ),
		array( 'wp-components', 'wp-block-editor', 'wp-edit-blocks' ),
		filemtime( gutenberg_dir_path() . 'build/edit-widgets/style.css' )
	);
	wp_style_add_data( 'wp-edit-widgets', 'rtl', 'replace' );

	gutenberg_override_style(
		'wp-block-directory',
		gutenberg_url( 'build/block-directory/style.css' ),
		array( 'wp-components' ),
		filemtime( gutenberg_dir_path() . 'build/block-directory/style.css' )
	);
	wp_style_add_data( 'wp-block-directory', 'rtl', 'replace' );

	if ( defined( 'GUTENBERG_LIVE_RELOAD' ) && GUTENBERG_LIVE_RELOAD ) {
		$live_reload_url = ( GUTENBERG_LIVE_RELOAD === true ) ? 'http://localhost:35729/livereload.js' : GUTENBERG_LIVE_RELOAD;

		wp_enqueue_script(
			'gutenberg-live-reload',
			$live_reload_url
		);
	}
}
add_action( 'wp_enqueue_scripts', 'gutenberg_register_scripts_and_styles', 5 );
add_action( 'admin_enqueue_scripts', 'gutenberg_register_scripts_and_styles', 5 );

/**
 * Registers vendor JavaScript files to be used as dependencies of the editor
 * and plugins.
 *
 * This function is called from a script during the plugin build process, so it
 * should not call any WordPress PHP functions.
 *
 * @since 0.1.0
 */
function gutenberg_register_vendor_scripts() {
	$suffix = SCRIPT_DEBUG ? '' : '.min';

	// Vendor Scripts.
	$react_suffix = ( SCRIPT_DEBUG ? '.development' : '.production' ) . $suffix;

	gutenberg_register_vendor_script(
		'react',
		'https://unpkg.com/react@16.9.0/umd/react' . $react_suffix . '.js',
		array( 'wp-polyfill' )
	);
	gutenberg_register_vendor_script(
		'react-dom',
		'https://unpkg.com/react-dom@16.9.0/umd/react-dom' . $react_suffix . '.js',
		array( 'react' )
	);

	// TODO: This is necessarily only so long as core ships with v4.17.11, and
	// can be removed at such time a newer version is available.
	gutenberg_register_vendor_script(
		'lodash',
		'https://unpkg.com/lodash@4.17.14/lodash' . $suffix . '.js'
	);
}

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
 * @param  string $handle Name of the script.
 * @param  string $src    Full URL of the external script.
 * @param  array  $deps   Optional. An array of registered script handles this
 *                        script depends on.
 *
 * @since 0.1.0
 */
function gutenberg_register_vendor_script( $handle, $src, $deps = array() ) {
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
		$f = @fopen( $full_path, 'a' );
		// @codingStandardsIgnoreEnd
		if ( ! $f ) {
			// Failed to open the file for writing, probably due to server
			// permissions.  Enqueue the script directly from the URL instead.
			gutenberg_override_script( $handle, $src, $deps, null );
			return;
		}
		fclose( $f );
		$response = wp_remote_get( $src );
		if ( wp_remote_retrieve_response_code( $response ) === 200 ) {
			$f = fopen( $full_path, 'w' );
			fwrite( $f, wp_remote_retrieve_body( $response ) );
			fclose( $f );
		} elseif ( ! filesize( $full_path ) ) {
			// The request failed. If the file is already cached, continue to
			// use this file. If not, then unlink the 0 byte file, and enqueue
			// the script directly from the URL.
			gutenberg_override_script( $handle, $src, $deps, null );
			unlink( $full_path );
			return;
		}
	}
	gutenberg_override_script(
		$handle,
		gutenberg_url( 'vendor/' . $filename ),
		$deps,
		null
	);
}

/**
 * Extends block editor settings to include Gutenberg's `editor-styles.css` as
 * taking precedent those styles shipped with core.
 *
 * @param array $settings Default editor settings.
 *
 * @return array Filtered editor settings.
 */
function gutenberg_extend_block_editor_styles( $settings ) {
	$editor_styles_file = gutenberg_dir_path() . 'build/editor/editor-styles.css';

	/*
	 * If, for whatever reason, the built editor styles do not exist, avoid
	 * override and fall back to the default.
	 */
	if ( ! file_exists( $editor_styles_file ) ) {
		return $settings;
	}

	if ( empty( $settings['styles'] ) ) {
		$settings['styles'] = array();
	} else {
		/*
		 * The styles setting is an array of CSS strings, so there is no direct
		 * way to find the default styles. To maximize stability, load (again)
		 * the default styles from disk and find its place in the array.
		 *
		 * See: https://github.com/WordPress/wordpress-develop/blob/5.0.3/src/wp-admin/edit-form-blocks.php#L168-L175
		 */

		$default_styles = file_get_contents(
			ABSPATH . WPINC . '/css/dist/editor/editor-styles.css'
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
	}

	$editor_styles = array(
		'css' => file_get_contents( $editor_styles_file ),
	);

	// Substitute default styles if found. Otherwise, prepend to setting array.
	if ( isset( $i ) && $i >= 0 ) {
		$settings['styles'][ $i ] = $editor_styles;
	} else {
		array_unshift( $settings['styles'], $editor_styles );
	}

	return $settings;
}
add_filter( 'block_editor_settings', 'gutenberg_extend_block_editor_styles' );

/**
 * Extends block editor preload paths to preload additional data. Note that any
 * additions here should be complemented with a corresponding core ticket to
 * reconcile the change upstream for future removal from Gutenberg.
 *
 * @param array   $preload_paths Array of paths to preload.
 * @param WP_Post $post          Post being edited.
 *
 * @return array Filtered array of paths to preload.
 */
function gutenberg_extend_block_editor_preload_paths( $preload_paths, $post ) {
	/*
	 * Preload any autosaves for the post. (see https://github.com/WordPress/gutenberg/pull/7945)
	 *
	 * Trac ticket: https://core.trac.wordpress.org/ticket/46974
	 *
	 * At the time of writing, the change is not committed or released
	 * in core. This path should be removed from Gutenberg when the code is
	 * released in core, and the corresponding release version becomes
	 * the minimum supported version.
	 */
	$post_type_object = get_post_type_object( $post->post_type );

	if ( isset( $post_type_object ) ) {
		$rest_base      = ! empty( $post_type_object->rest_base ) ? $post_type_object->rest_base : $post_type_object->name;
		$autosaves_path = sprintf( '/wp/v2/%s/%d/autosaves?context=edit', $rest_base, $post->ID );

		if ( ! in_array( $autosaves_path, $preload_paths, true ) ) {
			$preload_paths[] = $autosaves_path;
		}
	}

	/*
	 * Used in considering user permissions for creating and updating blocks,
	 * as condition for displaying relevant actions in the interface.
	 *
	 * Trac ticket: https://core.trac.wordpress.org/ticket/46429
	 *
	 * This is present in WordPress 5.2 and should be removed from Gutenberg
	 * once WordPress 5.2 is the minimum supported version.
	 */
	$blocks_path = array( '/wp/v2/blocks', 'OPTIONS' );

	if ( ! in_array( $blocks_path, $preload_paths, true ) ) {
		$preload_paths[] = $blocks_path;
	}

	return $preload_paths;
}
add_filter( 'block_editor_preload_paths', 'gutenberg_extend_block_editor_preload_paths', 10, 2 );
