<?php
/**
 * Admin design tokens: loader and cascade layer setup.
 *
 * Styles wp-admin from WordPress Design System tokens, so every admin screen
 * reads as one product regardless of how it is rendered. Gated by the
 * `gutenberg-wpds-admin-restyle` experiment; when it is off this file is never
 * loaded and nothing changes.
 *
 * MECHANISM — cascade layers, no dependency surgery.
 *
 * Layered CSS *loses* to unlayered CSS, so simply shipping our styles inside
 * `@layer wpds` would be outranked by Core's unlayered admin CSS. Rather than
 * dequeue Core's stylesheets and rewire the dependency graph (which is what the
 * earlier POC did, and where its cost and its escaped bugs lived), we rewrite
 * the `<link>` tag for an explicit allowlist of Core handles into an
 * `@import ... layer(wp-legacy)`. The handle stays registered and enqueued, the
 * dependency graph is untouched, and Core's rules land in a layer below ours.
 *
 * Consequences, all verified by rendering rather than by reading CSS:
 *  - our styles beat Core's, regardless of selector specificity;
 *  - unlayered third-party plugin CSS still beats ours, which preserves the
 *    override the ecosystem has always relied on;
 *  - EXCEPT for `!important`, where layer priority reverses and a layered
 *    `!important` would beat a plugin's unlayered one. Hence the hard no-
 *    `!important` rule in the stylesheets, enforced by stylelint.
 *
 * This is prototype-grade. `@import` is render-blocking and costs a round trip
 * per demoted sheet. The permanent form is for Core to wrap its own admin CSS
 * in `@layer`, at which point this whole demotion step is deleted and the
 * stylesheets are unchanged. Tracked as a Core to-do.
 *
 * @package gutenberg
 */

/**
 * Disables admin style concatenation while the experiment is on.
 *
 * By default wp-admin bundles its stylesheets into a single `load-styles.php`
 * request, and `WP_Styles::do_item()` short-circuits before the
 * `style_loader_tag` filter when it is concatenating. `buttons` therefore never
 * gets its own `<link>` and cannot be demoted into a layer.
 *
 * Setting this global is the documented plugin-facing way to opt out (see the
 * file header of Core's script-loader.php). The cost is more requests on admin
 * screens, which is acceptable for an off-by-default experiment.
 *
 * NOTE: this is scaffolding, and it is a second reason the permanent fix
 * belongs in Core. Once Core wraps its own admin CSS in `@layer`, both this and
 * the demotion filter below are deleted, concatenation stays on, and the
 * stylesheets are unchanged.
 *
 * An alternative was considered and rejected: demoting the entire
 * `load-styles.php` bundle in one go. That would put *all* of Core's admin CSS
 * below unlayered plugin CSS, so plugin rules that currently lose on
 * specificity or source order would suddenly win. That is a large and silent
 * behaviour change for the ecosystem, and the opposite of the small, explicit
 * blast radius this experiment is built around.
 *
 * @since 23.9.0
 *
 * @global bool $concatenate_scripts
 */
function gutenberg_wpds_admin_disable_concatenation() {
	// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
	$GLOBALS['concatenate_scripts'] = false;
}
add_action( 'admin_init', 'gutenberg_wpds_admin_disable_concatenation' );

/**
 * Declares the layer order.
 *
 * Layer order is fixed by FIRST APPEARANCE in the document, not by the load
 * order of the stylesheets themselves. Rather than reason about hook priority,
 * every style element this experiment emits — the demoted imports and our own
 * stylesheets alike — repeats this same declaration. They all agree, so
 * whichever lands first sets the order correctly.
 *
 * @since 23.9.0
 */
const GUTENBERG_WPDS_ADMIN_LAYER_ORDER = '@layer wpds-overrides, wp-legacy, wpds;';

/**
 * Core style handles to demote into the `wp-legacy` layer.
 *
 * Deliberately an explicit allowlist rather than a blanket rewrite: the blast
 * radius is exactly what is named here, and it grows one control at a time.
 *
 * The set must be CONSISTENT, not minimal. Core's stylesheets override each
 * other by source order — most visibly, the active admin colour scheme
 * (`colors`) restyles the chrome defined in `admin-menu`, `common`, `forms` and
 * the rest. Demoting only some of them inverts those relationships: demoting
 * `colors` alone put the modern scheme's `#adminmenuback { background: #1e1e1e }`
 * below the unlayered `admin-menu.css` default of `#1d2327`, silently reverting
 * the admin colour scheme to legacy colours. So the whole Core admin set moves
 * together, preserving their existing order relative to one another.
 *
 * DELIBERATELY EXCLUDED: Gutenberg's own package styles, above all
 * `wp-base-styles`. Gutenberg points that handle at its own build, and it is
 * what defines `--wp-admin-theme-color` per scheme via `body.admin-color-*`
 * (specificity 0,2,0). Other Gutenberg package styles define the same custom
 * property unlayered on `:root` (0,1,0). Demote `wp-base-styles` and those
 * unlayered `:root` definitions win, taking the accent colour with them. It
 * stays unlayered, and it does not need demoting — those styles are already
 * design-system aligned.
 *
 * ALSO EXCLUDED: `media`. Demotion turns a `<link>` into an `@import`, which the
 * browser fetches only after it has parsed the importing element, so the
 * stylesheet lands later than a link would. The media grid measures its frame in
 * JavaScript as the page initialises, and with `media-views.css` still in flight
 * it measures an unstyled frame, computes a collapsed height and never
 * recalculates: upload.php?mode=grid renders as an empty strip. Verified by
 * removing this one handle. Any screen that sizes itself from measured CSS is
 * exposed the same way, which is one more thing that only Core owning its own
 * layers can fix. The cost of leaving it out is that `media-views.css` outranks
 * the demoted colour scheme's media rules; a wrongly-coloured modal is a better
 * failure than an unusable Media Library.
 *
 * Trade-off worth naming: everything listed here now sits below unlayered
 * plugin CSS. Plugin rules that currently lose to Core on specificity or source
 * order will start winning. That is a real behaviour change for the ecosystem
 * and the main thing this experiment needs to prove is safe.
 *
 * @since 23.9.0
 *
 * @return string[] Array of registered style handles.
 */
function gutenberg_wpds_admin_demoted_handles() {
	return array(
		// Controls and chrome.
		'buttons',
		'common',
		'forms',
		'admin-menu',
		'admin-bar',
		'list-tables',
		'edit',
		'dashboard',
		'revisions',
		'themes',
		'about',
		'nav-menus',
		'widgets',
		'site-icon',
		'l10n',
		'wp-tooltip',
		'dashicons',
		// The active admin colour scheme. Must move with everything above.
		'colors',
	);
}

/**
 * Escapes a URL for use inside a CSS string in an inline `<style>` element.
 *
 * `esc_url()` is wrong here: it encodes `&` as `&#038;`, and CSS does not
 * decode HTML entities, so a URL carrying `&ver=` would break. Use the raw
 * escaper and then guard the CSS string context and the containing element.
 *
 * @since 23.9.0
 *
 * @param string $href URL to escape.
 * @return string Escaped URL, safe inside a double-quoted CSS string.
 */
function gutenberg_wpds_admin_escape_css_url( $href ) {
	return str_replace(
		array( '\\', '"', '<' ),
		array( '\\\\', '\\"', '\\3c ' ),
		esc_url_raw( $href )
	);
}

/**
 * Rewrites an allowlisted Core stylesheet link into a layered `@import`.
 *
 * Fires for the RTL variant as a second call with the same handle, so both
 * directions are demoted without any extra handling.
 *
 * @since 23.9.0
 *
 * @param string $tag    The `<link>` tag for the enqueued style.
 * @param string $handle The style's registered handle.
 * @param string $href   The stylesheet URL.
 * @param string $media  The stylesheet's media attribute.
 * @return string The original tag, or an inline style element importing it into a layer.
 */
function gutenberg_wpds_admin_demote_style( $tag, $handle, $href, $media ) {
	if ( ! is_admin() ) {
		return $tag;
	}

	if ( ! in_array( $handle, gutenberg_wpds_admin_demoted_handles(), true ) ) {
		return $tag;
	}

	if ( empty( $href ) ) {
		return $tag;
	}

	// Media list goes after layer() in the @import prelude. 'all' is the default.
	$media_suffix = ( $media && 'all' !== $media ) ? ' ' . $media : '';

	return sprintf(
		"<style id=\"%s-css\" data-wpds-demoted=\"1\">%s\n@import url(\"%s\") layer(wp-legacy)%s;</style>\n",
		esc_attr( $handle ),
		GUTENBERG_WPDS_ADMIN_LAYER_ORDER,
		gutenberg_wpds_admin_escape_css_url( $href ),
		$media_suffix
	);
}
add_filter( 'style_loader_tag', 'gutenberg_wpds_admin_demote_style', 10, 4 );

/**
 * Enqueues design tokens and the restyle stylesheets on classic admin screens.
 *
 * `admin_enqueue_scripts` only fires in wp-admin, so this never touches the
 * login screen or the front end — both of which also use the `buttons` handle.
 *
 * @since 23.9.0
 */
function gutenberg_wpds_admin_enqueue_styles() {
	$version  = defined( 'GUTENBERG_VERSION' ) && ! SCRIPT_DEBUG ? GUTENBERG_VERSION : time();
	$base_url = gutenberg_url( 'lib/experimental/wpds-admin/css/' );

	/*
	 * Make `--wpds-*` resolvable in classic admin. Gutenberg registers the
	 * `wp-theme` handle itself (see lib/client-assets.php), so no Core change
	 * is needed here. Fall back to the package's prebuilt copy if that ever
	 * stops being true.
	 */
	if ( wp_style_is( 'wp-theme', 'registered' ) ) {
		wp_enqueue_style( 'wp-theme' );
		$token_deps = array( 'wp-theme' );
	} else {
		wp_enqueue_style(
			'gutenberg-wpds-admin-tokens',
			gutenberg_url( 'packages/theme/prebuilt/css/design-tokens.css' ),
			array(),
			$version
		);
		$token_deps = array( 'gutenberg-wpds-admin-tokens' );
	}

	/*
	 * Stylesheets load in filename order, which is what the numeric prefixes are
	 * for. Each area of the restyle owns one file and registers itself by being
	 * present, so adding one is a single new file and no edit here.
	 *
	 * The first sheet depends on `buttons` so ours prints after the demoted Core
	 * sheet and the generated HTML reads in order; the cascade itself no longer
	 * relies on that, since layer order decides. Each subsequent sheet depends on
	 * the one before it to keep that document order.
	 */
	$files = glob( __DIR__ . '/css/*.css' );

	if ( empty( $files ) ) {
		return;
	}

	sort( $files );

	$previous = null;

	foreach ( $files as $file ) {
		$name   = basename( $file, '.css' );
		$handle = 'gutenberg-wpds-admin-' . $name;

		wp_enqueue_style(
			$handle,
			$base_url . basename( $file ),
			null === $previous ? array_merge( $token_deps, array( 'buttons' ) ) : array( $previous ),
			$version
		);

		$previous = $handle;
	}
}
add_action( 'admin_enqueue_scripts', 'gutenberg_wpds_admin_enqueue_styles' );

require_once __DIR__ . '/harness.php';
