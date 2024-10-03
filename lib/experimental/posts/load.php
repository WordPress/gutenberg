<?php
/**
 * Bootstraps the new posts dashboard page.
 *
 * @package Gutenberg
 */

add_action( 'admin_menu', 'gutenberg_replace_posts_dashboard' );

if ( isset( $_GET['page'] ) && 'gutenberg-posts-dashboard' === $_GET['page'] ) {
	// Default to is-fullscreen-mode to avoid jumps in the UI.
	add_filter(
		'admin_body_class',
		static function ( $classes ) {
			return "$classes is-fullscreen-mode";
		}
	);
}

/**
 * Renders the new posts dashboard page.
 */
function gutenberg_posts_dashboard() {
	$block_editor_context = new WP_Block_Editor_Context( array( 'name' => 'core/edit-site' ) );
	$custom_settings      = array(
		'siteUrl'        => site_url(),
		'styles'         => get_block_editor_theme_styles(),
		'supportsLayout' => wp_theme_has_theme_json(),
	);

	$editor_settings         = get_block_editor_settings( $custom_settings, $block_editor_context );
	$active_global_styles_id = WP_Theme_JSON_Resolver_Gutenberg::get_user_global_styles_post_id();
	$active_theme            = get_stylesheet();

	$preload_paths = array(
		array( '/wp/v2/media', 'OPTIONS' ),
		'/wp/v2/types?context=view',
		'/wp/v2/global-styles/' . $active_global_styles_id . '?context=edit',
		'/wp/v2/global-styles/' . $active_global_styles_id,
		'/wp/v2/global-styles/themes/' . $active_theme,
	);
	block_editor_rest_api_preload( $preload_paths, $block_editor_context );

	// Preload server-registered block schemas.
	wp_add_inline_script(
		'wp-blocks',
		'wp.blocks.unstable__bootstrapServerSideBlockDefinitions(' . wp_json_encode( get_block_editor_server_block_settings() ) . ');'
	);

	/** This action is documented in wp-admin/edit-form-blocks.php */
	do_action( 'enqueue_block_editor_assets' );
	wp_register_style(
		'wp-gutenberg-posts-dashboard',
		gutenberg_url( 'build/edit-site/posts.css', __FILE__ ),
		array( 'wp-components', 'wp-commands', 'wp-edit-site' )
	);
	wp_enqueue_style( 'wp-gutenberg-posts-dashboard' );
	wp_add_inline_script(
		'wp-edit-site',
		sprintf(
			'wp.domReady( function() {
				wp.editSite.initializePostsDashboard( "gutenberg-posts-dashboard", %s );
			} );',
			wp_json_encode( $editor_settings )
		)
	);
	wp_enqueue_script( 'wp-edit-site' );
	wp_enqueue_media();
	echo '<div id="gutenberg-posts-dashboard"></div>';
}

/**
 * Redirects to the new posts dashboard page and adds the postType query arg.
 */
function gutenberg_add_post_type_arg() {
	global $pagenow;
	if ( 'admin.php' === $pagenow && isset( $_GET['page'] ) && 'gutenberg-posts-dashboard' === $_GET['page'] && empty( $_GET['postType'] ) ) {
		wp_redirect( admin_url( '/admin.php?page=gutenberg-posts-dashboard&postType=post' ) );
		exit;
	}
}
add_action( 'admin_init', 'gutenberg_add_post_type_arg' );

/**
 * Replaces the default posts menu item with the new posts dashboard.
 */
function gutenberg_replace_posts_dashboard() {
	$gutenberg_experiments = get_option( 'gutenberg-experiments' );
	if ( ! $gutenberg_experiments || ! array_key_exists( 'gutenberg-new-posts-dashboard', $gutenberg_experiments ) || ! $gutenberg_experiments['gutenberg-new-posts-dashboard'] ) {
		return;
	}
	$ptype_obj = get_post_type_object( 'post' );
	add_submenu_page(
		'gutenberg',
		$ptype_obj->labels->name,
		$ptype_obj->labels->name,
		'edit_posts',
		'gutenberg-posts-dashboard',
		'gutenberg_posts_dashboard'
	);
}
