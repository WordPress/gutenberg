<?php
/**
 * Bootstraps the new posts dashboard page.
 *
 * @package Gutenberg
 */

add_action( 'admin_menu', 'gutenberg_replace_posts_dashboard' );

/**
 * Renders the new posts dashboard page.
 */
function gutenberg_posts_dashboard() {
	wp_register_style(
		'wp-gutenberg-posts-dashboard',
		gutenberg_url( 'build/edit-site/posts.css', __FILE__ ),
		array( 'wp-components', 'wp-commands' )
	);
	wp_enqueue_style( 'wp-gutenberg-posts-dashboard' );
	wp_add_inline_script( 'wp-edit-site', 'window.wp.editSite.initializePostsDashboard( "gutenberg-posts-dashboard" );', 'after' );
	wp_enqueue_script( 'wp-edit-site' );

	echo '<div id="gutenberg-posts-dashboard"></div>';
}

/**
 * Redirects to the new posts dashboard page and adds the postType query arg.
 * TODO: there should be a better way to do this..
 */
function gutenberg_add_post_type_arg() {
    global $pagenow;
    if ( $pagenow == 'admin.php' && isset( $_GET['page'] ) && $_GET['page'] == 'gutenberg-posts-dashboard' && empty( $_GET['postType'] ) ) {
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
