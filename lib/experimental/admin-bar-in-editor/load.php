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

/**
 * Enables the admin bar on the site-editor-v2 page.
 */
function gutenberg_enable_admin_bar_in_site_editor_v2() {
	if (
		! is_admin_bar_showing() ||
		! gutenberg_is_experiment_enabled( 'gutenberg-admin-bar-in-editor' )
	) {
		return;
	}

	add_action( 'admin_head', 'wp_admin_bar_header' );
	remove_action( 'admin_bar_menu', 'wp_admin_bar_sidebar_toggle', 0 );
	add_action( 'admin_footer-site-editor-v2', 'wp_admin_bar_render' );

	add_action(
		'admin_head-site-editor-v2',
		static function () {
			echo '<script>'
				. 'window.__experimentalAdminBarInEditor = true;'
				. 'document.addEventListener("DOMContentLoaded", function () { document.body.classList.add("has-admin-bar-in-editor"); });'
				. '</script>';
		}
	);

	wp_enqueue_style( 'admin-bar' );
}

add_action( 'site-editor-v2_init', 'gutenberg_enable_admin_bar_in_site_editor_v2' );
