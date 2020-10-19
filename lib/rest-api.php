<?php
/**
 * PHP and WordPress configuration compatibility functions for the Gutenberg
 * editor plugin changes related to REST API.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

/**
 * Handle a failing oEmbed proxy request to try embedding as a shortcode.
 *
 * @see https://core.trac.wordpress.org/ticket/45447
 *
 * @since 2.3.0
 *
 * @param  WP_HTTP_Response|WP_Error $response The REST Request response.
 * @param  WP_REST_Server            $handler  ResponseHandler instance (usually WP_REST_Server).
 * @param  WP_REST_Request           $request  Request used to generate the response.
 * @return WP_HTTP_Response|object|WP_Error    The REST Request response.
 */
function gutenberg_filter_oembed_result( $response, $handler, $request ) {
	if ( ! is_wp_error( $response ) || 'oembed_invalid_url' !== $response->get_error_code() ||
			'/oembed/1.0/proxy' !== $request->get_route() ) {
		return $response;
	}

	// Try using a classic embed instead.
	global $wp_embed;
	$html = $wp_embed->shortcode( array(), $_GET['url'] );
	if ( ! $html ) {
		return $response;
	}

	global $wp_scripts;

	// Check if any scripts were enqueued by the shortcode, and include them in
	// the response.
	$enqueued_scripts = array();
	foreach ( $wp_scripts->queue as $script ) {
		$enqueued_scripts[] = $wp_scripts->registered[ $script ]->src;
	}

	return array(
		'provider_name' => __( 'Embed Handler', 'gutenberg' ),
		'html'          => $html,
		'scripts'       => $enqueued_scripts,
	);
}
add_filter( 'rest_request_after_callbacks', 'gutenberg_filter_oembed_result', 10, 3 );

/**
 * Add fields required for site editing to the /themes endpoint.
 *
 * @todo Remove once Gutenberg's minimum required WordPress version is v5.5.
 * @see https://core.trac.wordpress.org/ticket/49906
 * @see https://core.trac.wordpress.org/changeset/47921
 *
 * @param WP_REST_Response $response The response object.
 * @param WP_Theme         $theme    Theme object used to create response.
 * @param WP_REST_Request  $request  Request object.
 */
function gutenberg_filter_rest_prepare_theme( $response, $theme, $request ) {
	$data   = $response->get_data();
	$fields = array_keys( $data );

	/**
	 * The following is basically copied from Core's WP_REST_Themes_Controller::prepare_item_for_response()
	 * (as of WP v5.5), with `rest_is_field_included()` replaced by `! in_array()`.
	 * This makes sure that we add all the fields that are missing from Core.
	 *
	 * @see https://github.com/WordPress/WordPress/blob/019bc2d244c4d536338d2c634419583e928143df/wp-includes/rest-api/endpoints/class-wp-rest-themes-controller.php#L118-L167
	 */
	if ( ! in_array( 'stylesheet', $fields, true ) ) {
		$data['stylesheet'] = $theme->get_stylesheet();
	}

	if ( ! in_array( 'template', $fields, true ) ) {
		/**
		 * Use the get_template() method, not the 'Template' header, for finding the template.
		 * The 'Template' header is only good for what was written in the style.css, while
		 * get_template() takes into account where WordPress actually located the theme and
		 * whether it is actually valid.
		 */
		$data['template'] = $theme->get_template();
	}

	$plain_field_mappings = array(
		'requires_php' => 'RequiresPHP',
		'requires_wp'  => 'RequiresWP',
		'textdomain'   => 'TextDomain',
		'version'      => 'Version',
	);

	foreach ( $plain_field_mappings as $field => $header ) {
		if ( ! in_array( $field, $fields, true ) ) {
			$data[ $field ] = $theme->get( $header );
		}
	}

	if ( ! in_array( 'screenshot', $fields, true ) ) {
		// Using $theme->get_screenshot() with no args to get absolute URL.
		$data['screenshot'] = $theme->get_screenshot() ? $theme->get_screenshot() : '';
	}

	$rich_field_mappings = array(
		'author'      => 'Author',
		'author_uri'  => 'AuthorURI',
		'description' => 'Description',
		'name'        => 'Name',
		'tags'        => 'Tags',
		'theme_uri'   => 'ThemeURI',
	);

	foreach ( $rich_field_mappings as $field => $header ) {
		if ( ! in_array( $field, $fields, true ) ) {
			$data[ $field ]['raw']      = $theme->display( $header, false, true );
			$data[ $field ]['rendered'] = $theme->display( $header );
		}
	}

	$response->set_data( $data );
	return $response;
}
add_filter( 'rest_prepare_theme', 'gutenberg_filter_rest_prepare_theme', 10, 3 );

/**
 * Registers the block directory.
 *
 * @since 6.5.0
 */
function gutenberg_register_rest_block_directory() {
	$block_directory_controller = new WP_REST_Block_Directory_Controller();
	$block_directory_controller->register_routes();
}
add_filter( 'rest_api_init', 'gutenberg_register_rest_block_directory' );

/**
 * Registers the Block types REST API routes.
 */
function gutenberg_register_block_type() {
	$block_types = new WP_REST_Block_Types_Controller();
	$block_types->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_block_type' );
/**
 * Registers the menu locations area REST API routes.
 */
function gutenberg_register_rest_menu_location() {
	$nav_menu_location = new WP_REST_Menu_Locations_Controller();
	$nav_menu_location->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_rest_menu_location' );

/**
 * Registers the menu locations area REST API routes.
 */
function gutenberg_register_rest_customizer_nonces() {
	$nav_menu_location = new WP_Rest_Customizer_Nonces();
	$nav_menu_location->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_rest_customizer_nonces' );


/**
 * Registers the Plugins REST API routes.
 */
function gutenberg_register_plugins_endpoint() {
	$plugins = new WP_REST_Plugins_Controller();
	$plugins->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_plugins_endpoint' );

/**
 * Registers the Sidebars & Widgets REST API routes.
 */
function gutenberg_register_sidebars_and_widgets_endpoint() {
	$sidebars = new WP_REST_Sidebars_Controller();
	$sidebars->register_routes();

	$widget_types = new WP_REST_Widget_Types_Controller();
	$widget_types->register_routes();
	$widgets = new WP_REST_Widgets_Controller();
	$widgets->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_sidebars_and_widgets_endpoint' );

/**
 * Registers the Batch REST API routes.
 */
function gutenberg_register_batch_endpoint() {
	$batch = new WP_REST_Batch_Controller();
	$batch->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_batch_endpoint' );

/**
 * Hook in to the nav menu item post type and enable a post type rest endpoint.
 *
 * @param array  $args Current registered post type args.
 * @param string $post_type Name of post type.
 *
 * @return array
 */
function wp_api_nav_menus_post_type_args( $args, $post_type ) {
	if ( 'nav_menu_item' === $post_type ) {
		$args['show_in_rest']          = true;
		$args['rest_base']             = 'menu-items';
		$args['rest_controller_class'] = 'WP_REST_Menu_Items_Controller';
	}

	return $args;
}
add_filter( 'register_post_type_args', 'wp_api_nav_menus_post_type_args', 10, 2 );

/**
 * Hook in to the nav_menu taxonomy and enable a taxonomy rest endpoint.
 *
 * @param array  $args Current registered taxonomy args.
 * @param string $taxonomy Name of taxonomy.
 *
 * @return array
 */
function wp_api_nav_menus_taxonomy_args( $args, $taxonomy ) {
	if ( 'nav_menu' === $taxonomy ) {
		$args['show_in_rest']          = true;
		$args['rest_base']             = 'menus';
		$args['rest_controller_class'] = 'WP_REST_Menus_Controller';
	}

	return $args;
}
add_filter( 'register_taxonomy_args', 'wp_api_nav_menus_taxonomy_args', 10, 2 );

/**
 * Shim for get_sample_permalink() to add support for auto-draft status.
 *
 * This function filters the return from get_sample_permalink() and essentially
 * re-runs the same logic minus the filters, but pretends a status of auto-save
 * is actually publish in order to return the future permalink format.
 *
 * This is a temporary fix until we can patch get_sample_permalink()
 *
 * @see https://core.trac.wordpress.org/ticket/46266
 *
 * @param array  $permalink Array containing the sample permalink with placeholder for the post name, and the post name.
 * @param int    $id        ID of the post.
 * @param string $title     Title of the post.
 * @param string $name      Slug of the post.
 * @param object $post      WP_Post object.
 *
 * @return array Array containing the sample permalink with placeholder for the post name, and the post name.
 */
function gutenberg_auto_draft_get_sample_permalink( $permalink, $id, $title, $name, $post ) {
	if ( 'auto-draft' !== $post->post_status ) {
		return $permalink;
	}
	$ptype = get_post_type_object( $post->post_type );

	$original_status = $post->post_status;
	$original_date   = $post->post_date;
	$original_name   = $post->post_name;

	// Hack: get_permalink() would return ugly permalink for drafts, so we will fake that our post is published.
	$post->post_status = 'publish';
	$post->post_name   = sanitize_title( $post->post_name ? $post->post_name : $post->post_title, $post->ID );

	// If the user wants to set a new name -- override the current one.
	// Note: if empty name is supplied -- use the title instead, see #6072.
	if ( ! is_null( $name ) ) {
		$post->post_name = sanitize_title( $name ? $name : $title, $post->ID );
	}

	$post->post_name = wp_unique_post_slug( $post->post_name, $post->ID, $post->post_status, $post->post_type, $post->post_parent );

	$post->filter = 'sample';

	$permalink = get_permalink( $post, true );

	// Replace custom post_type Token with generic pagename token for ease of use.
	$permalink = str_replace( "%$post->post_type%", '%pagename%', $permalink );

	// Handle page hierarchy.
	if ( $ptype->hierarchical ) {
		$uri = get_page_uri( $post );
		if ( $uri ) {
			$uri = untrailingslashit( $uri );
			$uri = strrev( stristr( strrev( $uri ), '/' ) );
			$uri = untrailingslashit( $uri );
		}

		if ( ! empty( $uri ) ) {
			$uri .= '/';
		}
		$permalink = str_replace( '%pagename%', "{$uri}%pagename%", $permalink );
	}

	$permalink         = array( $permalink, $post->post_name );
	$post->post_status = $original_status;
	$post->post_date   = $original_date;
	$post->post_name   = $original_name;
	unset( $post->filter );

	return $permalink;
}
add_filter( 'get_sample_permalink', 'gutenberg_auto_draft_get_sample_permalink', 10, 5 );

/**
 * Registers the image editor.
 *
 * @since 7.x.0
 */
function gutenberg_register_image_editor() {
	global $wp_version;

	// Strip '-src' from the version string. Messes up version_compare().
	$version = str_replace( '-src', '', $wp_version );

	// Only register routes for versions older than WP 5.5.
	if ( version_compare( $version, '5.5-beta', '<' ) ) {
		$image_editor = new WP_REST_Image_Editor_Controller();
		$image_editor->register_routes();
	}
}
add_filter( 'rest_api_init', 'gutenberg_register_image_editor' );

/**
 * Registers the post format search handler.
 *
 * @param string $search_handlers     Title list of current handlers.
 *
 * @return array Title updated list of handlers.
 */
function gutenberg_post_format_search_handler( $search_handlers ) {
	if ( current_theme_supports( 'post-formats' ) ) {
		$search_handlers[] = new WP_REST_Post_Format_Search_Handler();
	}

	return $search_handlers;
}
add_filter( 'wp_rest_search_handlers', 'gutenberg_post_format_search_handler', 10, 5 );

/**
 * Registers the terms search handler.
 *
 * @param string $search_handlers Title list of current handlers.
 *
 * @return array Title updated list of handlers.
 */
function gutenberg_term_search_handler( $search_handlers ) {
	$search_handlers[] = new WP_REST_Term_Search_Handler();
	return $search_handlers;
}
add_filter( 'wp_rest_search_handlers', 'gutenberg_term_search_handler', 10, 5 );
