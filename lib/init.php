<?php
/**
 * Init hooks.
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
		'',
		'dashicons-edit'
	);

	add_submenu_page(
		'gutenberg',
		__( 'Demo', 'gutenberg' ),
		__( 'Demo', 'gutenberg' ),
		'edit_posts',
		'gutenberg'
	);

	if ( get_option( 'gutenberg-experiments' ) ) {
		if ( array_key_exists( 'gutenberg-navigation', get_option( 'gutenberg-experiments' ) ) ) {
			add_submenu_page(
				'gutenberg',
				__( 'Navigation (beta)', 'gutenberg' ),
				__( 'Navigation (beta)', 'gutenberg' ),
				'edit_theme_options',
				'gutenberg-navigation',
				'gutenberg_navigation_page'
			);
		}
	}
	if ( current_user_can( 'edit_posts' ) ) {
		add_submenu_page(
			'gutenberg',
			__( 'Support', 'gutenberg' ),
			__( 'Support', 'gutenberg' ),
			'edit_posts',
			__( 'https://wordpress.org/support/plugin/gutenberg/', 'gutenberg' )
		);
		add_submenu_page(
			'gutenberg',
			__( 'Documentation', 'gutenberg' ),
			__( 'Documentation', 'gutenberg' ),
			'edit_posts',
			'https://developer.wordpress.org/block-editor/'
		);
	}

	add_submenu_page(
		'gutenberg',
		__( 'Experiments Settings', 'gutenberg' ),
		__( 'Experiments', 'gutenberg' ),
		'edit_posts',
		'gutenberg-experiments',
		'the_gutenberg_experiments'
	);
}
add_action( 'admin_menu', 'gutenberg_menu', 9 );

/**
 * Site editor's Menu.
 *
 * Adds a new wp-admin menu item for the Site editor.
 *
 * @since 9.4.0
 */
function gutenberg_site_editor_menu() {
	if ( wp_is_block_theme() ) {
		add_theme_page(
			__( 'Editor (beta)', 'gutenberg' ),
			sprintf(
			/* translators: %s: "beta" label. */
				__( 'Editor %s', 'gutenberg' ),
				'<span class="awaiting-mod">' . __( 'beta', 'gutenberg' ) . '</span>'
			),
			'edit_theme_options',
			'gutenberg-edit-site',
			'gutenberg_edit_site_page'
		);
	}
}
add_action( 'admin_menu', 'gutenberg_site_editor_menu', 9 );

/**
 * Outputs a WP REST API nonce.
 */
function gutenberg_rest_nonce() {
	exit( wp_create_nonce( 'wp_rest' ) );
}
add_action( 'wp_ajax_gutenberg_rest_nonce', 'gutenberg_rest_nonce' );


/**
 * Exposes the site icon url to the Gutenberg editor through the WordPress REST
 * API. The site icon url should instead be fetched from the wp/v2/settings
 * endpoint when https://github.com/WordPress/gutenberg/pull/19967 is complete.
 *
 * @since 8.2.1
 *
 * @param WP_REST_Response $response Response data served by the WordPress REST index endpoint.
 * @return WP_REST_Response
 */
function register_site_icon_url( $response ) {
	$data                  = $response->data;
	$data['site_icon_url'] = get_site_icon_url();
	$response->set_data( $data );
	return $response;
}

add_filter( 'rest_index', 'register_site_icon_url' );

/**
 * Exposes the site logo to the Gutenberg editor through the WordPress REST
 * API. This is used for fetching this information when user has no rights
 * to update settings.
 *
 * @since 10.9
 *
 * @param WP_REST_Response $response Response data served by the WordPress REST index endpoint.
 * @return WP_REST_Response
 */
function register_site_logo_to_rest_index( $response ) {
	$site_logo_id                = get_theme_mod( 'custom_logo' );
	$response->data['site_logo'] = $site_logo_id;
	if ( $site_logo_id ) {
		$response->add_link(
			'https://api.w.org/featuredmedia',
			rest_url( 'wp/v2/media/' . $site_logo_id ),
			array(
				'embeddable' => true,
			)
		);
	}
	return $response;
}

add_filter( 'rest_index', 'register_site_logo_to_rest_index' );

/**
 * Optimizes the preload paths registered in Core (`edit-form-blocks.php`).
 *
 * @param array $preload_paths Preload paths to be filtered.
 * @return array
 */
function optimize_preload_paths( $preload_paths ) {
	// remove preload of the `/` route.
	$root_index = array_search( '/', $preload_paths, true );
	if ( false !== $root_index ) {
		array_splice( $preload_paths, $root_index, 1 );
	}

	// change `/types` context from `edit` to `view` (requested in `loadPostTypeEntities`).
	$types_index = array_search( '/wp/v2/types?context=edit', $preload_paths, true );
	if ( false !== $types_index ) {
		$preload_paths[$types_index] = '/wp/v2/types?context=view';
	}

	// start preloading `/taxonomies` in `view` context (requested in `loadTaxonomyEntities`).
	$tax_index = array_search( '/wp/v2/taxonomies?per_page=-1&context=edit', $preload_paths, true );
	if ( false === $tax_index ) {
		array_push( $preload_paths, '/wp/v2/taxonomies?context=view' );
	} else {
		$preload_paths[$tax_index] = '/wp/v2/taxonomies?context=view';
	}

	// start preloading `/settings`.
	$settings_index = array_search( '/wp/v2/settings', $preload_paths, true );
	if ( false === $settings_index ) {
		array_push( $preload_paths, '/wp/v2/settings' );
	}

	// modify the preload of `/users/me` to match the real request.
	foreach ( $preload_paths as $user_index => $user_path ) {
		if ( 0 === strpos( $user_path, '/wp/v2/users/me' ) ) {
			$preload_paths[$user_index] = '/wp/v2/users/me';
			break;
		}
	}

	return $preload_paths;
}

add_filter( 'block_editor_rest_api_preload_paths', 'optimize_preload_paths' );
