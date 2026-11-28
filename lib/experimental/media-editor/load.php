<?php
/**
 * Bootstraps the Media Editor page in wp-admin.
 *
 * @package gutenberg
 */

/**
 * Registers a hidden wp-admin page for direct media editor deep links.
 */
function gutenberg_register_media_editor_admin_page() {
	// Register with an empty parent to create a hidden admin.php?page= route
	// without adding a Media submenu item for an editor that requires an ID.
	$hook_suffix = add_submenu_page(
		'',
		__( 'Edit media', 'gutenberg' ),
		__( 'Edit media', 'gutenberg' ),
		'upload_files',
		'media-editor-wp-admin',
		'gutenberg_media_editor_wp_admin_render_page'
	);

	if ( $hook_suffix ) {
		add_action( "load-$hook_suffix", 'gutenberg_media_editor_wp_admin_prepare_screen' );
	}
}

/**
 * Prepares the admin chrome before wp-admin/admin-header.php renders.
 *
 * @global string $title        The admin page title.
 * @global string $parent_file  The current top-level menu item.
 * @global string $submenu_file The current submenu item.
 */
function gutenberg_media_editor_wp_admin_prepare_screen() {
	global $title, $parent_file, $submenu_file;

	// Hidden pages do not resolve a title from a visible menu item, so set one
	// before admin-header.php formats the page title.
	$title = __( 'Edit media', 'gutenberg' );

	/*
	 * Take the page out of the hidden `''` submenu bucket it was registered in.
	 * Left in place, get_admin_page_parent() matches it there and resets
	 * $parent_file to '' — and it does so *after* the `parent_file` filter runs,
	 * so filtering cannot win. With no match it preserves a non-empty
	 * $parent_file instead.
	 *
	 * Safe at this point: `load-` fires after the capability check in admin.php,
	 * which needs the page registered, and before the menu is rendered.
	 */
	remove_submenu_page( '', 'media-editor-wp-admin' );

	// Match the classic Edit Media screen, which the media editor stands in for:
	// Media expanded and current, Library the current submenu item.
	$parent_file  = 'upload.php';
	$submenu_file = 'upload.php';
}

add_action( 'admin_menu', 'gutenberg_register_media_editor_admin_page' );

/**
 * Builds the media editor URL for an attachment.
 *
 * The router reads its internal path from the `p` query argument, so the
 * attachment id travels as `p=/media-editor/<id>` rather than as a query
 * argument of its own.
 *
 * @param int    $post_id   Attachment ID.
 * @param string $separator Argument separator. `&amp;` when the URL is
 *                          destined for HTML output, `&` otherwise.
 * @return string The media editor URL.
 */
function gutenberg_media_editor_get_url( $post_id, $separator = '&' ) {
	return admin_url(
		'admin.php?page=media-editor-wp-admin' . $separator . 'p=' . rawurlencode( '/media-editor/' . (int) $post_id )
	);
}

/**
 * Points every "edit this attachment" link at the media editor.
 *
 * Filtering here rather than redirecting means the Media Library list table,
 * the media modal's "Edit more details" and "Edit Image" links, and the admin
 * bar all navigate straight to the media editor with no redirect hop.
 *
 * @param string|null $link    The edit link, or null when the user cannot edit the post.
 * @param int         $post_id Post ID.
 * @param string      $context The link context. `display` expects an HTML-escaped separator.
 * @return string|null The filtered edit link.
 */
function gutenberg_media_editor_filter_edit_post_link( $link, $post_id, $context ) {
	// A null link means the user lacks the capability. Leave that alone.
	if ( ! $link || 'attachment' !== get_post_type( $post_id ) ) {
		return $link;
	}

	// `edit_post` is enough for the classic screen, but the media editor page
	// requires `upload_files`. A contributor can own an attachment and edit it
	// without being able to upload, so pointing them at the media editor would
	// send them to a screen they cannot open.
	if ( ! current_user_can( 'upload_files' ) ) {
		return $link;
	}

	return gutenberg_media_editor_get_url( $post_id, 'display' === $context ? '&amp;' : '&' );
}

add_filter( 'get_edit_post_link', 'gutenberg_media_editor_filter_edit_post_link', 10, 3 );

/**
 * Redirects the classic Edit Media screen to the media editor.
 *
 * The `get_edit_post_link` filter above covers links rendered by WordPress,
 * but bookmarks, hand-typed URLs, and hard-coded links still reach post.php.
 * This catches those. It deliberately bails on the failure paths so that
 * WordPress keeps rendering its own error messages instead of sending people
 * to a screen that would only fail again.
 */
function gutenberg_media_editor_redirect_classic_screen() {
	// GET renders the form. POST is the editattachment/editpost save handler,
	// which must run untouched.
	if ( ! isset( $_SERVER['REQUEST_METHOD'] ) || 'GET' !== strtoupper( sanitize_text_field( wp_unslash( $_SERVER['REQUEST_METHOD'] ) ) ) ) {
		return;
	}

	// phpcs:disable WordPress.Security.NonceVerification.Recommended -- Reading the same unauthenticated query args post.php itself reads to decide what to render.
	if ( ! isset( $_GET['action'] ) || 'edit' !== $_GET['action'] ) {
		return;
	}

	// Guard against `?post[]=1`, where an array casts to int 1 without warning.
	$post_id = isset( $_GET['post'] ) && is_scalar( $_GET['post'] ) ? (int) $_GET['post'] : 0;
	// phpcs:enable WordPress.Security.NonceVerification.Recommended

	if ( ! $post_id || 'attachment' !== get_post_type( $post_id ) ) {
		return;
	}

	// Let post.php own these: it already renders the appropriate wp_die().
	if ( ! current_user_can( 'edit_post', $post_id ) || 'trash' === get_post_status( $post_id ) ) {
		return;
	}

	// The media editor page requires `upload_files`, which `edit_post` does not
	// imply. Without this, a contributor who owns an attachment would be
	// redirected off a screen that works onto one that refuses them.
	if ( ! current_user_can( 'upload_files' ) ) {
		return;
	}

	wp_safe_redirect( gutenberg_media_editor_get_url( $post_id ) );
	exit;
}

add_action( 'load-post.php', 'gutenberg_media_editor_redirect_classic_screen' );
