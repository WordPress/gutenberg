<?php
/**
 * Admin bar in editor experiment.
 *
 * @package gutenberg
 */

/**
 * Checks whether the admin bar should be shown in the editor.
 *
 * @return bool Whether the admin bar should be shown in the editor.
 */
function gutenberg_is_admin_bar_in_editor_experiment_enabled() {
	$screen = get_current_screen();
	if (
		! $screen ||
		! is_admin_bar_showing() ||
		! gutenberg_is_experiment_enabled( 'gutenberg-admin-bar-in-editor' )
	) {
		return false;
	}

	$is_post_editor = 'post' === $screen->base && $screen->is_block_editor();
	$is_site_editor = 'site-editor' === $screen->id;

	return $is_post_editor || $is_site_editor;
}

/**
 * Enqueues assets used by the admin bar in editor experiment.
 */
function gutenberg_enable_admin_bar_in_editor_experiment() {
	if ( ! gutenberg_is_admin_bar_in_editor_experiment_enabled() ) {
		return;
	}

	wp_add_inline_script(
		'wp-block-editor',
		'window.__experimentalAdminBarInEditor = true',
		'before'
	);

	$screen  = get_current_screen();
	$version = defined( 'GUTENBERG_VERSION' ) && ! SCRIPT_DEBUG
		? GUTENBERG_VERSION
		: time();

	if ( 'site-editor' === $screen->id ) {
		$handle       = 'gutenberg-admin-bar-in-editor-edit-site';
		$style_path   = 'lib/experimental/admin-bar-in-editor/edit-site.css';
		$dependencies = array( 'wp-edit-site' );
	} else {
		$handle       = 'gutenberg-admin-bar-in-editor-edit-post';
		$style_path   = 'lib/experimental/admin-bar-in-editor/edit-post.css';
		$dependencies = array( 'wp-edit-post' );
	}

	wp_enqueue_style(
		$handle,
		gutenberg_url( $style_path ),
		$dependencies,
		$version
	);
}

add_action( 'admin_enqueue_scripts', 'gutenberg_enable_admin_bar_in_editor_experiment' );
