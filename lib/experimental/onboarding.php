<?php
/**
 * Onboarding administration screen.
 *
 * @package WordPress
 * @subpackage Administration
 */

function is_onboarding_enabled_and_ready() {
	$gutenberg_experiments = get_option( 'gutenberg-experiments' );
	return wp_get_theme( 'emptytheme' )->exists() && $gutenberg_experiments && array_key_exists( 'gutenberg-single-theme', $gutenberg_experiments );
}

/**
 * Add an onboarding page to the dashboard menu.
 */
function add_onboarding_menu() {
	if ( is_onboarding_enabled_and_ready() ) {
		add_dashboard_page( __( 'Onboarding', 'gutenberg' ), __( 'Onboarding', 'gutenberg' ), 'edit_theme_options', 'onboarding', 'wp_render_onboading_page' );
	}
}
add_action( 'admin_menu', 'add_onboarding_menu' );


function wp_render_onboading_page() {
	/** WordPress Administration Bootstrap */
	if ( ! current_user_can( 'edit_theme_options' ) ) {
		wp_die(
			'<h1>' . __( 'You need a higher level of permission.' ) . '</h1>' .
			'<p>' . __( 'Sorry, you are not allowed to edit theme options on this site.' ) . '</p>',
			403
		);
	}

	if ( ! wp_is_block_theme() ) {
		wp_die( __( 'The theme you are currently using is not compatible with the Site Editor.' ) );
	}

	wp_add_inline_script(
		'wp-onboarding',
		'wp.domReady( function() {
			wp.onboarding.initialize( "wp-onboarding" );
		} );'
	);
	echo '<div id="wp-onboarding"></div>';
	wp_enqueue_script( 'wp-onboarding' );
	wp_enqueue_style( 'wp-onboarding' );
}

/**
 * Remove themes from WP Admin menu
 * and moves the site editor to the top level.
 */
function remove_themes_menu() {
	if ( is_onboarding_enabled_and_ready() ) {
		remove_submenu_page( 'tools.php', 'theme-editor.php' );

		add_menu_page(
			'Designer',
			'Designer',
			'edit_themes',
			'site-editor.php',
			'',
			'dashicons-welcome-widgets-menus',
			60
		);
		remove_menu_page( 'themes.php' );
	}
}
add_action( 'admin_menu', 'remove_themes_menu', 999 );

/**
 * Given a theme slug, downloads the latest release,
 * and saves its theme.json, templates, and parts to the database.
 *
 * @param string $theme_slug The slug of the theme to process.
 * @param array  $steps      The steps to process. Valid values are 'templates', 'parts', and 'theme_json'.
 *                           Defaults to templates and parts.
 *
 * @return boolean|WP_Error True on success, WP_Error on failure.
 */
function gutenberg_save_theme_to_database( $theme_slug, $steps = array( 'templates', 'parts' ) ) {
	if ( ! function_exists( 'themes_api' ) ) {
		require_once( ABSPATH . 'wp-admin/includes/theme.php' );
		require_once( ABSPATH . 'wp-admin/includes/file.php' );
	}

	/*
	 * 1. Download ZIP.
	 */
	$theme_info = themes_api(
		'theme_information',
		array(
			'slug'   => $theme_slug,
			'fields' => array(
				'downloadlink' => true,
			),
		)
	);
	if ( is_wp_error( $theme_info ) ) {
		return $theme_info;
	}

	$zip_url      = $theme_info->download_link;
	$zip_filename = download_url( $zip_url ); // This requires unlink( $zip_filename ); later.
	if ( is_wp_error( $zip_filename ) ) {
		return $zip_filename;
	}

	WP_Filesystem(); // Later unzip_file() call requires this class to be instantiated.
	$unzip_dir = get_temp_dir() . wp_generate_uuid4();
	$result    = unzip_file( $zip_filename, $unzip_dir ); // TODO: delete $unzip_dir later.
	unlink( $zip_filename );
	if ( is_wp_error( $result ) ) {
		return $result;
	}

	global $wpdb;
	/*
	 * This code tries to save data in the database (theme.json, templates, and parts) in a single transaction.
	 * If any of the steps fails, the transaction is rolled back and nothing is saved to the database.
	 *
	 * There is no need to disable autocommit mode, as per:
	 * - mysql 5.7 https://dev.mysql.com/doc/refman/5.7/en/commit.html
	 *   "To disable autocommit mode implicitly for a single series of statements, use the START TRANSACTION statement".
	 * - mariadb (unknown version) https://mariadb.com/kb/en/start-transaction/
	 *   TODO: CHECK THAT THE MARIADB VERSION 10.3 AND ABOVE MANAGES AUTOMATCALLY AUTOCOMMIT IN A TRANSACTION.
	 *   "To disable autocommit mode for a single series of statements, use the START TRANSACTION statement."
	 *
	 */
	$wpdb->query( 'START TRANSACTION' );

	/*
	 * 2. Save theme.json to database.
	 */
	if ( in_array( 'theme_json', $steps, true ) ) {
		$theme_json      = null;
		$theme_json_file = $unzip_dir . '/' . $theme_slug . '/theme.json';
		if ( ! file_exists( $theme_json_file ) ) {
			return new WP_Error( 'theme_json_not_found for the theme ' . $theme_slug . ' at ' . $unzip_dir );
		}

		// TODO: escape font-families
		$wp_get_theme    = wp_get_theme();
		$theme_json_data = wp_json_file_decode( $theme_json_file, array( 'associative' => true ) );
		if ( null === $theme_json_data ) {
			return new WP_Error( 'theme.json at ' . $theme_json_file . ' does not exists or could not be decoded.' );
		}

		$theme_json_data          = WP_Theme_JSON_Resolver_Gutenberg::translate( $theme_json_data, $wp_get_theme->get( 'TextDomain' ) );
		$theme_json               = new WP_Theme_JSON_Gutenberg( $theme_json_data, 'custom' );
		$user_cpt                 = WP_Theme_JSON_Resolver_Gutenberg::get_user_data_from_wp_global_styles( $wp_get_theme, true );
		$user_cpt['post_content'] = wp_json_encode( $theme_json->get_raw_data() );
		if ( false === $user_cpt['post_content'] ) {
			return new WP_Error( 'theme.json could not be encoded to JSON.' );
		}

		$post_id = wp_update_post( $user_cpt, true, false );
		if ( is_wp_error( $post_id ) ) {
			$wpdb->query( 'ROLLBACK' );
			return $post_id;
		}
	}

	/*
	 * 3. Save templates to the database.
	 */
	if ( in_array( 'templates', $steps, true ) ) {
		$templates_dir = $unzip_dir . '/' . $theme_slug . '/templates';
		// TODO: is there other templates directory to be checked?
		if ( ! file_exists( $templates_dir ) ) {
			$wpdb->query( 'ROLLBACK' );
			return new WP_Error( 'Templates directory not found at ' . $templates_dir );
		}

		$template_files = glob( "$templates_dir/*.html" );
		if ( false === $template_files ) {
			$wpdb->query( 'ROLLBACK' );
			return new WP_Error( 'No template files at ' . $templates_dir );
		}

		foreach ( $template_files as $template_file ) {
			$template_cpt = array(
				'post_type'    => 'wp_template',
				'post_status'  => 'publish',
				'post_title'   => basename( $template_file, '.html' ),
				'post_name'    => basename( $template_file, '.html' ),
				'post_content' => file_get_contents( $template_file ), // TODO: preprocess (translate? escape? etc.)
				'post_author'  => get_current_user_id(), // TODO: is this the right user?
				'tax_input'    => array(
					'wp_theme' => array( 'emptytheme' ), // The base theme.
				),
			);
			$result       = wp_insert_post( $template_cpt, true );
			if ( is_wp_error( $result ) ) {
				$wpdb->query( 'ROLLBACK' );
				return $result;
			}
		}
	}

	/*
	 * 4. Save parts to the database.
	 */
	if ( in_array( 'parts', $steps, true ) ) {
		$parts_dir = $unzip_dir . '/' . $theme_slug . '/parts';
		// TODO: is there other parts directory to be checked?
		if ( ! file_exists( $parts_dir ) ) {
			$wpdb->query( 'ROLLBACK' );
			return new WP_Error( 'Parts directory not found at ' . $parts_dir );
		}

		$part_files = glob( "$parts_dir/*.html" );
		if ( false === $part_files ) {
			$wpdb->query( 'ROLLBACK' );
			return new WP_Error( 'No part files at ' . $parts_dir );
		}

		foreach ( $part_files as $part_file ) {
			$part_cpt = array(
				'post_type'    => 'wp_template_part',
				'post_status'  => 'publish',
				'post_title'   => basename( $part_file, '.html' ),
				'post_name'    => basename( $part_file, '.html' ),
				'post_content' => file_get_contents( $part_file ), // TODO: preprocess (translate? escape? etc.)
				'post_author'  => get_current_user_id(), // TODO: is this the right user?
				'tax_input'    => array(
					'wp_theme'           => array( 'emptytheme' ), // The base theme.
					'template_part_area' => WP_TEMPLATE_PART_AREA_UNCATEGORIZED, // TODO: categorize.
				),
			);
			$result   = wp_insert_post( $part_cpt, true );
			if ( is_wp_error( $result ) ) {
				$wpdb->query( 'ROLLBACK' );
				return $result;
			}
		}
	}

	// TODO: STARTER CONTENT.

	$wpdb->query( 'COMMIT' );

	return true;
}
