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
 * Enables the admin bar in editor experiment.
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
}

add_action( 'admin_enqueue_scripts', 'gutenberg_enable_admin_bar_in_editor_experiment' );

/**
 * Adds a body class when the admin bar in editor experiment is enabled.
 *
 * @param string $classes Space-separated list of admin body classes.
 * @return string Filtered list of admin body classes.
 */
function gutenberg_admin_bar_in_editor_body_class( $classes ) {
	if ( ! gutenberg_is_admin_bar_in_editor_experiment_enabled() ) {
		return $classes;
	}

	return $classes . ' has-admin-bar-in-editor';
}

add_filter( 'admin_body_class', 'gutenberg_admin_bar_in_editor_body_class' );
