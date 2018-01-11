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
		'wp-data',
		gutenberg_url( 'data/build/index.js' ),
		array(),
		filemtime( gutenberg_dir_path() . 'data/build/index.js' )
	);
	wp_register_script(
		'wp-utils',
		gutenberg_url( 'utils/build/index.js' ),
		array(),
		filemtime( gutenberg_dir_path() . 'utils/build/index.js' )
	);
	wp_register_script(
		'wp-hooks',
		gutenberg_url( 'hooks/build/index.js' ),
		array(),
		filemtime( gutenberg_dir_path() . 'hooks/build/index.js' )
	);
	wp_register_script(
		'wp-date',
		gutenberg_url( 'date/build/index.js' ),
		array( 'moment' ),
		filemtime( gutenberg_dir_path() . 'date/build/index.js' )
	);
	global $wp_locale;
	wp_add_inline_script( 'wp-date', 'window._wpDateSettings = ' . wp_json_encode( array(
		'l10n'     => array(
			'locale'        => get_locale(),
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
			'time'     => get_option( 'time_format', __( 'g:i a', 'default' ) ),
			'date'     => get_option( 'date_format', __( 'F j, Y', 'default' ) ),
			'datetime' => __( 'F j, Y g:i a', 'default' ),
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
		array( 'wp-element', 'wp-i18n', 'wp-utils', 'wp-hooks', 'wp-api-request', 'moment' ),
		filemtime( gutenberg_dir_path() . 'components/build/index.js' )
	);
	wp_register_script(
		'wp-blocks',
		gutenberg_url( 'blocks/build/index.js' ),
		array( 'wp-element', 'wp-components', 'wp-utils', 'wp-hooks', 'wp-i18n', 'tinymce-latest', 'tinymce-latest-lists', 'tinymce-latest-paste', 'tinymce-latest-table', 'media-views', 'media-models', 'shortcode' ),
		filemtime( gutenberg_dir_path() . 'blocks/build/index.js' )
	);
	wp_add_inline_script(
		'wp-blocks',
		gutenberg_get_script_polyfill( array(
			'\'Promise\' in window' => 'promise',
			'\'fetch\' in window'   => 'fetch',
		) ),
		'before'
	);

	// Editor Styles.
	wp_register_style(
		'wp-components',
		gutenberg_url( 'components/build/style.css' ),
		array(),
		filemtime( gutenberg_dir_path() . 'components/build/style.css' )
	);
	wp_style_add_data( 'wp-components', 'rtl', 'replace' );

	wp_register_style(
		'wp-blocks',
		gutenberg_url( 'blocks/build/style.css' ),
		array(),
		filemtime( gutenberg_dir_path() . 'blocks/build/style.css' )
	);
	wp_style_add_data( 'wp-blocks', 'rtl', 'replace' );

	wp_register_style(
		'wp-edit-blocks',
		gutenberg_url( 'blocks/build/edit-blocks.css' ),
		array(),
		filemtime( gutenberg_dir_path() . 'blocks/build/edit-blocks.css' )
	);
	wp_style_add_data( 'wp-edit-blocks', 'rtl', 'replace' );
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
		$memo[ $path ] = array(
			'body'    => $response->data,
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
		'https://unpkg.com/react@16.2.0/umd/react' . $react_suffix . '.js'
	);
	gutenberg_register_vendor_script(
		'react-dom',
		'https://unpkg.com/react-dom@16.2.0/umd/react-dom' . $react_suffix . '.js',
		array( 'react' )
	);
	gutenberg_register_vendor_script(
		'react-dom-server',
		'https://unpkg.com/react-dom@16.2.0/umd/react-dom-server.browser' . $react_suffix . '.js',
		array( 'react' )
	);
	$moment_script = SCRIPT_DEBUG ? 'moment.js' : 'min/moment.min.js';
	gutenberg_register_vendor_script(
		'moment',
		'https://unpkg.com/moment@2.18.1/' . $moment_script,
		array( 'react' )
	);
	$tinymce_version = '4.7.2';
	gutenberg_register_vendor_script(
		'tinymce-latest',
		'https://unpkg.com/tinymce@' . $tinymce_version . '/tinymce' . $suffix . '.js'
	);
	gutenberg_register_vendor_script(
		'tinymce-latest-lists',
		'https://unpkg.com/tinymce@' . $tinymce_version . '/plugins/lists/plugin' . $suffix . '.js',
		array( 'tinymce-latest' )
	);
	gutenberg_register_vendor_script(
		'tinymce-latest-paste',
		'https://unpkg.com/tinymce@' . $tinymce_version . '/plugins/paste/plugin' . $suffix . '.js',
		array( 'tinymce-latest' )
	);
	gutenberg_register_vendor_script(
		'tinymce-latest-table',
		'https://unpkg.com/tinymce@' . $tinymce_version . '/plugins/table/plugin' . $suffix . '.js',
		array( 'tinymce-latest' )
	);
	gutenberg_register_vendor_script(
		'fetch',
		'https://unpkg.com/whatwg-fetch/fetch.js'
	);
	gutenberg_register_vendor_script(
		'promise',
		'https://unpkg.com/promise-polyfill@7.0.0/dist/promise' . $suffix . '.js'
	);

	// TODO: This is only necessary so long as WordPress 4.9 is not yet stable,
	// since we depend on the newly-introduced wp-api-request script handle.
	//
	// See: gutenberg_ensure_wp_api_request (compat.php).
	gutenberg_register_vendor_script(
		'wp-api-request-shim',
		'https://rawgit.com/WordPress/wordpress-develop/master/src/wp-includes/js/api-request.js'
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
	$hash     = substr( md5( $src ), 0, 8 );

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
 * Given a REST data response with links, returns the href value of a specified
 * link relation with optional context.
 *
 * @since 0.10.0
 *
 * @param  array  $data    REST response data.
 * @param  string $link    Link relation.
 * @param  string $context Optional context to append.
 * @return string          Link relation URI, or empty string if none exists.
 */
function gutenberg_get_rest_link( $data, $link, $context = null ) {
	// Check whether a link entry with href exists.
	if ( empty( $data['_links'] ) || empty( $data['_links'][ $link ] ) ||
			! isset( $data['_links'][ $link ][0]['href'] ) ) {
		return '';
	}

	$href = $data['_links'][ $link ][0]['href'];

	// Strip API root prefix.
	$api_root = untrailingslashit( get_rest_url() );
	if ( 0 === strpos( $href, $api_root ) ) {
		$href = substr( $href, strlen( $api_root ) );
	}

	// Add optional context.
	if ( ! is_null( $context ) ) {
		$href = add_query_arg( 'context', $context, $href );
	}

	return $href;
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
			wp_register_script( $handle, $src, $deps, null );
			return;
		}
		fclose( $f );
		$response = wp_remote_get( $src );
		if ( wp_remote_retrieve_response_code( $response ) !== 200 ) {
			// The request failed; just enqueue the script directly from the
			// URL.  This will probably fail too, but surfacing the error to
			// the browser is probably the best we can do.
			wp_register_script( $handle, $src, $deps, null );
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
		$deps,
		null
	);
}

/**
 * Extend wp-api Backbone client with methods to look up the REST API endpoints for all post types.
 *
 * This is temporary while waiting for #41111 in core.
 *
 * @link https://core.trac.wordpress.org/ticket/41111
 */
function gutenberg_extend_wp_api_backbone_client() {
	// Post Types Mapping.
	$post_type_rest_base_mapping = array();
	foreach ( get_post_types( array(), 'objects' ) as $post_type_object ) {
		$rest_base = ! empty( $post_type_object->rest_base ) ? $post_type_object->rest_base : $post_type_object->name;
		$post_type_rest_base_mapping[ $post_type_object->name ] = $rest_base;
	}

	// Taxonomies Mapping.
	$taxonomy_rest_base_mapping = array();
	foreach ( get_taxonomies( array(), 'objects' ) as $taxonomy_object ) {
		$rest_base = ! empty( $taxonomy_object->rest_base ) ? $taxonomy_object->rest_base : $taxonomy_object->name;
		$taxonomy_rest_base_mapping[ $taxonomy_object->name ] = $rest_base;
	}

	$script  = sprintf( 'wp.api.postTypeRestBaseMapping = %s;', wp_json_encode( $post_type_rest_base_mapping ) );
	$script .= sprintf( 'wp.api.taxonomyRestBaseMapping = %s;', wp_json_encode( $taxonomy_rest_base_mapping ) );
	$script .= <<<JS
		wp.api.getPostTypeModel = function( postType ) {
			var route = '/' + wpApiSettings.versionString + this.postTypeRestBaseMapping[ postType ] + '/(?P<id>[\\\\d]+)';
			return _.find( wp.api.models, function( model ) {
				return model.prototype.route && route === model.prototype.route.index;
			} );
		};
		wp.api.getTaxonomyModel = function( taxonomy ) {
			var route = '/' + wpApiSettings.versionString + this.taxonomyRestBaseMapping[ taxonomy ] + '/(?P<id>[\\\\d]+)';
			return _.find( wp.api.models, function( model ) {
				return model.prototype.route && route === model.prototype.route.index;
			} );
		};
		wp.api.getTaxonomyCollection = function( taxonomy ) {
			var route = '/' + wpApiSettings.versionString + this.taxonomyRestBaseMapping[ taxonomy ];
			return _.find( wp.api.collections, function( model ) {
				return model.prototype.route && route === model.prototype.route.index;
			} );
		};
JS;
	wp_add_inline_script( 'wp-api', $script );

	// Localize the wp-api settings and schema.
	$schema_response = rest_do_request( new WP_REST_Request( 'GET', '/' ) );
	if ( ! $schema_response->is_error() ) {
		wp_add_inline_script( 'wp-api', sprintf(
			'wpApiSettings.cacheSchema = true; wpApiSettings.schema = %s;',
			wp_json_encode( $schema_response->get_data() )
		), 'before' );
	}
}

/**
 * Get post to edit.
 *
 * @param int $post_id Post ID to edit.
 * @return array|WP_Error The post resource data or a WP_Error on failure.
 */
function gutenberg_get_post_to_edit( $post_id ) {
	$post = get_post( $post_id );
	if ( ! $post ) {
		return new WP_Error( 'post_not_found', __( 'Post not found.', 'gutenberg' ) );
	}

	$post_type_object = get_post_type_object( $post->post_type );
	if ( ! $post_type_object ) {
		return new WP_Error( 'unrecognized_post_type', __( 'Unrecognized post type.', 'gutenberg' ) );
	}

	if ( ! current_user_can( 'edit_post', $post->ID ) ) {
		return new WP_Error( 'unauthorized_post_type', __( 'Unauthorized post type.', 'gutenberg' ) );
	}

	$request = new WP_REST_Request(
		'GET',
		sprintf( '/wp/v2/%s/%d', ! empty( $post_type_object->rest_base ) ? $post_type_object->rest_base : $post_type_object->name, $post->ID )
	);
	$request->set_param( 'context', 'edit' );
	$response = rest_do_request( $request );
	if ( $response->is_error() ) {
		return $response->as_error();
	}
	return rest_get_server()->response_to_data( $response, false );
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
	$keys_to_pick   = array( 'title', 'icon', 'category', 'keywords', 'supports', 'attributes' );

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
	// Enqueue basic styles built out of Gutenberg through `npm build`.
	wp_enqueue_style( 'wp-blocks' );

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
 * Returns a default color palette.
 *
 * @return array Color strings in hex format.
 *
 * @since 0.7.0
 */
function gutenberg_color_palette() {
	return array(
		'#f78da7',
		'#cf2e2e',
		'#ff6900',
		'#fcb900',
		'#7bdcb5',
		'#00d084',
		'#8ed1fc',
		'#0693e3',
		'#eee',
		'#abb8c3',
		'#313131',
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
function gutenberg_editor_scripts_and_styles( $hook ) {
	$is_demo = isset( $_GET['gutenberg-demo'] );

	wp_add_inline_script(
		'editor', 'window.wp.oldEditor = window.wp.editor;', 'after'
	);

	gutenberg_extend_wp_api_backbone_client();

	// The editor code itself.
	wp_enqueue_script(
		'wp-editor',
		gutenberg_url( 'editor/build/index.js' ),
		array( 'jquery', 'wp-api', 'wp-data', 'wp-date', 'wp-i18n', 'wp-blocks', 'wp-element', 'wp-components', 'wp-utils', 'word-count', 'editor', 'heartbeat' ),
		filemtime( gutenberg_dir_path() . 'editor/build/index.js' ),
		true // enqueue in the footer.
	);

	gutenberg_fix_jetpack_freeform_block_conflict();
	wp_localize_script( 'wp-editor', 'wpEditorL10n', array(
		'tinymce' => array(
			'baseURL'  => includes_url( 'js/tinymce' ),
			'suffix'   => SCRIPT_DEBUG ? '' : '.min',
			'settings' => apply_filters( 'tiny_mce_before_init', array(
				'plugins'          => implode( ',', array_unique( apply_filters( 'tiny_mce_plugins', array(
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
				) ) ) ),
				'toolbar1'         => implode( ',', array_merge( apply_filters( 'mce_buttons', array(
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
				), 'editor' ), array( 'kitchensink' ) ) ),
				'toolbar2'         => implode( ',', apply_filters( 'mce_buttons_2', array(
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
				), 'editor' ) ),
				'toolbar3'         => implode( ',', apply_filters( 'mce_buttons_3', array(), 'editor' ) ),
				'toolbar4'         => implode( ',', apply_filters( 'mce_buttons_4', array(), 'editor' ) ),
				'external_plugins' => apply_filters( 'mce_external_plugins', array() ),
			), 'editor' ),
		),
	) );

	// Register `wp-utils` as a dependency of `word-count` to ensure that
	// `wp-utils` doesn't clobbber `word-count`.  See WordPress/gutenberg#1569.
	$word_count_script = wp_scripts()->query( 'word-count' );
	array_push( $word_count_script->deps, 'wp-utils' );

	global $post;
	// Generate API-prepared post.
	$post_to_edit = gutenberg_get_post_to_edit( $post );
	if ( is_wp_error( $post_to_edit ) ) {
		wp_die( $post_to_edit->get_error_message() );
	}

	// Set initial title to empty string for auto draft for duration of edit.
	// Otherwise, title defaults to and displays as "Auto Draft".
	$is_new_post = 'auto-draft' === $post_to_edit['status'];
	if ( $is_new_post ) {
		$post_to_edit['title'] = array(
			'raw'      => '',
			'rendered' => apply_filters( 'the_title', '', $post->ID ),
		);
	}

	// Set initial content to apply autop on unknown blocks, preserving this
	// behavior for classic content while otherwise disabling for blocks.
	if ( ! $is_new_post && is_array( $post_to_edit['content'] ) ) {
		$post_to_edit['content']['raw'] = gutenberg_wpautop_block_content( $post_to_edit['content']['raw'] );
	}

	// Set the post type name.
	$post_type = get_post_type( $post );

	// Preload common data.
	$preload_paths = array(
		sprintf( '/wp/v2/users/me?post_type=%s&context=edit', $post_type ),
		'/wp/v2/taxonomies?context=edit',
		gutenberg_get_rest_link( $post_to_edit, 'about', 'edit' ),
	);

	$preload_data = array_reduce(
		$preload_paths,
		'gutenberg_preload_api_request',
		array()
	);

	wp_add_inline_script(
		'wp-components',
		sprintf( 'window._wpAPIDataPreload = %s', wp_json_encode( $preload_data ) ),
		'before'
	);

	// Initialize the post data.
	wp_add_inline_script(
		'wp-editor',
		'window._wpGutenbergPost = ' . wp_json_encode( $post_to_edit ) . ';'
	);

	// Prepopulate with some test content in demo.
	if ( $is_new_post && $is_demo ) {
		wp_add_inline_script(
			'wp-editor',
			file_get_contents( gutenberg_dir_path() . 'post-content.js' )
		);
	}

	// Prepare Jed locale data.
	$locale_data = gutenberg_get_jed_locale_data( 'gutenberg' );
	wp_add_inline_script(
		'wp-editor',
		'wp.i18n.setLocaleData( ' . json_encode( $locale_data ) . ' );',
		'before'
	);

	// Preload server-registered block schemas.
	wp_localize_script( 'wp-blocks', '_wpBlocks', gutenberg_prepare_blocks_for_js() );

	// Get admin url for handling meta boxes.
	$meta_box_url = admin_url( 'post.php' );
	$meta_box_url = add_query_arg( array(
		'post'           => $post_to_edit['id'],
		'action'         => 'edit',
		'classic-editor' => true,
	), $meta_box_url );
	wp_localize_script( 'wp-editor', '_wpMetaBoxUrl', $meta_box_url );

	// Initialize the editor.
	$gutenberg_theme_support = get_theme_support( 'gutenberg' );
	$align_wide              = get_theme_support( 'align-wide' );
	$color_palette           = get_theme_support( 'editor-color-palette' );

	// Backcompat for Color Palette set through `gutenberg` array.
	if ( empty( $color_palette ) ) {
		if ( ! empty( $gutenberg_theme_support[0]['colors'] ) ) {
			$color_palette = $gutenberg_theme_support[0]['colors'];
		} else {
			$color_palette = gutenberg_color_palette();
		}
	}

	if ( ! empty( $gutenberg_theme_support ) ) {
		wp_add_inline_script(
			'wp-editor',
			'console.warn( "' .
				__( 'Adding theme support using the `gutenberg` array is deprecated. See https://wordpress.org/gutenberg/handbook/extensibility/theme-support/ for details.', 'gutenberg' ) .
			'");'
		);
	}

	/**
	 * Filters the allowed block types for the editor, defaulting to true (all
	 * block types supported).
	 *
	 * @param bool|array $allowed_block_types Array of block type slugs, or
	 *                                        boolean to enable/disable all.
	 */
	$allowed_block_types = apply_filters( 'allowed_block_types', true );

	$editor_settings = array(
		'alignWide'        => $align_wide || ! empty( $gutenberg_theme_support[0]['wide-images'] ), // Backcompat. Use `align-wide` outside of `gutenberg` array.
		'colors'           => $color_palette,
		'blockTypes'       => $allowed_block_types,
		'titlePlaceholder' => apply_filters( 'enter_title_here', __( 'Add title', 'gutenberg' ), $post ),
	);

	$post_type_object = get_post_type_object( $post_to_edit['type'] );
	if ( ! empty( $post_type_object->template ) ) {
		$editor_settings['template']     = $post_type_object->template;
		$editor_settings['templateLock'] = ! empty( $post_type_object->template_lock ) ? $post_type_object->template_lock : false;
	}

	$script  = '( function() {';
	$script .= sprintf( 'var editorSettings = %s;', wp_json_encode( $editor_settings ) );
	$script .= <<<JS
		window._wpLoadGutenbergEditor = wp.api.init().then( function() {
			return wp.editor.createEditorInstance( 'editor', window._wpGutenbergPost, editorSettings );
		} );
JS;
	$script .= '} )();';
	wp_add_inline_script( 'wp-editor', $script );

	/**
	 * Scripts
	 */
	wp_enqueue_media( array(
		'post' => $post_to_edit['id'],
	) );
	wp_enqueue_editor();

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
		array( 'wp-components', 'wp-blocks', 'wp-edit-blocks' ),
		filemtime( gutenberg_dir_path() . 'editor/build/style.css' )
	);
	wp_style_add_data( 'wp-editor', 'rtl', 'replace' );

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
