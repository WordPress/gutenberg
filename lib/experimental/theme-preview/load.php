<?php
/**
 * Bootstraps the block theme preview page in wp-admin.
 *
 * Part of the extensible site editor experiment: only loaded while the
 * `gutenberg-extensible-site-editor` experiment is enabled (see lib/load.php).
 *
 * @package gutenberg
 */

/**
 * Builds the theme preview page URL for a theme.
 *
 * The page previews the theme named by the `wp_theme_preview` query
 * parameter. Core's `wp-includes/theme-previews.php` reads that parameter on
 * every request: it filters `stylesheet`/`template` (for users with
 * `switch_themes`), attaches an apiFetch middleware that forwards the
 * parameter on every REST request, and prints the activation nonce on
 * `admin_head` — so the page needs no further wiring beyond carrying the
 * parameter in its URL.
 *
 * @param string $stylesheet Stylesheet (directory name) of the theme to preview.
 * @return string Theme preview page URL, not escaped for output.
 */
function gutenberg_get_theme_preview_url( $stylesheet ) {
	static $base = null;
	if ( null === $base ) {
		// The page renders the styles route, registered at `/styles`.
		$base = admin_url( 'admin.php?page=theme-preview-wp-admin&p=%2Fstyles' );
	}

	return add_query_arg(
		'wp_theme_preview',
		// `add_query_arg` does not encode new values, so encode subdirectory
		// theme stylesheets like `parent/child` here.
		rawurlencode( $stylesheet ),
		$base
	);
}

/**
 * Registers the hidden wp-admin page that previews a block theme.
 */
function gutenberg_register_theme_preview_admin_page() {
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
 * Points the themes screen's block theme live preview links at the theme
 * preview page.
 *
 * Core builds those links as `site-editor.php?wp_theme_preview=<stylesheet>`;
 * rewriting them here saves the round trip through site-editor.php that the
 * redirect below would otherwise take. The active theme's entry is left
 * alone: it carries no `wp_theme_preview` parameter and links to the site
 * editor as a customize action.
 *
 * @param array $prepared_themes Themes prepared for the themes screen.
 * @return array Themes with rewritten live preview links.
 */
function gutenberg_use_theme_preview_page_for_live_preview_links( $prepared_themes ) {
	if ( ! current_user_can( 'switch_themes' ) ) {
		return $prepared_themes;
	}

	$current_stylesheet = get_stylesheet();
	foreach ( $prepared_themes as $stylesheet => $theme_data ) {
		if (
			$stylesheet === $current_stylesheet
			|| empty( $theme_data['blockTheme'] )
			|| empty( $theme_data['actions']['customize'] )
		) {
			continue;
		}
		$prepared_themes[ $stylesheet ]['actions']['customize'] = esc_url( gutenberg_get_theme_preview_url( $stylesheet ) );
	}

	return $prepared_themes;
}

/**
 * Redirects block theme previews from the site editor to the theme preview page.
 *
 * The links the filter above rewrites no longer reach site-editor.php; this
 * catches the remaining entry points — bookmarks, hand-typed URLs, and the
 * live preview link the theme installer renders after installing a theme.
 * For users the preview filters ignore, site-editor.php behaves as before.
 */
function gutenberg_redirect_theme_preview_to_theme_preview_page() {
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Reading the same unauthenticated query arg Core's theme-previews.php reads to decide whether a preview is requested.
	$stylesheet = isset( $_GET['wp_theme_preview'] ) ? sanitize_text_field( wp_unslash( $_GET['wp_theme_preview'] ) ) : '';
	if ( '' === $stylesheet ) {
		return;
	}

	// Core ignores the preview for users without `switch_themes`; leave them
	// on the site editor, which keeps showing the active theme.
	if ( ! current_user_can( 'switch_themes' ) ) {
		return;
	}

	wp_safe_redirect( gutenberg_get_theme_preview_url( $stylesheet ) );
	exit;
}

// The render callback is generated into `build/pages`, which lib/load.php
// requires before this file: a build that predates the page has nothing to
// register, link, or redirect to.
if ( function_exists( 'gutenberg_theme_preview_wp_admin_render_page' ) ) {
	add_action( 'admin_menu', 'gutenberg_register_theme_preview_admin_page' );
	add_filter( 'wp_prepare_themes_for_js', 'gutenberg_use_theme_preview_page_for_live_preview_links' );
	add_action( 'load-site-editor.php', 'gutenberg_redirect_theme_preview_to_theme_preview_page' );
}
