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
	 */
	function register_tinymce_scripts() {
		global $tinymce_version, $concatenate_scripts, $compress_scripts;
		if ( ! isset( $concatenate_scripts ) ) {
			script_concat_settings();
		}
		$suffix     = SCRIPT_DEBUG ? '' : '.min';
		$compressed = $compress_scripts && $concatenate_scripts && isset( $_SERVER['HTTP_ACCEPT_ENCODING'] )
			&& false !== stripos( $_SERVER['HTTP_ACCEPT_ENCODING'], 'gzip' );
		// Load tinymce.js when running from /src, otherwise load wp-tinymce.js.gz (in production) or
		// tinymce.min.js (when SCRIPT_DEBUG is true).
		$mce_suffix = false !== strpos( get_bloginfo( 'version' ), '-src' ) ? '' : '.min';
		if ( $compressed ) {
			gutenberg_override_script( 'wp-tinymce', includes_url( 'js/tinymce/' ) . 'wp-tinymce.php', array(), $tinymce_version );
		} else {
			gutenberg_override_script( 'wp-tinymce-root', includes_url( 'js/tinymce/' ) . "tinymce{$mce_suffix}.js", array(), $tinymce_version );
			gutenberg_override_script( 'wp-tinymce', includes_url( 'js/tinymce/' ) . "plugins/compat3x/plugin{$suffix}.js", array( 'wp-tinymce-root' ), $tinymce_version );
		}
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
 * Registers common scripts and styles to be used as dependencies of the editor
 * and plugins.
 *
 * @since 0.1.0
 */
function gutenberg_register_scripts_and_styles() {
	gutenberg_register_vendor_scripts();

	register_tinymce_scripts();

	gutenberg_override_script(
		'wp-polyfill',
		null,
		array(
			'wp-polyfill-ecmascript',
		)
	);
	wp_script_add_data(
		'wp-polyfill',
		'data',
		gutenberg_get_script_polyfill(
			array(
				'\'fetch\' in window' => 'wp-polyfill-fetch',
				'document.contains'   => 'wp-polyfill-node-contains',
				'window.FormData && window.FormData.prototype.keys' => 'wp-polyfill-formdata',
				'Element.prototype.matches && Element.prototype.closest' => 'wp-polyfill-element-closest',
			)
		)
	);
	gutenberg_override_script(
		'wp-url',
		gutenberg_url( 'build/url/index.js' ),
		array( 'wp-polyfill' ),
		filemtime( gutenberg_dir_path() . 'build/url/index.js' ),
		true
	);
	gutenberg_override_script(
		'wp-autop',
		gutenberg_url( 'build/autop/index.js' ),
		array( 'wp-polyfill' ),
		filemtime( gutenberg_dir_path() . 'build/autop/index.js' ),
		true
	);
	gutenberg_override_script(
		'wp-wordcount',
		gutenberg_url( 'build/wordcount/index.js' ),
		array( 'wp-polyfill' ),
		filemtime( gutenberg_dir_path() . 'build/wordcount/index.js' ),
		true
	);
	gutenberg_override_script(
		'wp-dom-ready',
		gutenberg_url( 'build/dom-ready/index.js' ),
		array( 'wp-polyfill' ),
		filemtime( gutenberg_dir_path() . 'build/dom-ready/index.js' ),
		true
	);
	gutenberg_override_script(
		'wp-a11y',
		gutenberg_url( 'build/a11y/index.js' ),
		array( 'wp-dom-ready', 'wp-polyfill' ),
		filemtime( gutenberg_dir_path() . 'build/a11y/index.js' ),
		true
	);
	gutenberg_override_script(
		'wp-hooks',
		gutenberg_url( 'build/hooks/index.js' ),
		array( 'wp-polyfill' ),
		filemtime( gutenberg_dir_path() . 'build/hooks/index.js' ),
		true
	);
	gutenberg_override_script(
		'wp-i18n',
		gutenberg_url( 'build/i18n/index.js' ),
		array( 'wp-polyfill' ),
		filemtime( gutenberg_dir_path() . 'build/i18n/index.js' ),
		true
	);
	gutenberg_override_script(
		'wp-is-shallow-equal',
		gutenberg_url( 'build/is-shallow-equal/index.js' ),
		array( 'wp-polyfill' ),
		filemtime( gutenberg_dir_path() . 'build/is-shallow-equal/index.js' ),
		true
	);
	gutenberg_override_script(
		'wp-token-list',
		gutenberg_url( 'build/token-list/index.js' ),
		array( 'lodash', 'wp-polyfill' ),
		filemtime( gutenberg_dir_path() . 'build/token-list/index.js' ),
		true
	);

	// Editor Scripts.
	gutenberg_override_script(
		'wp-api-fetch',
		gutenberg_url( 'build/api-fetch/index.js' ),
		array( 'wp-polyfill', 'wp-hooks', 'wp-i18n', 'wp-url' ),
		filemtime( gutenberg_dir_path() . 'build/api-fetch/index.js' ),
		true
	);
	wp_add_inline_script(
		'wp-api-fetch',
		sprintf(
			'wp.apiFetch.use( wp.apiFetch.createNonceMiddleware( "%s" ) );',
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

	gutenberg_override_script(
		'wp-deprecated',
		gutenberg_url( 'build/deprecated/index.js' ),
		array( 'wp-polyfill', 'wp-hooks' ),
		filemtime( gutenberg_dir_path() . 'build/deprecated/index.js' ),
		true
	);
	gutenberg_override_script(
		'wp-blob',
		gutenberg_url( 'build/blob/index.js' ),
		array( 'wp-polyfill' ),
		filemtime( gutenberg_dir_path() . 'build/blob/index.js' ),
		true
	);
	gutenberg_override_script(
		'wp-compose',
		gutenberg_url( 'build/compose/index.js' ),
		array( 'lodash', 'wp-element', 'wp-is-shallow-equal', 'wp-polyfill' ),
		filemtime( gutenberg_dir_path() . 'build/compose/index.js' ),
		true
	);
	gutenberg_override_script(
		'wp-keycodes',
		gutenberg_url( 'build/keycodes/index.js' ),
		array( 'lodash', 'wp-polyfill' ),
		filemtime( gutenberg_dir_path() . 'build/keycodes/index.js' ),
		true
	);
	gutenberg_override_script(
		'wp-html-entities',
		gutenberg_url( 'build/html-entities/index.js' ),
		array( 'wp-polyfill' ),
		filemtime( gutenberg_dir_path() . 'build/html-entities/index.js' ),
		true
	);
	gutenberg_override_script(
		'wp-data',
		gutenberg_url( 'build/data/index.js' ),
		array(
			'lodash',
			'wp-compose',
			'wp-deprecated',
			'wp-element',
			'wp-is-shallow-equal',
			'wp-polyfill',
			'wp-redux-routine',
		),
		filemtime( gutenberg_dir_path() . 'build/data/index.js' ),
		true
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
				'		.use( wp.data.plugins.asyncGenerator )',
				'		.use( wp.data.plugins.controls );',
				'} )()',
			)
		)
	);
	gutenberg_override_script(
		'wp-core-data',
		gutenberg_url( 'build/core-data/index.js' ),
		array( 'wp-data', 'wp-api-fetch', 'wp-polyfill', 'wp-url', 'lodash' ),
		filemtime( gutenberg_dir_path() . 'build/core-data/index.js' ),
		true
	);
	gutenberg_override_script(
		'wp-dom',
		gutenberg_url( 'build/dom/index.js' ),
		array( 'lodash', 'wp-polyfill', 'wp-tinymce' ),
		filemtime( gutenberg_dir_path() . 'build/dom/index.js' ),
		true
	);
	gutenberg_override_script(
		'wp-block-serialization-default-parser',
		gutenberg_url( 'build/block-serialization-default-parser/index.js' ),
		array(),
		filemtime( gutenberg_dir_path() . 'build/block-serialization-default-parser/index.js' ),
		true
	);
	gutenberg_override_script(
		'wp-block-serialization-spec-parser',
		gutenberg_url( 'build/block-serialization-spec-parser/index.js' ),
		array( 'wp-polyfill' ),
		filemtime( gutenberg_dir_path() . 'build/block-serialization-spec-parser/index.js' ),
		true
	);
	gutenberg_override_script(
		'wp-shortcode',
		gutenberg_url( 'build/shortcode/index.js' ),
		array( 'wp-polyfill', 'lodash' ),
		filemtime( gutenberg_dir_path() . 'build/shortcode/index.js' ),
		true
	);
	gutenberg_override_script(
		'wp-redux-routine',
		gutenberg_url( 'build/redux-routine/index.js' ),
		array( 'wp-polyfill' ),
		filemtime( gutenberg_dir_path() . 'build/redux-routine/index.js' ),
		true
	);
	gutenberg_override_script(
		'wp-date',
		gutenberg_url( 'build/date/index.js' ),
		array( 'moment', 'wp-polyfill' ),
		filemtime( gutenberg_dir_path() . 'build/date/index.js' ),
		true
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
	gutenberg_override_script(
		'wp-element',
		gutenberg_url( 'build/element/index.js' ),
		array( 'wp-polyfill', 'react', 'react-dom', 'lodash', 'wp-escape-html' ),
		filemtime( gutenberg_dir_path() . 'build/element/index.js' ),
		true
	);
	gutenberg_override_script(
		'wp-escape-html',
		gutenberg_url( 'build/escape-html/index.js' ),
		array( 'wp-polyfill' ),
		filemtime( gutenberg_dir_path() . 'build/element/index.js' ),
		true
	);
	gutenberg_override_script(
		'wp-rich-text',
		gutenberg_url( 'build/rich-text/index.js' ),
		array( 'wp-polyfill', 'wp-escape-html', 'lodash' ),
		filemtime( gutenberg_dir_path() . 'build/rich-text/index.js' ),
		true
	);
	gutenberg_override_script(
		'wp-components',
		gutenberg_url( 'build/components/index.js' ),
		array(
			'lodash',
			'moment',
			'wp-a11y',
			'wp-api-fetch',
			'wp-compose',
			'wp-deprecated',
			'wp-dom',
			'wp-element',
			'wp-hooks',
			'wp-html-entities',
			'wp-i18n',
			'wp-is-shallow-equal',
			'wp-keycodes',
			'wp-polyfill',
			'wp-url',
			'wp-rich-text',
		),
		filemtime( gutenberg_dir_path() . 'build/components/index.js' ),
		true
	);
	wp_add_inline_script(
		'wp-components',
		sprintf( 'wp.components.unstable__setSiteURL(%s);', json_encode( site_url() ) )
	);
	gutenberg_override_script(
		'wp-blocks',
		gutenberg_url( 'build/blocks/index.js' ),
		array(
			'wp-autop',
			'wp-blob',
			'wp-block-serialization-default-parser',
			'wp-data',
			'wp-deprecated',
			'wp-dom',
			'wp-element',
			'wp-hooks',
			'wp-i18n',
			'wp-is-shallow-equal',
			'wp-polyfill',
			'wp-shortcode',
			'lodash',
		),
		filemtime( gutenberg_dir_path() . 'build/blocks/index.js' ),
		true
	);
	gutenberg_override_script(
		'wp-viewport',
		gutenberg_url( 'build/viewport/index.js' ),
		array( 'wp-polyfill', 'wp-element', 'wp-data', 'wp-compose', 'lodash' ),
		filemtime( gutenberg_dir_path() . 'build/viewport/index.js' ),
		true
	);
	gutenberg_override_script(
		'wp-block-library',
		gutenberg_url( 'build/block-library/index.js' ),
		array(
			'editor',
			'lodash',
			'moment',
			'wp-api-fetch',
			'wp-autop',
			'wp-blob',
			'wp-blocks',
			'wp-components',
			'wp-compose',
			'wp-core-data',
			'wp-data',
			'wp-date',
			'wp-editor',
			'wp-element',
			'wp-html-entities',
			'wp-i18n',
			'wp-keycodes',
			'wp-polyfill',
			'wp-url',
			'wp-viewport',
			'wp-rich-text',
		),
		filemtime( gutenberg_dir_path() . 'build/block-library/index.js' ),
		true
	);
	gutenberg_override_script(
		'wp-nux',
		gutenberg_url( 'build/nux/index.js' ),
		array(
			'wp-element',
			'wp-components',
			'wp-compose',
			'wp-data',
			'wp-i18n',
			'wp-polyfill',
			'lodash',
		),
		filemtime( gutenberg_dir_path() . 'build/nux/index.js' ),
		true
	);
	gutenberg_override_script(
		'wp-plugins',
		gutenberg_url( 'build/plugins/index.js' ),
		array( 'lodash', 'wp-compose', 'wp-element', 'wp-hooks', 'wp-polyfill' ),
		filemtime( gutenberg_dir_path() . 'build/plugins/index.js' )
	);
	// Loading the old editor and its config to ensure the classic block works as expected.
	wp_add_inline_script(
		'editor',
		'window.wp.oldEditor = window.wp.editor;',
		'after'
	);
	$tinymce_settings = apply_filters(
		'tiny_mce_before_init',
		array(
			'plugins'          => implode(
				',',
				array_unique(
					apply_filters(
						'tiny_mce_plugins',
						array(
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
						)
					)
				)
			),
			'toolbar1'         => implode(
				',',
				array_merge(
					apply_filters(
						'mce_buttons',
						array(
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
						),
						'editor'
					),
					array( 'kitchensink' )
				)
			),
			'toolbar2'         => implode(
				',',
				apply_filters(
					'mce_buttons_2',
					array(
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
					),
					'editor'
				)
			),
			'toolbar3'         => implode( ',', apply_filters( 'mce_buttons_3', array(), 'editor' ) ),
			'toolbar4'         => implode( ',', apply_filters( 'mce_buttons_4', array(), 'editor' ) ),
			'external_plugins' => apply_filters( 'mce_external_plugins', array() ),
		),
		'editor'
	);
	if ( isset( $tinymce_settings['style_formats'] ) && is_string( $tinymce_settings['style_formats'] ) ) {
		// Decode the options as we used to recommende json_encoding the TinyMCE settings.
		$tinymce_settings['style_formats'] = json_decode( $tinymce_settings['style_formats'] );
	}
	wp_localize_script(
		'wp-block-library',
		'wpEditorL10n',
		array(
			'tinymce' => array(
				'baseURL'  => includes_url( 'js/tinymce' ),
				'suffix'   => SCRIPT_DEBUG ? '' : '.min',
				'settings' => $tinymce_settings,
			),
		)
	);

	gutenberg_override_script(
		'wp-editor',
		gutenberg_url( 'build/editor/index.js' ),
		array(
			'jquery',
			'lodash',
			'tinymce-latest-lists',
			'wp-a11y',
			'wp-api-fetch',
			'wp-blob',
			'wp-blocks',
			'wp-components',
			'wp-compose',
			'wp-core-data',
			'wp-data',
			'wp-date',
			'wp-deprecated',
			'wp-dom',
			'wp-element',
			'wp-hooks',
			'wp-html-entities',
			'wp-i18n',
			'wp-is-shallow-equal',
			'wp-keycodes',
			'wp-nux',
			'wp-polyfill',
			'wp-tinymce',
			'wp-token-list',
			'wp-url',
			'wp-viewport',
			'wp-wordcount',
			'wp-rich-text',
		),
		filemtime( gutenberg_dir_path() . 'build/editor/index.js' )
	);

	gutenberg_override_script(
		'wp-edit-post',
		gutenberg_url( 'build/edit-post/index.js' ),
		array(
			'jquery',
			'lodash',
			'postbox',
			'media-models',
			'media-views',
			'wp-a11y',
			'wp-api-fetch',
			'wp-block-library',
			'wp-blocks',
			'wp-components',
			'wp-compose',
			'wp-core-data',
			'wp-data',
			'wp-deprecated',
			'wp-dom-ready',
			'wp-editor',
			'wp-element',
			'wp-embed',
			'wp-i18n',
			'wp-keycodes',
			'wp-nux',
			'wp-plugins',
			'wp-polyfill',
			'wp-url',
			'wp-viewport',
		),
		filemtime( gutenberg_dir_path() . 'build/edit-post/index.js' ),
		true
	);

	gutenberg_override_script(
		'wp-list-reusable-blocks',
		gutenberg_url( 'build/list-reusable-blocks/index.js' ),
		array(
			'lodash',
			'wp-api-fetch',
			'wp-components',
			'wp-compose',
			'wp-element',
			'wp-i18n',
			'wp-polyfill-ecmascript',
		),
		filemtime( gutenberg_dir_path() . 'build/list-reusable-blocks/index.js' ),
		true
	);

	// Editor Styles.
	// This empty stylesheet is defined to ensure backwards compatibility.
	gutenberg_override_style( 'wp-blocks', false );

	$fonts_url = '';

	/*
	 * Translators: If there are characters in your language that are not supported
	 * by Noto Serif, translate this to 'off'. Do not translate into your own language.
	 */
	if ( 'off' !== _x( 'on', 'Noto Serif font: on or off', 'gutenberg' ) ) {
		$query_args = array(
			'family' => urlencode( 'Noto Serif:400,400i,700,700i' ),
		);

		$fonts_url = esc_url_raw( add_query_arg( $query_args, 'https://fonts.googleapis.com/css' ) );
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
		'wp-edit-blocks',
		gutenberg_url( 'build/block-library/editor.css' ),
		array(
			'wp-components',
			'wp-editor',
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
 * @param  array  $memo Reduce accumulator.
 * @param  string $path REST API path to preload.
 * @return array        Modified reduce accumulator.
 */
function gutenberg_preload_api_request( $memo, $path ) {

	// array_reduce() doesn't support passing an array in PHP 5.2
	// so we need to make sure we start with one.
	if ( ! is_array( $memo ) ) {
		$memo = array();
	}

	if ( empty( $path ) ) {
		return $memo;
	}

	$path_parts = parse_url( $path );
	if ( false === $path_parts ) {
		return $memo;
	}

	$request = new WP_REST_Request( 'GET', $path_parts['path'] );
	if ( ! empty( $path_parts['query'] ) ) {
		parse_str( $path_parts['query'], $query_params );
		$request->set_query_params( $query_params );
	}

	$response = rest_do_request( $request );
	if ( 200 === $response->status ) {
		$server = rest_get_server();
		$data   = (array) $response->get_data();
		if ( method_exists( $server, 'get_compact_response_links' ) ) {
			$links = call_user_func( array( $server, 'get_compact_response_links' ), $response );
		} else {
			$links = call_user_func( array( $server, 'get_response_links' ), $response );
		}
		if ( ! empty( $links ) ) {
			$data['_links'] = $links;
		}

		$memo[ $path ] = array(
			'body'    => $data,
			'headers' => $response->headers,
		);
	}

	return $memo;
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
		'https://unpkg.com/react@16.4.1/umd/react' . $react_suffix . '.js'
	);
	gutenberg_register_vendor_script(
		'react-dom',
		'https://unpkg.com/react-dom@16.4.1/umd/react-dom' . $react_suffix . '.js',
		array( 'react' )
	);
	$moment_script = SCRIPT_DEBUG ? 'moment.js' : 'min/moment.min.js';
	gutenberg_register_vendor_script(
		'moment',
		'https://unpkg.com/moment@2.22.1/' . $moment_script,
		array()
	);
	$tinymce_version = '4.7.11';
	gutenberg_register_vendor_script(
		'tinymce-latest-lists',
		'https://unpkg.com/tinymce@' . $tinymce_version . '/plugins/lists/plugin' . $suffix . '.js',
		array( 'wp-tinymce' )
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
		'wp-polyfill-ecmascript',
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
 * @return array An associative array of registered block data.
 */
function gutenberg_prepare_blocks_for_js() {
	$block_registry = WP_Block_Type_Registry::get_instance();
	$blocks         = array();
	$keys_to_pick   = array( 'title', 'description', 'icon', 'category', 'keywords', 'supports', 'attributes' );

	foreach ( $block_registry->get_all_registered() as $block_name => $block_type ) {
		foreach ( $keys_to_pick as $key ) {
			if ( ! isset( $block_type->{ $key } ) ) {
				continue;
			}

			if ( ! isset( $blocks[ $block_name ] ) ) {
				$blocks[ $block_name ] = array();
			}

			$blocks[ $block_name ][ $key ] = $block_type->{ $key };
		}
	}

	return $blocks;
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
 * The code editor settings that were last captured by
 * gutenberg_capture_code_editor_settings().
 *
 * @var array|false
 */
$gutenberg_captured_code_editor_settings = false;

/**
 * When passed to the wp_code_editor_settings filter, this function captures
 * the code editor settings given to it and then prevents
 * wp_enqueue_code_editor() from enqueuing any assets.
 *
 * This is a workaround until e.g. code_editor_settings() is added to Core.
 *
 * @since 2.1.0
 *
 * @param array $settings Code editor settings.
 * @return false
 */
function gutenberg_capture_code_editor_settings( $settings ) {
	global $gutenberg_captured_code_editor_settings;
	$gutenberg_captured_code_editor_settings = $settings;
	return false;
}

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
 *
 * @param  WP_Post $post Post object.
 * @return Object[] Block categories.
 */
function gutenberg_get_block_categories( $post ) {
	$default_categories = array(
		array(
			'slug'  => 'common',
			'title' => __( 'Common Blocks', 'gutenberg' ),
		),
		array(
			'slug'  => 'formatting',
			'title' => __( 'Formatting', 'gutenberg' ),
		),
		array(
			'slug'  => 'layout',
			'title' => __( 'Layout Elements', 'gutenberg' ),
		),
		array(
			'slug'  => 'widgets',
			'title' => __( 'Widgets', 'gutenberg' ),
		),
		array(
			'slug'  => 'embed',
			'title' => __( 'Embeds', 'gutenberg' ),
		),
		array(
			'slug'  => 'reusable',
			'title' => __( 'Reusable Blocks', 'gutenberg' ),
		),
	);

	return apply_filters( 'block_categories', $default_categories, $post );
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

	global $wp_scripts;

	// Add "wp-hooks" as dependency of "heartbeat".
	$heartbeat_script = $wp_scripts->query( 'heartbeat', 'registered' );
	if ( $heartbeat_script && ! in_array( 'wp-hooks', $heartbeat_script->deps ) ) {
		$heartbeat_script->deps[] = 'wp-hooks';
	}

	// Enqueue heartbeat separately as an "optional" dependency of the editor.
	// Heartbeat is used for automatic nonce refreshing, but some hosts choose
	// to disable it outright.
	wp_enqueue_script( 'heartbeat' );

	// Transform a "heartbeat-tick" jQuery event into "heartbeat.tick" hook action.
	// This removes the need of using jQuery for listening to the event.
	wp_add_inline_script(
		'heartbeat',
		'jQuery( document ).on( "heartbeat-tick", function ( event, response ) { wp.hooks.doAction( "heartbeat.tick", response ) } );',
		'after'
	);

	// Ignore Classic Editor's `rich_editing` user option, aka "Disable visual
	// editor". Forcing this to be true guarantees that TinyMCE and its plugins
	// are available in Gutenberg. Fixes
	// https://github.com/WordPress/gutenberg/issues/5667.
	add_filter( 'user_can_richedit', '__return_true' );

	wp_enqueue_script( 'wp-edit-post' );

	global $post;

	// Set initial title to empty string for auto draft for duration of edit.
	// Otherwise, title defaults to and displays as "Auto Draft".
	$is_new_post = 'auto-draft' === $post->post_status;

	// Set the post type name.
	$post_type        = get_post_type( $post );
	$post_type_object = get_post_type_object( $post_type );
	$rest_base        = ! empty( $post_type_object->rest_base ) ? $post_type_object->rest_base : $post_type_object->name;

	// Preload common data.
	$preload_paths = array(
		'/',
		'/wp/v2/types?context=edit',
		'/wp/v2/taxonomies?per_page=-1&context=edit',
		'/wp/v2/themes?status=active',
		sprintf( '/wp/v2/%s/%s?context=edit', $rest_base, $post->ID ),
		sprintf( '/wp/v2/types/%s?context=edit', $post_type ),
		sprintf( '/wp/v2/users/me?post_type=%s&context=edit', $post_type ),
	);

	// Ensure the global $post remains the same after
	// API data is preloaded. Because API preloading
	// can call the_content and other filters, callbacks
	// can unexpectedly modify $post resulting in issues
	// like https://github.com/WordPress/gutenberg/issues/7468.
	$backup_global_post = $post;

	$preload_data = array_reduce(
		$preload_paths,
		'gutenberg_preload_api_request',
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
		sprintf( 'wp.blocks.setCategories( %s );', wp_json_encode( gutenberg_get_block_categories( $post ) ) ),
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
			'title'   => array(
				'raw' => __( 'Welcome to the Gutenberg Editor', 'gutenberg' ),
			),
			'content' => array(
				'raw' => $demo_content,
			),
		);
	} elseif ( $is_new_post ) {
		// Override "(Auto Draft)" new post default title with empty string,
		// or filtered value.
		$initial_edits = array(
			'title'   => array(
				'raw' => $post->post_title,
			),
			'content' => array(
				'raw' => $post->post_content,
			),
			'excerpt' => array(
				'raw' => $post->post_excerpt,
			),
		);
	} else {
		$initial_edits = null;
	}

	// Prepare Jed locale data.
	$locale_data = gutenberg_get_jed_locale_data( 'gutenberg' );
	wp_add_inline_script(
		'wp-i18n',
		'wp.i18n.setLocaleData( ' . json_encode( $locale_data ) . ' );'
	);

	// Preload server-registered block schemas.
	wp_add_inline_script(
		'wp-blocks',
		'wp.blocks.unstable__bootstrapServerSideBlockDefinitions(' . json_encode( gutenberg_prepare_blocks_for_js() ) . ');'
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

	// Populate default code editor settings by short-circuiting wp_enqueue_code_editor.
	global $gutenberg_captured_code_editor_settings;
	add_filter( 'wp_code_editor_settings', 'gutenberg_capture_code_editor_settings' );
	wp_enqueue_code_editor( array( 'type' => 'text/html' ) );
	remove_filter( 'wp_code_editor_settings', 'gutenberg_capture_code_editor_settings' );
	wp_add_inline_script(
		'wp-editor',
		sprintf(
			'window._wpGutenbergCodeEditorSettings = %s;',
			wp_json_encode( $gutenberg_captured_code_editor_settings )
		)
	);

	// Initialize the editor.
	$gutenberg_theme_support = get_theme_support( 'gutenberg' );
	$align_wide              = get_theme_support( 'align-wide' );
	$color_palette           = current( (array) get_theme_support( 'editor-color-palette' ) );
	$font_sizes              = current( (array) get_theme_support( 'editor-font-sizes' ) );

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
	if ( $editor_styles && current_theme_supports( 'editor-styles' ) ) {
		foreach ( $editor_styles as $style ) {
			if ( filter_var( $style, FILTER_VALIDATE_URL ) ) {
				$styles[] = array(
					'css' => file_get_contents( $style ),
				);
			} else {
				$file     = get_theme_file_path( $style );
				$styles[] = array(
					'css'     => file_get_contents( get_theme_file_path( $style ) ),
					'baseURL' => get_theme_file_uri( $style ),
				);
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
		'bodyPlaceholder'        => apply_filters( 'write_your_story', __( 'Write your story', 'gutenberg' ), $post ),
		'isRTL'                  => is_rtl(),
		'autosaveInterval'       => 10,
		'maxUploadFileSize'      => $max_upload_size,
		'allowedMimeTypes'       => get_allowed_mime_types(),
		'styles'                 => $styles,
		'postLock'               => $lock_details,

		// Ideally, we'd remove this and rely on a REST API endpoint.
		'postLockUtils'          => array(
			'nonce'       => wp_create_nonce( 'lock-post_' . $post->ID ),
			'unlockNonce' => wp_create_nonce( 'update-post_' . $post->ID ),
			'ajaxUrl'     => admin_url( 'admin-ajax.php' ),
		),
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

	$init_script = <<<JS
	( function() {
		window._wpLoadGutenbergEditor = new Promise( function( resolve ) {
			wp.domReady( function() {
				resolve( wp.editPost.initializeEditor( 'editor', "%s", %d, %s, %s ) );
			} );
		} );
} )();
JS;

	/**
	 * Filters the settings to pass to the block editor.
	 *
	 * @since 3.7.0
	 *
	 * @param array   $editor_settings Default editor settings.
	 * @param WP_Post $post            Post being edited.
	 */
	$editor_settings = apply_filters( 'block_editor_settings', $editor_settings, $post );

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
 * @param string $hook Screen name.
 */
function gutenberg_load_list_reusable_blocks( $hook ) {
	$is_reusable_blocks_list_page = 'edit.php' === $hook && isset( $_GET['post_type'] ) && 'wp_block' === $_GET['post_type'];
	if ( $is_reusable_blocks_list_page ) {
		wp_enqueue_script( 'wp-list-reusable-blocks' );
		wp_enqueue_style( 'wp-list-reusable-blocks' );
	}
}
add_action( 'admin_enqueue_scripts', 'gutenberg_load_list_reusable_blocks' );
