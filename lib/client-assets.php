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
 * Returns contents of an inline script used in appending polyfill scripts for
 * browsers which fail the provided tests. The provided array is a mapping from
 * a condition to verify feature support to its polyfill script handle.
 *
 * @param array $tests Features to detect.
 * @return string Conditional polyfill inline script.
 */
function gutenberg_get_script_polyfill( $tests ) {
	global $wp_scripts;

	$polyfill = '';
	foreach ( $tests as $test => $handle ) {
		if ( ! array_key_exists( $handle, $wp_scripts->registered ) ) {
			continue;
		}

		$polyfill .= (
			// Test presence of feature...
			'( ' . $test . ' ) || ' .
			// ...appending polyfill on any failures. Cautious viewers may balk
			// at the `document.write`. Its caveat of synchronous mid-stream
			// blocking write is exactly the behavior we need though.
			'document.write( \'<script src="' .
			esc_url( $wp_scripts->registered[ $handle ]->src ) .
			'"></scr\' + \'ipt>\' );'
		);
	}

	return $polyfill;
}

if ( ! function_exists( 'register_tinymce_scripts' ) ) {
	/**
	 * Registers the main TinyMCE scripts.
	 *
	 * @deprecated 5.0.0 wp_register_tinymce_scripts
	 */
	function register_tinymce_scripts() {
		_deprecated_function( __FUNCTION__, '5.0.0', 'wp_register_tinymce_scripts' );

		global $wp_scripts;
		return wp_register_tinymce_scripts( $wp_scripts );
	}
}

/**
 * Registers a script according to `wp_register_script`. Honors this request by
 * deregistering any script by the same handler before registration.
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
	wp_deregister_script( $handle );
	wp_register_script( $handle, $src, $deps, $ver, $in_footer );
}

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
	gutenberg_register_vendor_scripts();

	wp_add_inline_script(
		'wp-polyfill',
		gutenberg_get_script_polyfill(
			array(
				'\'fetch\' in window' => 'wp-polyfill-fetch',
				'document.contains'   => 'wp-polyfill-node-contains',
				'window.FormData && window.FormData.prototype.keys' => 'wp-polyfill-formdata',
				'Element.prototype.matches && Element.prototype.closest' => 'wp-polyfill-element-closest',
			),
			'after'
		)
	);

	gutenberg_register_packages_scripts();

	// Inline scripts.
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
					'} )()',
				)
			),
			( wp_installing() && ! is_multisite() ) ? '' : wp_create_nonce( 'wp_rest' )
		),
		'after'
	);
	wp_add_inline_script(
		'wp-api-fetch',
		sprintf(
			'wp.apiFetch.use( wp.apiFetch.createRootURLMiddleware( "%s" ) );',
			esc_url_raw( get_rest_url() )
		),
		'after'
	);
	wp_add_inline_script(
		'wp-data',
		implode(
			"\n",
			array(
				'( function() {',
				'	var userId = ' . get_current_user_ID() . ';',
				'	var storageKey = "WP_DATA_USER_" + userId;',
				'	wp.data',
				'		.use( wp.data.plugins.persistence, { storageKey: storageKey } )',
				'		.use( wp.data.plugins.controls );',
				'} )()',
			)
		)
	);
	global $wp_locale;
	wp_add_inline_script(
		'wp-date',
		sprintf(
			'wp.date.setSettings( %s );',
			wp_json_encode(
				array(
					'l10n'     => array(
						'locale'        => get_user_locale(),
						'months'        => array_values( $wp_locale->month ),
						'monthsShort'   => array_values( $wp_locale->month_abbrev ),
						'weekdays'      => array_values( $wp_locale->weekday ),
						'weekdaysShort' => array_values( $wp_locale->weekday_abbrev ),
						'meridiem'      => (object) $wp_locale->meridiem,
						'relative'      => array(
							/* translators: %s: duration */
							'future' => __( '%s from now', 'default' ),
							/* translators: %s: duration */
							'past'   => __( '%s ago', 'default' ),
						),
					),
					'formats'  => array(
						'time'                => get_option( 'time_format', __( 'g:i a', 'default' ) ),
						'date'                => get_option( 'date_format', __( 'F j, Y', 'default' ) ),
						'datetime'            => __( 'F j, Y g:i a', 'default' ),
						'datetimeAbbreviated' => __( 'M j, Y g:i a', 'default' ),
					),
					'timezone' => array(
						'offset' => get_option( 'gmt_offset', 0 ),
						'string' => get_option( 'timezone_string', 'UTC' ),
					),
				)
			)
		),
		'after'
	);
	wp_add_inline_script(
		'moment',
		sprintf(
			"moment.locale( '%s', %s );",
			get_user_locale(),
			wp_json_encode(
				array(
					'months'         => array_values( $wp_locale->month ),
					'monthsShort'    => array_values( $wp_locale->month_abbrev ),
					'weekdays'       => array_values( $wp_locale->weekday ),
					'weekdaysShort'  => array_values( $wp_locale->weekday_abbrev ),
					'week'           => array(
						'dow' => (int) get_option( 'start_of_week', 0 ),
					),
					'longDateFormat' => array(
						'LT'   => get_option( 'time_format', __( 'g:i a', 'default' ) ),
						'LTS'  => null,
						'L'    => null,
						'LL'   => get_option( 'date_format', __( 'F j, Y', 'default' ) ),
						'LLL'  => __( 'F j, Y g:i a', 'default' ),
						'LLLL' => null,
					),
				)
			)
		),
		'after'
	);
	// Loading the old editor and its config to ensure the classic block works as expected.
	wp_add_inline_script(
		'editor',
		'window.wp.oldEditor = window.wp.editor;',
		'after'
	);

	$tinymce_plugins = array(
		'charmap',
		'colorpicker',
		'hr',
		'lists',
		'media',
		'paste',
		'tabfocus',
		'textcolor',
		'fullscreen',
		'wordpress',
		'wpautoresize',
		'wpeditimage',
		'wpemoji',
		'wpgallery',
		'wplink',
		'wpdialogs',
		'wptextpattern',
		'wpview',
	);
	$tinymce_plugins = apply_filters( 'tiny_mce_plugins', $tinymce_plugins, 'classic-block' );
	$tinymce_plugins = array_unique( $tinymce_plugins );

	$toolbar1 = array(
		'formatselect',
		'bold',
		'italic',
		'bullist',
		'numlist',
		'blockquote',
		'alignleft',
		'aligncenter',
		'alignright',
		'link',
		'unlink',
		'wp_more',
		'spellchecker',
		'wp_add_media',
		'kitchensink',
	);
	$toolbar1 = apply_filters( 'mce_buttons', $toolbar1, 'classic-block' );

	$toolbar2 = array(
		'strikethrough',
		'hr',
		'forecolor',
		'pastetext',
		'removeformat',
		'charmap',
		'outdent',
		'indent',
		'undo',
		'redo',
		'wp_help',
	);
	$toolbar2 = apply_filters( 'mce_buttons_2', $toolbar2, 'classic-block' );

	$toolbar3 = apply_filters( 'mce_buttons_3', array(), 'classic-block' );
	$toolbar4 = apply_filters( 'mce_buttons_4', array(), 'classic-block' );

	$external_plugins = apply_filters( 'mce_external_plugins', array(), 'classic-block' );

	$tinymce_settings = array(
		'plugins'              => implode( ',', $tinymce_plugins ),
		'toolbar1'             => implode( ',', $toolbar1 ),
		'toolbar2'             => implode( ',', $toolbar2 ),
		'toolbar3'             => implode( ',', $toolbar3 ),
		'toolbar4'             => implode( ',', $toolbar4 ),
		'external_plugins'     => wp_json_encode( $external_plugins ),
		'classic_block_editor' => true,
	);
	$tinymce_settings = apply_filters( 'tiny_mce_before_init', $tinymce_settings, 'classic-block' );

	// Do "by hand" translation from PHP array to js object.
	// Prevents breakage in some custom settings.
	$init_obj = '';
	foreach ( $tinymce_settings as $key => $value ) {
		if ( is_bool( $value ) ) {
			$val       = $value ? 'true' : 'false';
			$init_obj .= $key . ':' . $val . ',';
			continue;
		} elseif ( ! empty( $value ) && is_string( $value ) && (
			( '{' == $value{0} && '}' == $value{strlen( $value ) - 1} ) ||
			( '[' == $value{0} && ']' == $value{strlen( $value ) - 1} ) ||
			preg_match( '/^\(?function ?\(/', $value ) ) ) {

			$init_obj .= $key . ':' . $value . ',';
			continue;
		}
		$init_obj .= $key . ':"' . $value . '",';
	}

	$init_obj = '{' . trim( $init_obj, ' ,' ) . '}';

	$script = 'window.wpEditorL10n = {
		tinymce: {
			baseURL: ' . wp_json_encode( includes_url( 'js/tinymce' ) ) . ',
			suffix: ' . ( SCRIPT_DEBUG ? '""' : '".min"' ) . ',
			settings: ' . $init_obj . ',
		}
	}';

	wp_add_inline_script( 'wp-block-library', $script, 'before' );

	// Editor Styles.
	// This empty stylesheet is defined to ensure backward compatibility.
	gutenberg_override_style( 'wp-blocks', false );
	$fonts_url = '';

	/*
	 * Translators: Use this to specify the proper Google Font name and variants
	 * to load that is supported by your language. Do not translate.
	 * Set to 'off' to disable loading.
	 */
	$font_family = _x( 'Noto Serif:400,400i,700,700i', 'Google Font Name and Variants', 'gutenberg' );
	if ( 'off' !== $font_family ) {
		$query_args = array(
			'family' => urlencode( $font_family ),
		);
		$fonts_url  = esc_url_raw( add_query_arg( $query_args, 'https://fonts.googleapis.com/css' ) );
	}

	gutenberg_override_style(
		'wp-editor-font',
		$fonts_url,
		array(),
		null
	);

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
 * Append result of internal request to REST API for purpose of preloading
 * data to be attached to the page. Expected to be called in the context of
 * `array_reduce`.
 *
 * @deprecated 5.0.0 rest_preload_api_request
 *
 * @param  array  $memo Reduce accumulator.
 * @param  string $path REST API path to preload.
 * @return array        Modified reduce accumulator.
 */
function gutenberg_preload_api_request( $memo, $path ) {
	_deprecated_function( __FUNCTION__, '5.0.0', 'rest_preload_api_request' );

	return rest_preload_api_request( $memo, $path );
}

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
		'https://unpkg.com/react@16.6.3/umd/react' . $react_suffix . '.js',
		array( 'wp-polyfill' )
	);
	gutenberg_register_vendor_script(
		'react-dom',
		'https://unpkg.com/react-dom@16.6.3/umd/react-dom' . $react_suffix . '.js',
		array( 'react' )
	);
	$moment_script = SCRIPT_DEBUG ? 'moment.js' : 'min/moment.min.js';
	gutenberg_register_vendor_script(
		'moment',
		'https://unpkg.com/moment@2.22.1/' . $moment_script,
		array()
	);
	gutenberg_register_vendor_script(
		'lodash',
		'https://unpkg.com/lodash@4.17.5/lodash' . $suffix . '.js'
	);
	wp_add_inline_script( 'lodash', 'window.lodash = _.noConflict();' );
	gutenberg_register_vendor_script(
		'wp-polyfill-fetch',
		'https://unpkg.com/whatwg-fetch@3.0.0/dist/fetch.umd.js'
	);
	gutenberg_register_vendor_script(
		'wp-polyfill-formdata',
		'https://unpkg.com/formdata-polyfill@3.0.9/formdata.min.js'
	);
	gutenberg_register_vendor_script(
		'wp-polyfill-node-contains',
		'https://unpkg.com/polyfill-library@3.26.0-0/polyfills/Node/prototype/contains/polyfill.js'
	);
	gutenberg_register_vendor_script(
		'wp-polyfill-element-closest',
		'https://unpkg.com/element-closest@2.0.2/element-closest.js'
	);
	gutenberg_register_vendor_script(
		'wp-polyfill',
		'https://cdnjs.cloudflare.com/ajax/libs/babel-polyfill/7.0.0/polyfill' . $suffix . '.js'
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
	$match_tinymce_plugin = preg_match(
		'@tinymce.*/plugins/([^/]+)/plugin(\.min)?\.js$@',
		$src,
		$tinymce_plugin_pieces
	);
	if ( $match_tinymce_plugin ) {
		$prefix = 'tinymce-plugin-' . $tinymce_plugin_pieces[1];
		$suffix = isset( $tinymce_plugin_pieces[2] ) ? $tinymce_plugin_pieces[2] : '';
	} else {
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
	}

	$hash = substr( md5( $src ), 0, 8 );

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
 * Prepares server-registered blocks for JavaScript, returning an associative
 * array of registered block data keyed by block name. Data includes properties
 * of a block relevant for client registration.
 *
 * @deprecated 5.0.0 get_block_editor_server_block_settings
 *
 * @return array An associative array of registered block data.
 */
function gutenberg_prepare_blocks_for_js() {
	_deprecated_function( __FUNCTION__, '5.0.0', 'get_block_editor_server_block_settings' );

	return get_block_editor_server_block_settings();
}

/**
 * Handles the enqueueing of block scripts and styles that are common to both
 * the editor and the front-end.
 *
 * Note: This function must remain *before*
 * `gutenberg_editor_scripts_and_styles` so that editor-specific stylesheets
 * are loaded last.
 *
 * @since 0.4.0
 */
function gutenberg_common_scripts_and_styles() {
	if ( ! is_gutenberg_page() && is_admin() ) {
		return;
	}

	// Enqueue basic styles built out of Gutenberg through `npm build`.
	wp_enqueue_style( 'wp-block-library' );

	/*
	 * Enqueue block styles built through plugins.  This lives in a separate
	 * action for a couple of reasons: (1) we want to load these assets
	 * (usually stylesheets) in *both* frontend and editor contexts, and (2)
	 * one day we may need to be smarter about whether assets are included
	 * based on whether blocks are actually present on the page.
	 */

	/**
	 * Fires after enqueuing block assets for both editor and front-end.
	 *
	 * Call `add_action` on any hook before 'wp_enqueue_scripts'.
	 *
	 * In the function call you supply, simply use `wp_enqueue_script` and
	 * `wp_enqueue_style` to add your functionality to the Gutenberg editor.
	 *
	 * @since 0.4.0
	 */
	do_action( 'enqueue_block_assets' );
}
add_action( 'wp_enqueue_scripts', 'gutenberg_common_scripts_and_styles' );
add_action( 'admin_enqueue_scripts', 'gutenberg_common_scripts_and_styles' );

/**
 * Enqueues registered block scripts and styles, depending on current rendered
 * context (only enqueuing editor scripts while in context of the editor).
 *
 * @since 2.0.0
 */
function gutenberg_enqueue_registered_block_scripts_and_styles() {
	$is_editor = ( 'enqueue_block_editor_assets' === current_action() );

	$block_registry = WP_Block_Type_Registry::get_instance();
	foreach ( $block_registry->get_all_registered() as $block_name => $block_type ) {
		// Front-end styles.
		if ( ! empty( $block_type->style ) ) {
			wp_enqueue_style( $block_type->style );
		}

		// Front-end script.
		if ( ! empty( $block_type->script ) ) {
			wp_enqueue_script( $block_type->script );
		}

		// Editor styles.
		if ( $is_editor && ! empty( $block_type->editor_style ) ) {
			wp_enqueue_style( $block_type->editor_style );
		}

		// Editor script.
		if ( $is_editor && ! empty( $block_type->editor_script ) ) {
			wp_enqueue_script( $block_type->editor_script );
		}
	}
}
add_action( 'enqueue_block_assets', 'gutenberg_enqueue_registered_block_scripts_and_styles' );
add_action( 'enqueue_block_editor_assets', 'gutenberg_enqueue_registered_block_scripts_and_styles' );

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
 * Returns all the block categories.
 *
 * @since 2.2.0
 * @deprecated 5.0.0 get_block_categories
 *
 * @param  WP_Post $post Post object.
 * @return Object[] Block categories.
 */
function gutenberg_get_block_categories( $post ) {
	_deprecated_function( __FUNCTION__, '5.0.0', 'get_block_categories' );

	return get_block_categories( $post );
}

/**
 * Loads Gutenberg Locale Data.
 */
function gutenberg_load_locale_data() {
	// Prepare Jed locale data.
	$locale_data = gutenberg_get_jed_locale_data( 'gutenberg' );
	wp_add_inline_script(
		'wp-i18n',
		'wp.i18n.setLocaleData( ' . json_encode( $locale_data ) . ' );'
	);
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
	$is_demo = isset( $_GET['gutenberg-demo'] );

	global $wp_scripts, $wp_meta_boxes;

	// Add "wp-hooks" as dependency of "heartbeat".
	$heartbeat_script = $wp_scripts->query( 'heartbeat', 'registered' );
	if ( $heartbeat_script && ! in_array( 'wp-hooks', $heartbeat_script->deps ) ) {
		$heartbeat_script->deps[] = 'wp-hooks';
	}

	// Enqueue heartbeat separately as an "optional" dependency of the editor.
	// Heartbeat is used for automatic nonce refreshing, but some hosts choose
	// to disable it outright.
	wp_enqueue_script( 'heartbeat' );

	// Transforms heartbeat jQuery events into equivalent hook actions. This
	// avoids a dependency on jQuery for listening to the event.
	$heartbeat_hooks = <<<JS
( function() {
	jQuery( document ).on( [
		'heartbeat-send',
		'heartbeat-tick',
		'heartbeat-error',
		'heartbeat-connection-lost',
		'heartbeat-connection-restored',
		'heartbeat-nonces-expired',
	].join( ' ' ), function( event ) {
		var actionName = event.type.replace( /-/g, '.' ),
			args;

		// Omit the event argument in applying arguments to the hook callback.
		// The remaining arguments are passed to the hook.
		args = Array.prototype.slice.call( arguments, 1 );

		wp.hooks.doAction.apply( null, [ actionName ].concat( args ) );
	} );
} )();
JS;
	wp_add_inline_script(
		'heartbeat',
		$heartbeat_hooks,
		'after'
	);

	// Ignore Classic Editor's `rich_editing` user option, aka "Disable visual
	// editor". Forcing this to be true guarantees that TinyMCE and its plugins
	// are available in Gutenberg. Fixes
	// https://github.com/WordPress/gutenberg/issues/5667.
	$user_can_richedit = user_can_richedit();
	add_filter( 'user_can_richedit', '__return_true' );

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
	if ( $is_new_post && $is_demo ) {
		// Prepopulate with some test content in demo.
		ob_start();
		include gutenberg_dir_path() . 'post-content.php';
		$demo_content = ob_get_clean();

		$initial_edits = array(
			'title'   => __( 'Welcome to the Gutenberg Editor', 'gutenberg' ),
			'content' => $demo_content,
		);
	} elseif ( $is_new_post ) {
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

	gutenberg_load_locale_data();

	// Preload server-registered block schemas.
	wp_add_inline_script(
		'wp-blocks',
		'wp.blocks.unstable__bootstrapServerSideBlockDefinitions(' . json_encode( get_block_editor_server_block_settings() ) . ');'
	);

	// Get admin url for handling meta boxes.
	$meta_box_url = admin_url( 'post.php' );
	$meta_box_url = add_query_arg(
		array(
			'post'           => $post->ID,
			'action'         => 'edit',
			'classic-editor' => true,
			'meta_box'       => true,
		),
		$meta_box_url
	);
	wp_localize_script( 'wp-editor', '_wpMetaBoxUrl', $meta_box_url );

	// Initialize the editor.
	$gutenberg_theme_support = get_theme_support( 'gutenberg' );
	$align_wide              = get_theme_support( 'align-wide' );
	$color_palette           = current( (array) get_theme_support( 'editor-color-palette' ) );
	$font_sizes              = current( (array) get_theme_support( 'editor-font-sizes' ) );

	if ( ! empty( $gutenberg_theme_support ) ) {
		wp_enqueue_script( 'wp-deprecated' );
		wp_add_inline_script( 'wp-deprecated', 'wp.deprecated( "`gutenberg` theme support", { plugin: "Gutenberg", version: "5.2", alternative: "`align-wide` theme support" } );' );
	}

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
				gutenberg_dir_path() . 'build/editor/editor-styles.css'
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
		'alignWide'              => $align_wide || ! empty( $gutenberg_theme_support[0]['wide-images'] ), // Backcompat. Use `align-wide` outside of `gutenberg` array.
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
		'richEditingEnabled'     => $user_can_richedit,

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
			'editLink' => add_query_arg( 'gutenberg', true, get_edit_post_link( $post_autosave->ID ) ),
		);
	}

	if ( false !== $color_palette ) {
		$editor_settings['colors'] = $color_palette;
	}

	if ( ! empty( $font_sizes ) ) {
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
		window._wpLoadGutenbergEditor = new Promise( function( resolve ) {
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

/**
 * Enqueue the reusable blocks listing page's script
 *
 * @deprecated 5.0.0
 */
function gutenberg_load_list_reusable_blocks() {
	_deprecated_function( __FUNCTION__, '5.0.0' );
}
