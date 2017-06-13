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
 * Registers common scripts and styles to be used as dependencies of the editor
 * and plugins.
 *
 * @since 0.1.0
 */
function gutenberg_register_scripts_and_styles() {
	gutenberg_register_vendor_scripts();

	// Editor Scripts.
	wp_register_script(
		'wp-utils',
		gutenberg_url( 'utils/build/index.js' ),
		array(),
		filemtime( gutenberg_dir_path() . 'utils/build/index.js' )
	);
	wp_register_script(
		'wp-date',
		gutenberg_url( 'date/build/index.js' ),
		array( 'moment' ),
		filemtime( gutenberg_dir_path() . 'date/build/index.js' )
	);
	global $wp_locale;
	wp_add_inline_script( 'wp-date', 'window._wpDateSettings = ' . wp_json_encode( array(
		'l10n' => array(
			'locale'        => get_locale(),
			'months'        => array_values( $wp_locale->month ),
			'monthsShort'   => array_values( $wp_locale->month_abbrev ),
			'weekdays'      => array_values( $wp_locale->weekday ),
			'weekdaysShort' => array_values( $wp_locale->weekday_abbrev ),
			'meridiem'      => (object) $wp_locale->meridiem,
			'relative' => array(
				/* translators: %s: duration */
				'future' => __( '%s from now' ),
				/* translators: %s: duration */
				'past'   => __( '%s ago' ),
			),
		),
		'formats' => array(
			'time'     => get_option( 'time_format', __( 'g:i a' ) ),
			'date'     => get_option( 'date_format', __( 'F j, Y' ) ),
			'datetime' => __( 'F j, Y g:i a' ),
		),
		'timezone' => array(
			'offset' => get_option( 'gmt_offset', 0 ),
			'string' => get_option( 'timezone_string', 'UTC' ),
		),
	) ), 'before' );
	wp_register_script(
		'wp-i18n',
		gutenberg_url( 'i18n/build/index.js' ),
		array(),
		filemtime( gutenberg_dir_path() . 'i18n/build/index.js' )
	);
	wp_register_script(
		'wp-element',
		gutenberg_url( 'element/build/index.js' ),
		array( 'react', 'react-dom', 'react-dom-server' ),
		filemtime( gutenberg_dir_path() . 'element/build/index.js' )
	);
	wp_register_script(
		'wp-components',
		gutenberg_url( 'components/build/index.js' ),
		array( 'wp-element' ),
		filemtime( gutenberg_dir_path() . 'components/build/index.js' )
	);
	wp_register_script(
		'wp-blocks',
		gutenberg_url( 'blocks/build/index.js' ),
		array( 'wp-element', 'wp-components', 'wp-utils', 'tinymce-nightly', 'tinymce-nightly-lists' ),
		filemtime( gutenberg_dir_path() . 'blocks/build/index.js' )
	);

	// Editor Styles.
	wp_register_style(
		'wp-components',
		gutenberg_url( 'components/build/style.css' ),
		array(),
		filemtime( gutenberg_dir_path() . 'components/build/style.css' )
	);
	wp_register_style(
		'wp-blocks',
		gutenberg_url( 'blocks/build/style.css' ),
		array(),
		filemtime( gutenberg_dir_path() . 'blocks/build/style.css' )
	);
}
add_action( 'init', 'gutenberg_register_scripts_and_styles' );

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
		'https://unpkg.com/react@next/umd/react' . $react_suffix . '.js'
	);
	gutenberg_register_vendor_script(
		'react-dom',
		'https://unpkg.com/react-dom@next/umd/react-dom' . $react_suffix . '.js',
		array( 'react' )
	);
	gutenberg_register_vendor_script(
		'react-dom-server',
		'https://unpkg.com/react-dom@next/umd/react-dom-server' . $react_suffix . '.js',
		array( 'react' )
	);
	$moment_script = SCRIPT_DEBUG ? 'moment.js' : 'min/moment.min.js';
	gutenberg_register_vendor_script(
		'moment',
		'https://unpkg.com/moment@2.18.1/' . $moment_script,
		array( 'react' )
	);
	gutenberg_register_vendor_script(
		'tinymce-nightly',
		'https://fiddle.azurewebsites.net/tinymce/nightly/tinymce' . $suffix . '.js'
	);
	gutenberg_register_vendor_script(
		'tinymce-nightly-lists',
		'https://fiddle.azurewebsites.net/tinymce/nightly/plugins/lists/plugin' . $suffix . '.js',
		array( 'tinymce-nightly' )
	);
}

/**
 * Retrieves a unique and reasonably short and human-friendly filename for a
 * vendor script based on a URL.
 *
 * @param  string $src Full URL of the external script.
 *
 * @return string      Script filename suitable for local caching.
 *
 * @since 0.1.0
 */
function gutenberg_vendor_script_filename( $src ) {
	$filename = basename( $src );
	$hash = substr( md5( $src ), 0, 8 );

	$match = preg_match(
		'/^'
		. '(?P<prefix>.*?)'
		. '(?P<ignore>\.development|\.production)?'
		. '(?P<suffix>\.min)?'
		. '(?P<extension>\.js)'
		. '(?P<extra>.*)'
		. '$/',
		$filename,
		$filename_pieces
	);

	if ( ! $match ) {
		return "$filename.$hash.js";
	}

	$match = preg_match(
		'@tinymce.*/plugins/([^/]+)/plugin(\.min)?\.js$@',
		$src,
		$tinymce_plugin_pieces
	);
	if ( $match ) {
		$filename_pieces['prefix'] = 'tinymce-plugin-' . $tinymce_plugin_pieces[1];
	}

	return $filename_pieces['prefix'] . $filename_pieces['suffix']
		. '.' . $hash
		. $filename_pieces['extension'];
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

	$filename = gutenberg_vendor_script_filename( $src );

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
			wp_register_script( $handle, $src, $deps );
			return;
		}
		fclose( $f );
		$response = wp_remote_get( $src );
		if ( wp_remote_retrieve_response_code( $response ) !== 200 ) {
			// The request failed; just enqueue the script directly from the
			// URL.  This will probably fail too, but surfacing the error to
			// the browser is probably the best we can do.
			wp_register_script( $handle, $src, $deps );
			// If our file was newly created above, it will have a size of
			// zero, and we need to delete it so that we don't think it's
			// already cached on the next request.
			if ( ! filesize( $full_path ) ) {
				unlink( $full_path );
			}
			return;
		}
		$f = fopen( $full_path, 'w' );
		fwrite( $f, wp_remote_retrieve_body( $response ) );
		fclose( $f );
	}

	wp_register_script(
		$handle,
		gutenberg_url( 'vendor/' . $filename ),
		$deps
	);
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
function gutenberg_scripts_and_styles( $hook ) {
	if ( ! preg_match( '/(toplevel|gutenberg)_page_gutenberg(-demo)?/', $hook, $page_match ) ) {
		return;
	}

	$is_demo = isset( $page_match[2] );

	/**
	 * Scripts
	 */
	wp_enqueue_media();

	// The editor code itself.
	wp_enqueue_script(
		'wp-editor',
		gutenberg_url( 'editor/build/index.js' ),
		array( 'wp-api', 'wp-date', 'wp-i18n', 'wp-blocks', 'wp-element', 'wp-components', 'wp-utils' ),
		filemtime( gutenberg_dir_path() . 'editor/build/index.js' ),
		true // enqueue in the footer.
	);

	// Load an actual post if an ID is specified.
	$post_to_edit = null;
	if ( isset( $_GET['post_id'] ) && (int) $_GET['post_id'] > 0 ) {
		$request = new WP_REST_Request(
			'GET',
			sprintf( '/wp/v2/posts/%d', (int) $_GET['post_id'] )
		);
		$request->set_param( 'context', 'edit' );
		$response = rest_do_request( $request );
		if ( 200 === $response->get_status() ) {
			$post_to_edit = $response->get_data();
		}
	}

	// Initialize the post data...
	if ( $post_to_edit ) {
		// ...with a real post
		wp_add_inline_script(
			'wp-editor',
			'window._wpGutenbergPost = ' . wp_json_encode( $post_to_edit ) . ';'
		);
	} elseif ( $is_demo ) {
		// ...with some test content
		wp_add_inline_script(
			'wp-editor',
			file_get_contents( gutenberg_dir_path() . 'post-content.js' )
		);
	} else {
		// TODO: Error handling.
	}

	// Prepare Jed locale data.
	$locale_data = gutenberg_get_jed_locale_data( 'gutenberg' );
	wp_add_inline_script(
		'wp-editor',
		'wp.i18n.setLocaleData( ' . json_encode( $locale_data ) . ' );',
		'before'
	);

	// Initialize the editor.
	wp_add_inline_script( 'wp-editor', 'wp.editor.createEditorInstance( \'editor\', window._wpGutenbergPost );' );

	/**
	 * Styles
	 */

	wp_enqueue_style(
		'wp-editor-font',
		'https://fonts.googleapis.com/css?family=Noto+Serif:400,400i,700,700i'
	);
	wp_enqueue_style(
		'wp-editor',
		gutenberg_url( 'editor/build/style.css' ),
		array( 'wp-components', 'wp-blocks' ),
		filemtime( gutenberg_dir_path() . 'editor/build/style.css' )
	);
}
add_action( 'admin_enqueue_scripts', 'gutenberg_scripts_and_styles' );
