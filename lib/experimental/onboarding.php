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
	$url      = "https://raw.githubusercontent.com/ellatrix/block-themes-directory/main/by-theme/${theme_slug}.json";
	$response = json_decode( wp_remote_retrieve_body( wp_remote_get( $url ) ), true );

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
		// Remove all existing wp_global_styles CPTs.
		$existing_theme_jsons = get_posts(
			array(
				'post_type'   => 'wp_global_styles',
				'numberposts' => -1,
			)
		);
		foreach ( $existing_theme_jsons as $existing_json ) {
			wp_delete_post( $existing_json->ID, true );
		}

		$wp_get_theme             = wp_get_theme();
		$theme_json_data          = $response['theme.json'];
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
		// Remove all existing wp_template CPTs.
		$existing_templates = get_posts(
			array(
				'post_type'   => 'wp_template',
				'numberposts' => -1,
			)
		);
		foreach ( $existing_templates as $existing_template ) {
			wp_delete_post( $existing_template->ID, true );
		}

		foreach ( $response['templates'] as $template ) {
			$post_content = _inject_theme_attribute_in_block_template_content_override( $template['html'] );
			if ( null === $post_content ) { // this contains a pattern
				continue;
			}
			$template_cpt = array(
				'post_type'    => 'wp_template',
				'post_status'  => 'publish',
				'post_title'   => $template['name'],
				'post_name'    => $template['name'],
				'post_content' => $post_content,
				'post_author'  => get_current_user_id(),
				'tax_input'    => array(
					'wp_theme' => array( 'emptytheme' ),
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
		// Remove all existing wp_template_part CPTs.
		$existing_parts = get_posts(
			array(
				'post_type'   => 'wp_template_part',
				'numberposts' => -1,
			)
		);
		foreach ( $existing_parts as $existing_part ) {
			wp_delete_post( $existing_part->ID, true );
		}

		$parts_meta = array();
		foreach( $response['theme.json']['templateParts'] as $item ) {
			if ( ! isset( $item['title'] ) ){
				$item['title'] = $item['name'];
			}
			$parts_meta[ $item['name'] ] = array(
				'area'  => $item['area'],
				'title' => $item['title'],
			);
		}

		foreach ( $response['parts'] as $part ) {
			$post_content = _inject_theme_attribute_in_block_template_content_override( $part['html'] );
			if ( null === $post_content ) {
				continue;
			}
			$part_cpt = array(
				'post_type'    => 'wp_template_part',
				'post_status'  => 'publish',
				'post_title'   => $parts_meta[ $part['name'] ]['title'],
				'post_name'    => $part['name'],
				'post_content' => $post_content,
				'post_author'  => get_current_user_id(),
				'tax_input'    => array(
					'wp_theme'              => array( 'emptytheme' ),
					'wp_template_part_area' => _filter_block_template_part_area( $parts_meta[ $part['name'] ]['area'] ),
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
