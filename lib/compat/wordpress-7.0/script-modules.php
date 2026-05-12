<?php
/**
 * Script Modules API: Polyfill for script module translations.
 *
 * Provides translation support for script modules on WordPress versions
 * that do not yet include this functionality in Core.
 *
 * @package gutenberg
 * @since X.X.X
 */

/**
 * Gets the raw source URL for a registered script module.
 *
 * Uses WP_Script_Modules::get_registered() if available (WP 7.0+),
 * otherwise falls back to reflection to access the private registered array.
 *
 * @since X.X.X
 *
 * @param string $id The script module identifier.
 * @return string|null The script module source URL, or null if not registered.
 */
function gutenberg_get_script_module_src( string $id ): ?string {
	$script_modules = wp_script_modules();

	if ( method_exists( $script_modules, 'get_registered' ) ) {
		$module = $script_modules->get_registered( $id );
		return null === $module ? null : ( $module['src'] ?? null );
	}

	// Fallback for WP versions without get_registered().
	$reflection = new ReflectionClass( $script_modules );
	$prop       = $reflection->getProperty( 'registered' );
	if ( PHP_VERSION_ID < 80100 ) {
		$prop->setAccessible( true );
	}
	$registered = $prop->getValue( $script_modules );

	return $registered[ $id ]['src'] ?? null;
}

/**
 * Prints translations for all enqueued script modules.
 *
 * Auto-detects the text domain for each enqueued module from its source URL.
 *
 * @since X.X.X
 */
function gutenberg_print_script_module_translations() {
	$script_modules = wp_script_modules();
	$queue          = $script_modules->get_queue();
	if ( empty( $queue ) ) {
		return;
	}

	// Collect enqueued modules and their static/dynamic dependencies.
	$module_ids = array();
	$reflection = new ReflectionClass( $script_modules );
	if ( $reflection->hasMethod( 'get_sorted_dependencies' ) ) {
		$method = $reflection->getMethod( 'get_sorted_dependencies' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}
		$module_ids = $method->invoke( $script_modules, $queue );
	} else {
		$module_ids = $queue;
	}

	$set_locale_data_js_function = <<<'JS'
	( domain, translations ) => {
		const localeData = translations.locale_data[ domain ] || translations.locale_data.messages;
		localeData[""].domain = domain;
		wp.i18n.setLocaleData( localeData, domain );
	}
	JS;

	foreach ( $module_ids as $id ) {
		$json_translations = load_script_module_textdomain( $id );
		if ( ! $json_translations ) {
			continue;
		}

		$output     = sprintf(
			'( %s )( %s, %s );',
			$set_locale_data_js_function,
			wp_json_encode( 'default' ),
			$json_translations
		);
		$source_url = rawurlencode( "wp-script-module-translation-data-{$id}" );
		$output    .= "\n//# sourceURL={$source_url}";

		// Ensure wp-i18n is printed; the inline script below relies on wp.i18n.setLocaleData().
		if ( ! wp_script_is( 'wp-i18n', 'done' ) ) {
			wp_scripts()->do_items( array( 'wp-i18n' ) );
		}

		wp_print_inline_script_tag( $output, array( 'id' => "wp-script-module-translation-data-{$id}" ) );
	}
}

// Print translations after classic scripts are loaded (priority 10) but before modules execute.
add_action( 'wp_footer', 'gutenberg_print_script_module_translations', 21 );
add_action( 'admin_print_footer_scripts', 'gutenberg_print_script_module_translations', 11 );

/**
 * Prints the Script Modules import map as early as possible in the admin <head>.
 *
 * Firefox 150 (with the default `dom.multiple_import_maps.enabled = false`) and
 * any other browser without multi-import-map support honor only the first
 * `<script type="importmap">` that appears before a module load or preload has
 * started. If a third-party plugin emits a `<script type="module">` in <head>
 * before WordPress prints its import map in the footer, every subsequent
 * `@wordpress/*` bare-specifier import fails to resolve and Gutenberg-rendered
 * admin pages never boot. See https://github.com/WordPress/gutenberg/issues/78041
 * and Core Trac #65165.
 *
 * To survive an early plugin module script we hoist the WP import map to the
 * top of <head> on both `admin_print_scripts` (the standard wp-admin path used
 * by edit.php, Font Library, Connectors, etc.) and `wp_print_scripts` (the
 * head-script hook fired by the wp-build full-page `page.php.template`, which
 * does not fire `admin_print_scripts` in its own <head>). Both registrations
 * are load-bearing, not defensive: each hook is the only one fired in <head>
 * by the corresponding rendering path.
 *
 * The function is idempotent via $GLOBALS['gutenberg_import_map_printed'] so
 * the map is emitted exactly once per page even if both hooks fire. A paired
 * suppress callback (gutenberg_suppress_duplicate_import_map) removes Core's
 * later admin_print_footer_scripts print so the footer does not re-emit the
 * same map.
 *
 * This is an internal Gutenberg compat helper, not public API (R6 in the
 * pipeline spec). It is admin-scoped (`is_admin()`) so the front-end remains
 * out of scope; Core's existing wp_head / wp_footer print on the front end is
 * unaffected. Callers must register their modules no later than the
 * `admin_enqueue_scripts` action; both head hooks fire after
 * `admin_enqueue_scripts`, so the queue is complete at print time.
 *
 * Remove this compat layer when Trac #65165 lands a Core-side fix that
 * prints the map in <head> by default.
 *
 * @since X.X.X
 */
function gutenberg_print_import_map_early() {
	// Front-end stays out of scope; Core's wp_head / wp_footer print on the
	// front end is the only path that should emit the map there.
	if ( ! is_admin() ) {
		return;
	}

	if ( ! empty( $GLOBALS['gutenberg_import_map_printed'] ) ) {
		return;
	}

	$GLOBALS['gutenberg_import_map_printed'] = true;
	wp_script_modules()->print_import_map();
}

/**
 * Suppresses Core's late `print_import_map` registration once the map has been
 * hoisted into <head> by gutenberg_print_import_map_early().
 *
 * Registered at priority 9 on `admin_print_footer_scripts` so it runs before
 * Core's default-priority (10) `print_import_map` callback. When the early
 * helper has already emitted the map (flag set on $GLOBALS), this removes the
 * callback from the action so it does not double-print. Translations,
 * preloads, enqueued modules, and module data registrations are left alone.
 *
 * The remove_action() callback identity matches the singleton wp_script_modules()
 * Core registers against in WP_Script_Modules::add_hooks() (default priority
 * 10), so the removal succeeds without reflection. If a future Core change
 * re-instantiates the singleton or moves the print site, the paired PHPUnit
 * test fails loudly.
 *
 * Limitation: third-party callers that invoke `wp_script_modules()->print_import_map()`
 * directly (rather than through gutenberg_print_import_map_early()) bypass
 * this suppress because the global flag is not set on their behalf. The
 * idempotency contract documented on gutenberg_print_import_map_early()
 * keeps the supported path (wp-admin head + wp-build page template) clean.
 *
 * Internal Gutenberg compat helper, not public API. Removable when Trac #65165
 * lands a Core fix.
 *
 * @since X.X.X
 */
function gutenberg_suppress_duplicate_import_map() {
	if ( empty( $GLOBALS['gutenberg_import_map_printed'] ) ) {
		return;
	}

	remove_action(
		'admin_print_footer_scripts',
		array( wp_script_modules(), 'print_import_map' )
	);
}

// Hoist the import map into <head> on both head hooks. Both registrations are
// load-bearing: admin_print_scripts is the only head hook fired by the
// standard wp-admin path (edit.php, Font Library, Connectors), and
// wp_print_scripts is the only head hook fired by the wp-build full-page
// template (packages/wp-build/templates/page.php.template). Priority is
// PHP_INT_MIN so the map prints before any reasonable third-party emitter
// (PWA's wp_print_service_workers() runs at default priority 10).
add_action( 'admin_print_scripts', 'gutenberg_print_import_map_early', PHP_INT_MIN );
add_action( 'wp_print_scripts', 'gutenberg_print_import_map_early', PHP_INT_MIN );

// Run before Core's default-priority print_import_map (priority 10) on the
// admin footer so the second emission is suppressed when the head hoist fired.
add_action( 'admin_print_footer_scripts', 'gutenberg_suppress_duplicate_import_map', 9 );

if ( ! function_exists( 'load_script_module_textdomain' ) ) {
	/**
	 * Loads the translation data for a given script module ID and text domain.
	 *
	 * Works like load_script_textdomain() but for script modules registered
	 * via wp_register_script_module().
	 *
	 * @since X.X.X
	 *
	 * @param string $id     The script module identifier.
	 * @param string $domain Optional. Text domain. Default 'default'.
	 * @param string $path   Optional. The full file path to the directory containing translation files.
	 * @return string|false The JSON-encoded translated strings for the given script module and text domain.
	 *                      False if there are none.
	 */
	function load_script_module_textdomain( $id, $domain = 'default', $path = '' ) {
		global $wp_textdomain_registry;

		$src = gutenberg_get_script_module_src( $id );

		if ( null === $src ) {
			return false;
		}

		$locale = determine_locale();

		if ( ! $path ) {
			$path = $wp_textdomain_registry->get( $domain, $locale );
		}

		$path = untrailingslashit( $path );

		$file_base       = 'default' === $domain ? $locale : $domain . '-' . $locale;
		$handle_filename = $file_base . '-' . $id . '.json';

		if ( $path ) {
			$translations = load_script_translations( $path . '/' . $handle_filename, $id, $domain );
			if ( $translations ) {
				return $translations;
			}
		}

		if ( ! preg_match( '|^(https?:)?//|', $src ) ) {
			$src = site_url( $src );
		}

		$relative       = false;
		$languages_path = WP_LANG_DIR;

		$src_url     = wp_parse_url( $src );
		$content_url = wp_parse_url( content_url() );
		$plugins_url = wp_parse_url( plugins_url() );
		$site_url    = wp_parse_url( site_url() );
		$theme_root  = get_theme_root();

		if (
			( ! isset( $content_url['path'] ) || str_starts_with( $src_url['path'], $content_url['path'] ) ) &&
			( ! isset( $src_url['host'] ) || ! isset( $content_url['host'] ) || $src_url['host'] === $content_url['host'] )
		) {
			if ( isset( $content_url['path'] ) ) {
				$relative = substr( $src_url['path'], strlen( $content_url['path'] ) );
			} else {
				$relative = $src_url['path'];
			}
			$relative = trim( $relative, '/' );
			$relative = explode( '/', $relative );

			$theme_dir = array_slice( explode( '/', $theme_root ), -1 );
			$dirname   = $theme_dir[0] === $relative[0] ? 'themes' : 'plugins';

			$languages_path = WP_LANG_DIR . '/' . $dirname;
			$relative       = array_slice( $relative, 2 );
			$relative       = implode( '/', $relative );
		} elseif (
			( ! isset( $plugins_url['path'] ) || str_starts_with( $src_url['path'], $plugins_url['path'] ) ) &&
			( ! isset( $src_url['host'] ) || ! isset( $plugins_url['host'] ) || $src_url['host'] === $plugins_url['host'] )
		) {
			if ( isset( $plugins_url['path'] ) ) {
				$relative = substr( $src_url['path'], strlen( $plugins_url['path'] ) );
			} else {
				$relative = $src_url['path'];
			}
			$relative = trim( $relative, '/' );
			$relative = explode( '/', $relative );

			$languages_path = WP_LANG_DIR . '/plugins';
			$relative       = array_slice( $relative, 1 );
			$relative       = implode( '/', $relative );
		} elseif ( ! isset( $src_url['host'] ) || ! isset( $site_url['host'] ) || $src_url['host'] === $site_url['host'] ) {
			if ( ! isset( $site_url['path'] ) ) {
				$relative = trim( $src_url['path'], '/' );
			} elseif ( str_starts_with( $src_url['path'], trailingslashit( $site_url['path'] ) ) ) {
				$relative = substr( $src_url['path'], strlen( $site_url['path'] ) );
				$relative = trim( $relative, '/' );
			}
		}

		/** This filter is documented in wp-includes/l10n.php */
		$relative = apply_filters( 'load_script_textdomain_relative_path', $relative, $src, true );

		if ( false === $relative ) {
			return load_script_translations( false, $id, $domain );
		}

		if ( str_ends_with( $relative, '.min.js' ) ) {
			$relative = substr( $relative, 0, -7 ) . '.js';
		}

		$md5_filename = $file_base . '-' . md5( $relative ) . '.json';

		if ( $path ) {
			$translations = load_script_translations( $path . '/' . $md5_filename, $id, $domain );
			if ( $translations ) {
				return $translations;
			}
		}

		$translations = load_script_translations( $languages_path . '/' . $md5_filename, $id, $domain );
		if ( $translations ) {
			return $translations;
		}

		return load_script_translations( false, $id, $domain );
	}
}
