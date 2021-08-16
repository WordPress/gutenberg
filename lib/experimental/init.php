<?php
/**
 * Init hooks.
 *
 * @package gutenberg
 */

/**
 * Site editor's Menu.
 *
 * Adds a new wp-admin menu item for the Site editor.
 *
 * @since 9.4.0
 */
function gutenberg_site_editor_menu() {
	if ( gutenberg_is_fse_theme() ) {
		add_menu_page(
			__( 'Site Editor (beta)', 'gutenberg' ),
			sprintf(
			/* translators: %s: "beta" label. */
				__( 'Site Editor %s', 'gutenberg' ),
				'<span class="awaiting-mod">' . __( 'beta', 'gutenberg' ) . '</span>'
			),
			'edit_theme_options',
			'gutenberg-edit-site',
			'gutenberg_edit_site_page',
			'dashicons-layout'
		);
	}
}
add_action( 'admin_menu', 'gutenberg_site_editor_menu', 9 );

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
