<?php
/**
 * Changes to the WordPress admin bar.
 *
 * @package gutenberg
 */

/**
 * Adds the "Site Editor" link to the Toolbar.
 *
 * @since 5.9.0
 * @since 6.3.0 Added `$_wp_current_template_id` global for editing of current template directly from the admin bar.
 * @since 6.6.0 Added the canvas argument to the url.
 *
 * @global string $_wp_current_template_id
 *
 * @param WP_Admin_Bar $wp_admin_bar The WP_Admin_Bar instance.
 */
function gutenberg_admin_bar_edit_site_menu( $wp_admin_bar ) {
	global $_wp_current_template_id;

	// Don't show if a block theme is not activated.
	if ( ! wp_is_block_theme() ) {
		return;
	}

	// Don't show for users who can't edit theme options or when in the admin.
	if ( ! current_user_can( 'edit_theme_options' ) || is_admin() ) {
		return;
	}

	$wp_admin_bar->add_node(
		array(
			'id'    => 'site-editor',
			'title' => __( 'Site Editor' ),
			'href'  => add_query_arg(
				array(
					'postType' => 'wp_template',
					'postId'   => $_wp_current_template_id,
					'canvas'   => 'edit',
				),
				admin_url( 'site-editor.php' )
			),
		)
	);
}
remove_action( 'admin_bar_menu', 'wp_admin_bar_edit_site_menu', 40 );
add_action( 'admin_bar_menu', 'gutenberg_admin_bar_edit_site_menu', 41 );
