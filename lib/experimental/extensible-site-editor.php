<?php
/**
 * Extensible Site Editor experiment integration.
 *
 * @package gutenberg
 */

/**
 * Redirect the Appearance > Design menu to the extensible site editor
 * when the experiment is enabled.
 *
 * @global array $submenu WordPress admin submenu array.
 */
function gutenberg_redirect_to_extensible_site_editor() {
	// Only proceed if the experiment is enabled.
	if ( ! gutenberg_is_experiment_enabled( 'gutenberg-extensible-site-editor' ) ) {
		return;
	}

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
 * Registers the hidden wp-admin page that previews a block theme.
 *
 * The page renders the homepage of the theme named by the `wp_theme_preview`
 * query parameter. Core's `wp-includes/theme-previews.php` reads that same
 * parameter on every request: it filters `stylesheet`/`template`, attaches an
 * apiFetch middleware that forwards the parameter on every REST request, and
 * prints the activation nonce on `admin_head` — so the page needs no further
 * wiring beyond carrying the parameter in its URL.
 */
function gutenberg_register_theme_preview_admin_page() {
	// Only register the page when the extensible site editor experiment is enabled.
	if ( ! gutenberg_is_experiment_enabled( 'gutenberg-extensible-site-editor' ) ) {
		return;
	}

	// The render callback is generated into `build/pages` by the build; a
	// build that predates the page cannot register it.
	if ( ! function_exists( 'gutenberg_theme_preview_wp_admin_render_page' ) ) {
		return;
	}

	// Register with an empty parent to create a hidden admin.php?page= route
	// without adding an Appearance submenu item for a screen that requires a
	// `wp_theme_preview` parameter.
	$hook_suffix = add_submenu_page(
		'',
		__( 'Theme Preview', 'gutenberg' ),
		__( 'Theme Preview', 'gutenberg' ),
		'switch_themes',
		'theme-preview-wp-admin',
		'gutenberg_theme_preview_wp_admin_render_page'
	);

	if ( $hook_suffix ) {
		add_action( "load-$hook_suffix", 'gutenberg_theme_preview_wp_admin_prepare_screen' );
	}
}
add_action( 'admin_menu', 'gutenberg_register_theme_preview_admin_page' );

/**
 * Prepares the admin chrome before wp-admin/admin-header.php renders.
 *
 * @global string $title        The admin page title.
 * @global string $parent_file  The current top-level menu item.
 * @global string $submenu_file The current submenu item.
 */
function gutenberg_theme_preview_wp_admin_prepare_screen() {
	global $title, $parent_file, $submenu_file;

	// Hidden pages do not resolve a title from a visible menu item, so set one
	// before admin-header.php formats the page title.
	$title = __( 'Theme Preview', 'gutenberg' );

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
	remove_submenu_page( '', 'theme-preview-wp-admin' );

	// The preview is reached from the themes screen; keep Appearance current.
	$parent_file  = 'themes.php';
	$submenu_file = 'themes.php';
}

/**
 * Redirects block theme previews from the site editor to the theme preview page.
 *
 * The themes screen links block theme live previews to
 * `site-editor.php?wp_theme_preview=<stylesheet>`. When the extensible site
 * editor experiment is enabled, that preview belongs to the theme preview
 * page instead of site editor v1. Without the experiment, or for users the
 * preview filters ignore, site-editor.php behaves as before.
 */
function gutenberg_redirect_theme_preview_to_theme_preview_page() {
	if ( ! gutenberg_is_experiment_enabled( 'gutenberg-extensible-site-editor' ) ) {
		return;
	}

	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Reading the same unauthenticated query arg Core's theme-previews.php reads to decide whether a preview is requested.
	$stylesheet = isset( $_GET['wp_theme_preview'] ) && is_scalar( $_GET['wp_theme_preview'] ) ? sanitize_text_field( wp_unslash( $_GET['wp_theme_preview'] ) ) : '';
	if ( '' === $stylesheet ) {
		return;
	}

	// Core only applies the preview filters for users with `switch_themes`;
	// for anyone else the site editor keeps showing the active theme, so
	// leave them there.
	if ( ! current_user_can( 'switch_themes' ) ) {
		return;
	}

	// Without the generated page there is nowhere to redirect to.
	if ( ! function_exists( 'gutenberg_theme_preview_wp_admin_render_page' ) ) {
		return;
	}

	wp_safe_redirect(
		add_query_arg(
			'wp_theme_preview',
			rawurlencode( $stylesheet ),
			admin_url( 'admin.php?page=theme-preview-wp-admin' )
		)
	);
	exit;
}
add_action( 'load-site-editor.php', 'gutenberg_redirect_theme_preview_to_theme_preview_page' );
