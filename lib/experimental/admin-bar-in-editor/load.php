<?php
/**
 * Admin bar in editor experiment.
 *
 * @package gutenberg
 */

/**
 * Enables the admin bar in editor experiment.
 */
function gutenberg_enable_admin_bar_in_editor_experiment() {
	$screen = get_current_screen();
	if (
		! $screen ||
		! is_admin_bar_showing() ||
		! gutenberg_is_experiment_enabled( 'gutenberg-admin-bar-in-editor' )
	) {
		return;
	}

	$is_post_editor = 'post' === $screen->base && $screen->is_block_editor();
	$is_site_editor = 'site-editor' === $screen->id;
	if ( ! $is_post_editor && ! $is_site_editor ) {
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
 * Applied on every admin page where the admin bar is shown, so that
 * pages that use wp-build (such as `font-library-wp-admin`)
 * will get the experiment treatment.
 *
 * @param string $classes Space-separated list of admin body classes.
 * @return string Filtered list of admin body classes.
 */
function gutenberg_admin_bar_in_editor_body_class( $classes ) {
	if (
		! is_admin_bar_showing() ||
		! gutenberg_is_experiment_enabled( 'gutenberg-admin-bar-in-editor' )
	) {
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

	$admin_color = get_user_option( 'admin_color' );
	if ( empty( $admin_color ) ) {
		$admin_color = 'fresh';
	}
	$admin_color_class = 'admin-color-' . sanitize_html_class( $admin_color );

	add_action(
		'admin_head-site-editor-v2',
		static function () use ( $admin_color_class ) {
			echo '<script>'
				. 'window.__experimentalAdminBarInEditor = true;'
				. 'document.addEventListener("DOMContentLoaded", function () { document.body.classList.add("has-admin-bar-in-editor", ' . wp_json_encode( $admin_color_class ) . '); });'
				. '</script>';
		}
	);

	wp_enqueue_style( 'admin-bar' );
	wp_enqueue_style( 'colors' );
}

add_action( 'site-editor-v2_init', 'gutenberg_enable_admin_bar_in_site_editor_v2' );
