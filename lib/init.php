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

	if (
		gutenberg_use_widgets_block_editor() &&
		! function_exists( 'wp_use_widgets_block_editor' ) &&
		current_theme_supports( 'widgets' )
	) {
		add_theme_page(
			__( 'Widgets', 'gutenberg' ),
			__( 'Widgets', 'gutenberg' ),
			'edit_theme_options',
			'gutenberg-widgets',
			'the_gutenberg_widgets',
			2
		);
		remove_submenu_page( 'themes.php', 'widgets.php' );
	}

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
 * Modify WP admin bar.
 *
 * @param WP_Admin_Bar $wp_admin_bar Core class used to implement the Toolbar API.
 */
function modify_admin_bar( $wp_admin_bar ) {
	if (
		gutenberg_use_widgets_block_editor() &&
		! function_exists( 'wp_use_widgets_block_editor' ) &&
		$wp_admin_bar->get_node( 'widgets' ) !== null
	) {
		$wp_admin_bar->add_menu(
			array(
				'id'   => 'widgets',
				'href' => admin_url( 'themes.php?page=gutenberg-widgets' ),
			)
		);
	}
}
add_action( 'admin_bar_menu', 'modify_admin_bar', 40 );


remove_action( 'welcome_panel', 'wp_welcome_panel' );
/**
 * Modify Dashboard welcome panel.
 *
 * When widgets are merged in core this should go into `wp-admin/includes/dashboard.php`
 * and replace the widgets link in the `wp_welcome_panel` checking for the same condition,
 * because then `gutenberg_use_widgets_block_editor` will exist in core.
 */
function modify_welcome_panel() {
	ob_start();
	wp_welcome_panel();
	$welcome_panel = ob_get_clean();
	if (
		gutenberg_use_widgets_block_editor() &&
		! function_exists( 'wp_use_widgets_block_editor' )
	) {
		echo str_replace(
			admin_url( 'widgets.php' ),
			admin_url( 'themes.php?page=gutenberg-widgets' ),
			$welcome_panel
		);
	} else {
		echo $welcome_panel;
	}
}
add_action( 'welcome_panel', 'modify_welcome_panel', 40 );

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

add_theme_support( 'widgets-block-editor' );

/**
 * Enable block templates (editor mode) for themes with theme.json.
 */
function gutenberg_enable_block_templates() {
	if ( WP_Theme_JSON_Resolver_Gutenberg::theme_has_support() ) {
		add_theme_support( 'block-templates' );
	}
}

add_action( 'setup_theme', 'gutenberg_enable_block_templates' );
