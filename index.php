<?php
/**
 * Plugin Name: Gutenberg
 * Plugin URI: https://wordpress.github.io/gutenberg/
 * Description: Prototyping since 1440. Development plugin for the editor focus in core.
 * Version: 0.1.0
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
		'manage_options',
		'gutenberg',
		'the_gutenberg_project'
	);
}
add_action( 'admin_menu', 'gutenberg_menu' );

/**
 * Registers common scripts to be used as dependencies of the editor and plugins.
 *
 * @since 0.1.0
 */
function gutenberg_register_scripts() {
	$suffix = SCRIPT_DEBUG ? '' : '.min';

	// Vendor
	$react_suffix = ( SCRIPT_DEBUG ? '.development' : '.production' ) . $suffix;
	wp_register_script( 'react', 'https://unpkg.com/react@next/umd/react' . $react_suffix . '.js' );
	wp_register_script( 'react-dom', 'https://unpkg.com/react-dom@next/umd/react-dom' . $react_suffix . '.js', array( 'react' ) );
	wp_register_script( 'react-dom-server', 'https://unpkg.com/react-dom@next/umd/react-dom-server' . $react_suffix . '.js', array( 'react' ) );

	// Editor
	wp_register_script( 'tinymce-nightly', 'https://fiddle.azurewebsites.net/tinymce/nightly/tinymce.min.js' );
	wp_register_script( 'wp-i18n', plugins_url( 'i18n/build/index.js', __FILE__ ) );
	wp_register_script( 'wp-element', plugins_url( 'element/build/index.js', __FILE__ ), array( 'react', 'react-dom', 'react-dom-server' ) );
	wp_register_script( 'wp-blocks', plugins_url( 'blocks/build/index.js', __FILE__ ), array( 'wp-element', 'tinymce-nightly' ) );
	wp_register_style( 'wp-blocks', plugins_url( 'blocks/build/style.css', __FILE__ ) );
}
add_action( 'init', 'gutenberg_register_scripts' );

/**
 * Adds the filters to register additional links for the Gutenberg editor in
 * the post/page screens.
 *
 * @since 0.1.0
 */
function gutenberg_add_edit_links_filters() {
	// For hierarchical post types
	add_filter( 'page_row_actions', 'gutenberg_add_edit_links', 10, 2 );
	// For non-hierarchical post types
	add_filter( 'post_row_actions', 'gutenberg_add_edit_links', 10, 2 );
}
add_action( 'admin_init', 'gutenberg_add_edit_links_filters' );

/**
 * Registers additional links in the post/page screens to edit any post/page in
 * the Gutenberg editor.
 *
 * @since 0.1.0
 */
function gutenberg_add_edit_links( $actions, $post ) {
	$can_edit_post = current_user_can( 'edit_post', $post->ID );
	$title = _draft_or_post_title( $post->ID );

	if ( $can_edit_post && 'trash' !== $post->post_status ) {
		// Build the Gutenberg edit action.  See also:
		// WP_Posts_List_Table::handle_row_actions()
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
			array( 'gutenberg hide-if-no-js' => $gutenberg_action ),
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
					'lang'   => is_admin() ? get_user_locale() : get_locale()
				)
			)
		)
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

	// The editor code itself
	wp_enqueue_script(
		'wp-editor',
		plugins_url( 'editor/build/index.js', __FILE__ ),
		array( 'wp-i18n', 'wp-blocks', 'wp-element' ),
		false, // $ver
		true   // $in_footer
	);

	// Load an actual post if an ID is specified
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
		wp_localize_script( 'wp-editor', '_wpGutenbergPost', $post_to_edit );
	} else {
		// ...with some test content
		// TODO: replace this with error handling
		wp_add_inline_script(
			'wp-editor',
			file_get_contents( plugin_dir_path( __FILE__ ) . 'post-content.js' )
		);
	}

	// Prepare Jed locale data
	$locale_data = gutenberg_get_jed_locale_data( 'gutenberg' );
	wp_add_inline_script(
		'wp-editor',
		'wp.i18n.setLocaleData( ' . json_encode( $locale_data ) . ' );',
		'before'
	);

	// Initialize the editor
	wp_add_inline_script( 'wp-editor', 'wp.editor.createEditorInstance( \'editor\', _wpGutenbergPost );' );

	/**
	 * Styles
	 */

	wp_enqueue_style(
		'wp-editor-font',
		'https://fonts.googleapis.com/css?family=Noto+Serif:400,400i,700,700i'
	);
	wp_enqueue_style(
		'wp-editor',
		plugins_url( 'editor/build/style.css', __FILE__ ),
		array( 'wp-blocks' )
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
