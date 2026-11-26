<?php
/**
 * Extensible Site Editor experiment integration.
 *
 * Only loaded while the `gutenberg-extensible-site-editor` experiment is
 * enabled (see lib/load.php).
 *
 * @package gutenberg
 */

/**
 * Redirect the Appearance > Design menu to the extensible site editor.
 *
 * @global array $submenu WordPress admin submenu array.
 */
function gutenberg_redirect_to_extensible_site_editor() {
	// Update the Design submenu item to point to the extensible site editor.
	global $submenu;
	if ( $submenu && isset( $submenu['themes.php'] ) ) {
		foreach ( $submenu['themes.php'] as $key => $item ) {
			// Find the Design/site-editor menu item and update its URL.
			if ( isset( $item[2] ) && 'site-editor.php' === $item[2] ) {
				$submenu['themes.php'][ $key ][2] = 'admin.php?page=site-editor-v2';
				break;
			}
		}
	}
}
add_action( 'admin_menu', 'gutenberg_redirect_to_extensible_site_editor', 100 );

/**
 * Unregisters the "View revisions" action of every post type, so the lists of
 * the extensible site editor do not show it.
 *
 * The registry is the same for every screen, so the lists of the site editor
 * and of the other screens lose it too while the experiment is enabled.
 *
 * Hooked at the default priority, after the core actions are registered, see
 * register_core_entity_actions().
 */
function gutenberg_unregister_view_post_revisions_entity_action() {
	foreach ( get_post_types( array( 'show_in_rest' => true ) ) as $post_type ) {
		wp_unregister_entity_actions( 'postType', $post_type, array( 'view-post-revisions' ) );
	}
}
add_action( 'wp_entity_actions_api_init', 'gutenberg_unregister_view_post_revisions_entity_action' );

/**
 * Prints what a page previewed in the extensible site editor shows, so that the
 * editor can open it for editing: the post a singular page shows, and the block
 * template the page was rendered with.
 *
 * Only printed for the site editor's preview (the `wp_site_preview` query
 * argument), on block themes, and for users who can edit the site's templates.
 * The post is only included when the user can edit it.
 *
 * @global string $_wp_current_template_id The ID of the block template the page was rendered with.
 */
function gutenberg_print_site_preview_context() {
	global $_wp_current_template_id;

	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only flag, no data is changed.
	if ( empty( $_GET['wp_site_preview'] ) || ! wp_is_block_theme() || ! current_user_can( 'edit_theme_options' ) ) {
		return;
	}

	$context = array();

	if ( is_string( $_wp_current_template_id ) && '' !== $_wp_current_template_id ) {
		$context['templateId'] = $_wp_current_template_id;
	}

	if ( is_singular() ) {
		$post             = get_queried_object();
		$post_type_object = $post instanceof WP_Post ? get_post_type_object( $post->post_type ) : null;

		if ( $post_type_object && $post_type_object->show_in_rest && current_user_can( 'edit_post', $post->ID ) ) {
			$context['postType'] = $post->post_type;
			$context['postId']   = $post->ID;
		}
	}

	wp_print_inline_script_tag(
		wp_json_encode( (object) $context, JSON_HEX_TAG | JSON_HEX_AMP | JSON_UNESCAPED_SLASHES ),
		array(
			'type' => 'application/json',
			'id'   => 'wp-site-preview-context',
		)
	);
}
add_action( 'wp_head', 'gutenberg_print_site_preview_context' );
