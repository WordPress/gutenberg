<?php
/**
 * Plugin Name: Gutenberg
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Description: Prototyping since 1440. This is the development plugin for the new block editor in core. <strong>Meant for development, do not run on real sites.</strong>
 * Version: 0.1.0
 * Author: Gutenberg Team
 *
 * @package gutenberg
 */

/**
 * Gutenberg's Menu.
 *
 * Adds a new wp-admin menu page for the Gutenberg editor.
 *
 * @since 0.1.0
 */
function gutenberg_menu() {
	add_menu_page(
		'Gutenberg',
		'Gutenberg',
		'edit_posts',
		'gutenberg',
		'the_gutenberg_project',
		'dashicons-edit'
	);
}
add_action( 'admin_menu', 'gutenberg_menu' );

$wp_registered_blocks = array();

/**
 * Registers a block.
 *
 * @param  string $slug Block slug including namespace.
 * @param  array  $settings Block settings.

 * @return array            The block, if it has been successfully registered.
 */
function register_block_type( $slug, $settings ) {
	global $wp_registered_blocks;

	if ( ! is_string( $slug ) ) {
		$message = __( 'Block slugs must be strings.' );
		_doing_it_wrong( __FUNCTION__, $message, '0.1.0' );
		return false;
	}

	$slug_matcher = '/^[a-z0-9-]+\/[a-z0-9-]+$/';
	if ( ! preg_match( $slug_matcher, $slug ) ) {
		$message = __( 'Block slugs must contain a namespace prefix. Example: my-plugin/my-custom-block' );
		_doing_it_wrong( __FUNCTION__, $message, '0.1.0' );
		return false;
	}

	if ( isset( $wp_registered_blocks[ $slug ] ) ) {
		/* translators: 1: block slug */
		$message = sprintf( __( 'Block "%s" is already registered.' ), $slug );
		_doing_it_wrong( __FUNCTION__, $message, '0.1.0' );
		return false;
	}

	$settings['slug'] = $slug;
	$wp_registered_blocks[ $slug ] = $settings;

	return $settings;
}

/**
 * Unregisters a block.
 *
 * @param  string $slug Block slug.
 * @return array        The previous block value, if it has been
 *                        successfully unregistered; otherwise `null`.
 */
function unregister_block_type( $slug ) {
	global $wp_registered_blocks;
	if ( ! isset( $wp_registered_blocks[ $slug ] ) ) {
		/* translators: 1: block slug */
		$message = sprintf( __( 'Block "%s" is not registered.' ), $slug );
		_doing_it_wrong( __FUNCTION__, $message, '0.1.0' );
		return false;
	}
	$unregistered_block = $wp_registered_blocks[ $slug ];
	unset( $wp_registered_blocks[ $slug ] );

	return $unregistered_block;
}

/**
 * Extract the block attributes from the block's attributes string
 *
 * @since 0.1.0
 *
 * @param string $attr_string Attributes string.

 * @return array
 */
function parse_block_attributes( $attr_string ) {
	$attributes_matcher = '/([^\s]+)="([^"]+)"\s*/';
	preg_match_all( $attributes_matcher, $attr_string, $matches );
	$attributes = array();
	foreach ( $matches[1] as $index => $attribute_match ) {
		$attributes[ $attribute_match ] = $matches[2][ $index ];
	}

	return $attributes;
}

/**
 * Renders the dynamic blocks into the post content
 *
 * @since 0.1.0
 *
 * @param  string $content Post content.
 *
 * @return string          Updated post content.
 */
function do_blocks( $content ) {
	global $wp_registered_blocks;

	// Extract the blocks from the post content.
	$open_matcher = '/<!--\s*wp:([a-z](?:[a-z0-9\/]+)*)\s+((?:(?!-->).)*)-->.*?<!--\s*\/wp:\g1\s+-->/';
	preg_match_all( $open_matcher, $content, $matches, PREG_OFFSET_CAPTURE );

	$new_content = $content;
	foreach ( $matches[0] as $index => $block_match ) {
		$block_name = $matches[1][ $index ][0];
		// do nothing if the block is not registered.
		if ( ! isset( $wp_registered_blocks[ $block_name ] ) ) {
			continue;
		}

		$block_markup = $block_match[0];
		$block_position = $block_match[1];
		$block_attributes_string = $matches[2][ $index ][0];
		$block_attributes = parse_block_attributes( $block_attributes_string );

		// Call the block's render function to generate the dynamic output.
		$output = call_user_func( $wp_registered_blocks[ $block_name ]['render'], $block_attributes );

		// Replace the matched block with the dynamic output.
		$new_content = str_replace( $block_markup, $output, $new_content );
	}

	return $new_content;
}
add_filter( 'the_content', 'do_blocks', 10 ); // BEFORE do_shortcode().

/**
 * Registers common scripts to be used as dependencies of the editor and plugins.
 *
 * @since 0.1.0
 */
function gutenberg_register_scripts() {
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

	// Editor Scripts.
	wp_register_script(
		'wp-utils',
		plugins_url( 'utils/build/index.js', __FILE__ ),
		array(),
		filemtime( plugin_dir_path( __FILE__ ) . 'utils/build/index.js' )
	);
	wp_register_script(
		'wp-date',
		plugins_url( 'date/build/index.js', __FILE__ ),
		array( 'moment' ),
		filemtime( plugin_dir_path( __FILE__ ) . 'date/build/index.js' )
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
		plugins_url( 'i18n/build/index.js', __FILE__ ),
		array(),
		filemtime( plugin_dir_path( __FILE__ ) . 'i18n/build/index.js' )
	);
	wp_register_script(
		'wp-element',
		plugins_url( 'element/build/index.js', __FILE__ ),
		array( 'react', 'react-dom', 'react-dom-server' ),
		filemtime( plugin_dir_path( __FILE__ ) . 'element/build/index.js' )
	);
	wp_register_script(
		'wp-components',
		plugins_url( 'components/build/index.js', __FILE__ ),
		array( 'wp-element' ),
		filemtime( plugin_dir_path( __FILE__ ) . 'components/build/index.js' )
	);
	wp_register_script(
		'wp-blocks',
		plugins_url( 'blocks/build/index.js', __FILE__ ),
		array( 'wp-element', 'wp-components', 'wp-utils', 'tinymce-nightly', 'tinymce-nightly-lists' ),
		filemtime( plugin_dir_path( __FILE__ ) . 'blocks/build/index.js' )
	);

	// Editor Styles.
	wp_register_style(
		'wp-components',
		plugins_url( 'components/build/style.css', __FILE__ ),
		array(),
		filemtime( plugin_dir_path( __FILE__ ) . 'components/build/style.css' )
	);
	wp_register_style(
		'wp-blocks',
		plugins_url( 'blocks/build/style.css', __FILE__ ),
		array(),
		filemtime( plugin_dir_path( __FILE__ ) . 'blocks/build/style.css' )
	);
}
add_action( 'init', 'gutenberg_register_scripts' );

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
	$full_path = plugin_dir_path( __FILE__ ) . 'vendor/' . $filename;

	$needs_fetch = (
		! file_exists( $full_path ) ||
		time() - filemtime( $full_path ) >= DAY_IN_SECONDS
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
		plugins_url( 'vendor/' . $filename, __FILE__ ),
		$deps
	);
}

/**
 * Adds the filters to register additional links for the Gutenberg editor in
 * the post/page screens.
 *
 * @since 0.1.0
 */
function gutenberg_add_edit_links_filters() {
	// For hierarchical post types.
	add_filter( 'page_row_actions', 'gutenberg_add_edit_links', 10, 2 );
	// For non-hierarchical post types.
	add_filter( 'post_row_actions', 'gutenberg_add_edit_links', 10, 2 );
}
add_action( 'admin_init', 'gutenberg_add_edit_links_filters' );

/**
 * Registers additional links in the post/page screens to edit any post/page in
 * the Gutenberg editor.
 *
 * @since 0.1.0
 *
 * @param  array $actions Post actions.
 * @param  array $post    Edited post.
 *
 * @return array          Updated post actions.
 */
function gutenberg_add_edit_links( $actions, $post ) {
	$can_edit_post = current_user_can( 'edit_post', $post->ID );
	$title = _draft_or_post_title( $post->ID );

	if ( $can_edit_post && 'trash' !== $post->post_status ) {
		// Build the Gutenberg edit action. See also: WP_Posts_List_Table::handle_row_actions().
		$gutenberg_url = menu_page_url( 'gutenberg', false );
		$gutenberg_action = sprintf(
			'<a href="%s" aria-label="%s">%s</a>',
			add_query_arg( 'post_id', $post->ID, $gutenberg_url ),
			esc_attr( sprintf(
				/* translators: %s: post title */
				__( 'Edit &#8220;%s&#8221; in the Gutenberg editor', 'gutenberg' ),
				$title
			) ),
			__( 'Gutenberg', 'gutenberg' )
		);
		// Insert the Gutenberg action immediately after the Edit action.
		$edit_offset = array_search( 'edit', array_keys( $actions ), true );
		$actions = array_merge(
			array_slice( $actions, 0, $edit_offset + 1 ),
			array(
				'gutenberg hide-if-no-js' => $gutenberg_action,
			),
			array_slice( $actions, $edit_offset + 1 )
		);
	}

	return $actions;
}

/**
 * Returns Jed-formatted localization data.
 *
 * @since 0.1.0
 *
 * @param  string $domain Translation domain.
 *
 * @return array
 */
function gutenberg_get_jed_locale_data( $domain ) {
	$translations = get_translations_for_domain( $domain );

	$locale = array(
		'domain' => $domain,
		'locale_data' => array(
			$domain => array(
				'' => array(
					'domain' => $domain,
					'lang'   => is_admin() ? get_user_locale() : get_locale(),
				),
			),
		),
	);

	if ( ! empty( $translations->headers['Plural-Forms'] ) ) {
		$locale['locale_data'][ $domain ]['']['plural_forms'] = $translations->headers['Plural-Forms'];
	}

	foreach ( $translations->entries as $msgid => $entry ) {
		$locale['locale_data'][ $domain ][ $msgid ] = $entry->translations;
	}

	return $locale;
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
	if ( 'toplevel_page_gutenberg' !== $hook ) {
		return;
	}

	/**
	 * Scripts
	 */
	wp_enqueue_media();

	// The editor code itself.
	wp_enqueue_script(
		'wp-editor',
		plugins_url( 'editor/build/index.js', __FILE__ ),
		array( 'wp-api', 'wp-date', 'wp-i18n', 'wp-blocks', 'wp-element', 'wp-components', 'wp-utils' ),
		filemtime( plugin_dir_path( __FILE__ ) . 'editor/build/index.js' ),
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
	} else {
		// ...with some test content
		// TODO: replace this with error handling
		wp_add_inline_script(
			'wp-editor',
			file_get_contents( plugin_dir_path( __FILE__ ) . 'post-content.js' )
		);
	}

	// Prepare Jed locale data.
	$locale_data = gutenberg_get_jed_locale_data( 'gutenberg' );
	wp_add_inline_script(
		'wp-editor',
		'wp.i18n.setLocaleData( ' . json_encode( $locale_data ) . ' );',
		'before'
	);

	// Initialize the editor.
	wp_add_inline_script( 'wp-editor', 'wp.editor.createEditorInstance( \'editor\', _wpGutenbergPost );' );

	// Adding styles.
	wp_enqueue_style(
		'wp-editor-font',
		'https://fonts.googleapis.com/css?family=Noto+Serif:400,400i,700,700i'
	);
	wp_enqueue_style(
		'wp-editor',
		plugins_url( 'editor/build/style.css', __FILE__ ),
		array( 'wp-components', 'wp-blocks' ),
		filemtime( plugin_dir_path( __FILE__ ) . 'editor/build/style.css' )
	);
}
add_action( 'admin_enqueue_scripts', 'gutenberg_scripts_and_styles' );

/**
 * Load plugin text domain for translations.
 *
 * @since 0.1.0
 */
function gutenberg_load_plugin_textdomain() {
	load_plugin_textdomain(
		'gutenberg',
		false,
		dirname( plugin_basename( __FILE__ ) ) . '/languages/'
	);
}
add_action( 'plugins_loaded', 'gutenberg_load_plugin_textdomain' );

/**
 * Project.
 *
 * The main entry point for the Gutenberg editor. Renders the editor on the
 * wp-admin page for the plugin.
 *
 * @since 0.1.0
 */
function the_gutenberg_project() {
	?>
	<div class="gutenberg">
		<section id="editor" class="gutenberg__editor"></section>
	</div>
	<?php
}
