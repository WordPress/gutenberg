<?php
/**
 * Visitor color scheme (dark mode) runtime.
 *
 * Front-end support for the opt-in dark color scheme data model. Themes provide
 * dark presets via `settings.color.dark` / `settings.color.darkScheme`, which are
 * emitted as CSS custom properties gated on a root `data-scheme` attribute:
 *
 *   - no attribute / `system`: follow the OS via `prefers-color-scheme`,
 *   - `light`: never apply the dark values (opt out),
 *   - `dark`: always apply the dark values.
 *
 * This file applies a visitor's stored preference before first paint, so a saved
 * choice does not flash the wrong scheme on load. The preference is persisted in
 * `localStorage` under `wp-color-scheme` (written by the color scheme toggle,
 * added in a follow-up change).
 *
 * @package gutenberg
 */

/**
 * Whether the active theme provides a dark color scheme.
 *
 * True when the merged theme.json defines inline dark presets
 * (`settings.color.dark`) or references a dark style variation
 * (`settings.color.darkScheme`).
 *
 * @return bool
 */
function gutenberg_theme_supports_color_scheme() {
	$color = gutenberg_get_global_settings( array( 'color' ) );
	return ! empty( $color['dark'] ) || ! empty( $color['darkScheme'] );
}

/**
 * Prints the pre-paint color scheme bootstrap script.
 *
 * Reads the visitor's stored `data-scheme` preference from localStorage and
 * applies it to the root element synchronously in the document head, before the
 * page paints. Only emitted on the front end when the theme supports a dark
 * scheme, so themes without dark presets are entirely unaffected.
 *
 * @return void
 */
function gutenberg_print_color_scheme_bootstrap() {
	if ( is_admin() || ! gutenberg_theme_supports_color_scheme() ) {
		return;
	}

	// Keep this tiny and dependency-free: it must run before first paint.
	$script = "(function(){try{var s=window.localStorage.getItem('wp-color-scheme');" .
		"if(s==='light'||s==='dark'||s==='system'){" .
		"document.documentElement.setAttribute('data-scheme',s);}}catch(e){}})();";

	wp_print_inline_script_tag( $script, array( 'id' => 'wp-color-scheme-bootstrap' ) );
}
// Priority 0 so the attribute is set before stylesheets are parsed/applied.
add_action( 'wp_head', 'gutenberg_print_color_scheme_bootstrap', 0 );
