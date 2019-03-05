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

	// Only override script handles generated from the Gutenberg plugin.
	$packages_dependencies = include dirname( __FILE__ ) . '/packages-dependencies.php';
	if ( ! isset( $packages_dependencies[ $handle ] ) ) {
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
	$packages_dependencies = include dirname( __FILE__ ) . '/packages-dependencies.php';

	foreach ( $packages_dependencies as $handle => $dependencies ) {
		// Remove `wp-` prefix from the handle to get the package's name.
		$package_name = strpos( $handle, 'wp-' ) === 0 ? substr( $handle, 3 ) : $handle;
		$path         = "build/$package_name/index.js";
		gutenberg_override_script(
			$handle,
			gutenberg_url( $path ),
			array_merge( $dependencies, array( 'wp-polyfill' ) ),
			filemtime( gutenberg_dir_path() . $path ),
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
			implode(
				"\n",
				array(
					'( function() {',
					'	var nonceMiddleware = wp.apiFetch.createNonceMiddleware( "%s" );',
					'	wp.apiFetch.use( nonceMiddleware );',
					'	wp.hooks.addAction(',
					'		"heartbeat.tick",',
					'		"core/api-fetch/create-nonce-middleware",',
					'		function( response ) {',
					'			if ( response[ "rest_nonce" ] ) {',
					'				nonceMiddleware.nonce = response[ "rest_nonce" ];',
					'			}',
					'		}',
					'	)',
					'} )();',
				)
			),
			( wp_installing() && ! is_multisite() ) ? '' : wp_create_nonce( 'wp_rest' )
		),
		'after'
	);

	// TEMPORARY: Core does not (yet) provide persistence migration from the
	// introduction of the block editor.
	wp_add_inline_script(
		'wp-data',
		implode(
			"\n",
			array(
				'( function() {',
				'	var userId = ' . get_current_user_ID() . ';',
				'	var storageKey = "WP_DATA_USER_" + userId;',
				'	wp.data.plugins.persistence.__unstableMigrate( { storageKey: storageKey } );',
				'} )()',
			)
		)
	);

	// Editor Styles.
	// This empty stylesheet is defined to ensure backward compatibility.
	gutenberg_override_style( 'wp-blocks', false );

	gutenberg_override_style(
		'wp-editor',
		gutenberg_url( 'build/editor/style.css' ),
		array( 'wp-components', 'wp-editor-font', 'wp-nux' ),
		filemtime( gutenberg_dir_path() . 'build/editor/style.css' )
	);
	wp_style_add_data( 'wp-editor', 'rtl', 'replace' );

	gutenberg_override_style(
		'wp-edit-post',
		gutenberg_url( 'build/edit-post/style.css' ),
		array( 'wp-components', 'wp-editor', 'wp-edit-blocks', 'wp-block-library', 'wp-nux' ),
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
		current_theme_supports( 'wp-block-styles' ) ? array( 'wp-block-library-theme' ) : array(),
		filemtime( gutenberg_dir_path() . 'build/block-library/style.css' )
	);
	wp_style_add_data( 'wp-block-library', 'rtl', 'replace' );

	gutenberg_override_style(
		'wp-format-library',
		gutenberg_url( 'build/format-library/style.css' ),
		array(),
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
		array(),
		filemtime( gutenberg_dir_path() . 'build/edit-widgets/style.css' )
	);
	wp_style_add_data( 'wp-edit-widgets', 'rtl', 'replace' );

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
	/*
	 * This function is kept as an empty stub, in case Gutenberg should need to
	 * explicitly provide a version newer than that provided by core.
	 */
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
 * Assigns a default editor template with a default block by post format, if
 * not otherwise assigned for a new post of type "post".
 *
 * @param array   $settings Default editor settings.
 * @param WP_Post $post     Post being edited.
 *
 * @return array Filtered block editor settings.
 */
function gutenberg_default_post_format_template( $settings, $post ) {
	// Only assign template for new posts without explicitly assigned template.
	$is_new_post = 'auto-draft' === $post->post_status;
	if ( $is_new_post && ! isset( $settings['template'] ) && 'post' === $post->post_type ) {
		switch ( get_post_format() ) {
			case 'audio':
				$default_block_name = 'core/audio';
				break;
			case 'gallery':
				$default_block_name = 'core/gallery';
				break;
			case 'image':
				$default_block_name = 'core/image';
				break;
			case 'quote':
				$default_block_name = 'core/quote';
				break;
			case 'video':
				$default_block_name = 'core/video';
				break;
		}

		if ( isset( $default_block_name ) ) {
			$settings['template'] = array( array( $default_block_name ) );
		}
	}

	return $settings;
}
add_filter( 'block_editor_settings', 'gutenberg_default_post_format_template', 10, 2 );

/**
 * Retrieve a stored autosave that is newer than the post save.
 *
 * Deletes autosaves that are older than the post save.
 *
 * @param  WP_Post $post Post object.
 * @return WP_Post|boolean The post autosave. False if none found.
 */
function gutenberg_get_autosave_newer_than_post_save( $post ) {
	// Add autosave data if it is newer and changed.
	$autosave = wp_get_post_autosave( $post->ID );

	if ( ! $autosave ) {
		return false;
	}

	// Check if the autosave is newer than the current post.
	if (
		mysql2date( 'U', $autosave->post_modified_gmt, false ) > mysql2date( 'U', $post->post_modified_gmt, false )
	) {
		return $autosave;
	}

	// If the autosave isn't newer, remove it.
	wp_delete_post_revision( $autosave->ID );

	return false;
}

/**
 * Loads Gutenberg Locale Data.
 *
 * @deprecated 5.2.0
 */
function gutenberg_load_locale_data() {
	_deprecated_function( __FUNCTION__, '5.2.0' );
}

/**
 * Retrieve The available image sizes for a post
 *
 * @return array
 */
function gutenberg_get_available_image_sizes() {
	$size_names = apply_filters(
		'image_size_names_choose',
		array(
			'thumbnail' => __( 'Thumbnail', 'gutenberg' ),
			'medium'    => __( 'Medium', 'gutenberg' ),
			'large'     => __( 'Large', 'gutenberg' ),
			'full'      => __( 'Full Size', 'gutenberg' ),
		)
	);

	$all_sizes = array();
	foreach ( $size_names as $size_slug => $size_name ) {
		$all_sizes[] = array(
			'slug' => $size_slug,
			'name' => $size_name,
		);
	}

	return $all_sizes;
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
 * Scripts & Styles.
 *
 * Enqueues the needed scripts and styles when visiting the top-level page of
 * the Gutenberg editor.
 *
 * @since 0.1.0
 *
 * @param string $hook Screen name.
 */
function gutenberg_editor_scripts_and_styles( $hook ) {
	global $wp_meta_boxes;

	// Enqueue heartbeat separately as an "optional" dependency of the editor.
	// Heartbeat is used for automatic nonce refreshing, but some hosts choose
	// to disable it outright.
	wp_enqueue_script( 'heartbeat' );

	wp_enqueue_script( 'wp-edit-post' );
	wp_enqueue_script( 'wp-format-library' );
	wp_enqueue_style( 'wp-format-library' );

	global $post;

	// Set initial title to empty string for auto draft for duration of edit.
	// Otherwise, title defaults to and displays as "Auto Draft".
	$is_new_post = 'auto-draft' === $post->post_status;

	// Set the post type name.
	$post_type        = get_post_type( $post );
	$post_type_object = get_post_type_object( $post_type );
	$rest_base        = ! empty( $post_type_object->rest_base ) ? $post_type_object->rest_base : $post_type_object->name;

	$preload_paths = array(
		'/',
		'/wp/v2/types?context=edit',
		'/wp/v2/taxonomies?per_page=-1&context=edit',
		'/wp/v2/themes?status=active',
		sprintf( '/wp/v2/%s/%s?context=edit', $rest_base, $post->ID ),
		sprintf( '/wp/v2/types/%s?context=edit', $post_type ),
		sprintf( '/wp/v2/users/me?post_type=%s&context=edit', $post_type ),
		array( '/wp/v2/media', 'OPTIONS' ),
		array( '/wp/v2/blocks', 'OPTIONS' ),
	);

	/**
	 * Preload common data by specifying an array of REST API paths that will be preloaded.
	 *
	 * Filters the array of paths that will be preloaded.
	 *
	 * @param array $preload_paths Array of paths to preload
	 * @param object $post         The post resource data.
	 */
	$preload_paths = apply_filters( 'block_editor_preload_paths', $preload_paths, $post );

	// Ensure the global $post remains the same after
	// API data is preloaded. Because API preloading
	// can call the_content and other filters, callbacks
	// can unexpectedly modify $post resulting in issues
	// like https://github.com/WordPress/gutenberg/issues/7468.
	$backup_global_post = $post;

	$preload_data = array_reduce(
		$preload_paths,
		'rest_preload_api_request',
		array()
	);

	// Restore the global $post as it was before API preloading.
	$post = $backup_global_post;

	wp_add_inline_script(
		'wp-api-fetch',
		sprintf( 'wp.apiFetch.use( wp.apiFetch.createPreloadingMiddleware( %s ) );', wp_json_encode( $preload_data ) ),
		'after'
	);

	wp_add_inline_script(
		'wp-blocks',
		sprintf( 'wp.blocks.setCategories( %s );', wp_json_encode( get_block_categories( $post ) ) ),
		'after'
	);

	// Assign initial edits, if applicable. These are not initially assigned
	// to the persisted post, but should be included in its save payload.
	if ( $is_new_post ) {
		// Override "(Auto Draft)" new post default title with empty string,
		// or filtered value.
		$initial_edits = array(
			'title'   => $post->post_title,
			'content' => $post->post_content,
			'excerpt' => $post->post_excerpt,
		);
	} else {
		$initial_edits = null;
	}

	// Preload server-registered block schemas.
	wp_add_inline_script(
		'wp-blocks',
		'wp.blocks.unstable__bootstrapServerSideBlockDefinitions(' . json_encode( get_block_editor_server_block_settings() ) . ');'
	);

	// Get admin url for handling meta boxes.
	$meta_box_url = admin_url( 'post.php' );
	$meta_box_url = add_query_arg(
		array(
			'post'            => $post->ID,
			'action'          => 'edit',
			'meta-box-loader' => true,
			'_wpnonce'        => wp_create_nonce( 'meta-box-loader' ),
		),
		$meta_box_url
	);
	wp_localize_script( 'wp-editor', '_wpMetaBoxUrl', $meta_box_url );

	// Initialize the editor.
	$align_wide    = get_theme_support( 'align-wide' );
	$color_palette = current( (array) get_theme_support( 'editor-color-palette' ) );
	$font_sizes    = current( (array) get_theme_support( 'editor-font-sizes' ) );

	/**
	 * Filters the allowed block types for the editor, defaulting to true (all
	 * block types supported).
	 *
	 * @param bool|array $allowed_block_types Array of block type slugs, or
	 *                                        boolean to enable/disable all.
	 * @param object $post                    The post resource data.
	 */
	$allowed_block_types = apply_filters( 'allowed_block_types', true, $post );

	// Get all available templates for the post/page attributes meta-box.
	// The "Default template" array element should only be added if the array is
	// not empty so we do not trigger the template select element without any options
	// besides the default value.
	$available_templates = wp_get_theme()->get_page_templates( get_post( $post->ID ) );
	$available_templates = ! empty( $available_templates ) ? array_merge(
		array(
			'' => apply_filters( 'default_page_template_title', __( 'Default template', 'gutenberg' ), 'rest-api' ),
		),
		$available_templates
	) : $available_templates;

	// Media settings.
	$max_upload_size = wp_max_upload_size();
	if ( ! $max_upload_size ) {
		$max_upload_size = 0;
	}

	// Editor Styles.
	global $editor_styles;
	$styles = array(
		array(
			'css' => file_get_contents(
				ABSPATH . WPINC . '/css/dist/editor/editor-styles.css'
			),
		),
	);

	/* Translators: Use this to specify the CSS font family for the default font */
	$locale_font_family = esc_html_x( 'Noto Serif', 'CSS Font Family for Editor Font', 'gutenberg' );
	$styles[]           = array(
		'css' => "body { font-family: '$locale_font_family' }",
	);

	if ( $editor_styles && current_theme_supports( 'editor-styles' ) ) {
		foreach ( $editor_styles as $style ) {
			if ( filter_var( $style, FILTER_VALIDATE_URL ) ) {
				$styles[] = array(
					'css' => file_get_contents( $style ),
				);
			} else {
				$file = get_theme_file_path( $style );
				if ( file_exists( $file ) ) {
					$styles[] = array(
						'css'     => file_get_contents( $file ),
						'baseURL' => get_theme_file_uri( $style ),
					);
				}
			}
		}
	}

	// Lock settings.
	$user_id = wp_check_post_lock( $post->ID );
	if ( $user_id ) {
		/**
		 * Filters whether to show the post locked dialog.
		 *
		 * Returning a falsey value to the filter will short-circuit displaying the dialog.
		 *
		 * @since 3.6.0
		 *
		 * @param bool         $display Whether to display the dialog. Default true.
		 * @param WP_Post      $post    Post object.
		 * @param WP_User|bool $user    The user id currently editing the post.
		 */
		if ( apply_filters( 'show_post_locked_dialog', true, $post, $user_id ) ) {
			$locked = true;
		}

		$user_details = null;
		if ( $locked ) {
			$user         = get_userdata( $user_id );
			$user_details = array(
				'name' => $user->display_name,
			);
			$avatar       = get_avatar( $user_id, 64 );
			if ( $avatar ) {
				if ( preg_match( "|src='([^']+)'|", $avatar, $matches ) ) {
					$user_details['avatar'] = $matches[1];
				}
			}
		}

		$lock_details = array(
			'isLocked' => $locked,
			'user'     => $user_details,
		);
	} else {

		// Lock the post.
		$active_post_lock = wp_set_post_lock( $post->ID );
		$lock_details     = array(
			'isLocked'       => false,
			'activePostLock' => esc_attr( implode( ':', $active_post_lock ) ),
		);
	}

	$editor_settings = array(
		'alignWide'              => $align_wide,
		'availableTemplates'     => $available_templates,
		'allowedBlockTypes'      => $allowed_block_types,
		'disableCustomColors'    => get_theme_support( 'disable-custom-colors' ),
		'disableCustomFontSizes' => get_theme_support( 'disable-custom-font-sizes' ),
		'disablePostFormats'     => ! current_theme_supports( 'post-formats' ),
		'titlePlaceholder'       => apply_filters( 'enter_title_here', __( 'Add title', 'gutenberg' ), $post ),
		'bodyPlaceholder'        => apply_filters( 'write_your_story', __( 'Start writing or type / to choose a block', 'gutenberg' ), $post ),
		'isRTL'                  => is_rtl(),
		'autosaveInterval'       => 10,
		'maxUploadFileSize'      => $max_upload_size,
		'allowedMimeTypes'       => get_allowed_mime_types(),
		'styles'                 => $styles,
		'imageSizes'             => gutenberg_get_available_image_sizes(),
		'richEditingEnabled'     => user_can_richedit(),

		// Ideally, we'd remove this and rely on a REST API endpoint.
		'postLock'               => $lock_details,
		'postLockUtils'          => array(
			'nonce'       => wp_create_nonce( 'lock-post_' . $post->ID ),
			'unlockNonce' => wp_create_nonce( 'update-post_' . $post->ID ),
			'ajaxUrl'     => admin_url( 'admin-ajax.php' ),
		),

		// Whether or not to load the 'postcustom' meta box is stored as a user meta
		// field so that we're not always loading its assets.
		'enableCustomFields'     => (bool) get_user_meta( get_current_user_id(), 'enable_custom_fields', true ),
	);

	$post_autosave = gutenberg_get_autosave_newer_than_post_save( $post );
	if ( $post_autosave ) {
		$editor_settings['autosave'] = array(
			'editLink' => get_edit_post_link( $post_autosave->ID ),
		);
	}

	if ( false !== $color_palette ) {
		$editor_settings['colors'] = $color_palette;
	}

	if ( false !== $font_sizes ) {
		$editor_settings['fontSizes'] = $font_sizes;
	}

	if ( ! empty( $post_type_object->template ) ) {
		$editor_settings['template']     = $post_type_object->template;
		$editor_settings['templateLock'] = ! empty( $post_type_object->template_lock ) ? $post_type_object->template_lock : false;
	}

	$current_screen  = get_current_screen();
	$core_meta_boxes = array();

	// Make sure the current screen is set as well as the normal core metaboxes.
	if ( isset( $current_screen->id ) && isset( $wp_meta_boxes[ $current_screen->id ]['normal']['core'] ) ) {
		$core_meta_boxes = $wp_meta_boxes[ $current_screen->id ]['normal']['core'];
	}

	// Check if the Custom Fields meta box has been removed at some point.
	if ( ! isset( $core_meta_boxes['postcustom'] ) || ! $core_meta_boxes['postcustom'] ) {
		unset( $editor_settings['enableCustomFields'] );
	}

	/**
	 * Filters the settings to pass to the block editor.
	 *
	 * @since 3.7.0
	 *
	 * @param array   $editor_settings Default editor settings.
	 * @param WP_Post $post            Post being edited.
	 */
	$editor_settings = apply_filters( 'block_editor_settings', $editor_settings, $post );

	$init_script = <<<JS
( function() {
	window._wpLoadBlockEditor = new Promise( function( resolve ) {
		wp.domReady( function() {
			resolve( wp.editPost.initializeEditor( 'editor', "%s", %d, %s, %s ) );
		} );
	} );
} )();
JS;

	$script = sprintf(
		$init_script,
		$post->post_type,
		$post->ID,
		wp_json_encode( $editor_settings ),
		wp_json_encode( $initial_edits )
	);
	wp_add_inline_script( 'wp-edit-post', $script );

	/**
	 * Scripts
	 */
	wp_enqueue_media(
		array(
			'post' => $post->ID,
		)
	);
	wp_tinymce_inline_scripts();
	wp_enqueue_editor();

	/**
	 * Styles
	 */
	wp_enqueue_style( 'wp-edit-post' );

	/**
	 * Fires after block assets have been enqueued for the editing interface.
	 *
	 * Call `add_action` on any hook before 'admin_enqueue_scripts'.
	 *
	 * In the function call you supply, simply use `wp_enqueue_script` and
	 * `wp_enqueue_style` to add your functionality to the Gutenberg editor.
	 *
	 * @since 0.4.0
	 */
	do_action( 'enqueue_block_editor_assets' );
}
