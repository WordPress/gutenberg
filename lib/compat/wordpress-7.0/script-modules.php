<?php
/**
 * Script Modules API: Polyfill for wp_set_script_module_translations().
 *
 * Provides translation support for script modules on WordPress versions
 * that do not yet include this functionality in Core.
 *
 * @package gutenberg
 * @since X.X.X
 */

if ( ! function_exists( 'wp_set_script_module_translations' ) ) {

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
		$prop->setAccessible( true );
		$registered = $prop->getValue( $script_modules );

		return $registered[ $id ]['src'] ?? null;
	}

	/**
	 * Storage for text-domain overrides for specific script modules.
	 *
	 * Only populated when a caller explicitly overrides the text domain for a
	 * module via wp_set_script_module_translations().
	 *
	 * @var array<string, array{textdomain: string, path: string}>
	 */
	global $gutenberg_script_module_translations;
	$gutenberg_script_module_translations = array();

	/**
	 * Overrides the text domain and path used to load translations for a script module.
	 *
	 * Translations for script modules are loaded automatically from the default
	 * text domain. This function is only needed when a module's text domain
	 * differs from 'default' or when translation files live outside the
	 * standard location.
	 *
	 * @since X.X.X
	 *
	 * @param string $id     The identifier of the script module.
	 * @param string $domain Optional. Text domain. Default 'default'.
	 * @param string $path   Optional. The full file path to the directory containing translation files.
	 * @return bool True if the text domain was registered, false if the module is not registered.
	 */
	function wp_set_script_module_translations( string $id, string $domain = 'default', string $path = '' ): bool {
		global $gutenberg_script_module_translations;

		$src = gutenberg_get_script_module_src( $id );
		if ( null === $src ) {
			return false;
		}

		$gutenberg_script_module_translations[ $id ] = array(
			'textdomain' => $domain,
			'path'       => $path,
		);

		return true;
	}

	/**
	 * Prints translations for all enqueued script modules.
	 *
	 * Auto-detects the text domain for each enqueued module. Callers can opt
	 * into a non-default text domain via wp_set_script_module_translations().
	 *
	 * @since X.X.X
	 */
	function gutenberg_print_script_module_translations() {
		global $gutenberg_script_module_translations;

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
			$method->setAccessible( true );
			$module_ids = $method->invoke( $script_modules, $queue );
		} else {
			$module_ids = $queue;
		}

		foreach ( $module_ids as $id ) {
			if ( isset( $gutenberg_script_module_translations[ $id ] ) ) {
				$domain = $gutenberg_script_module_translations[ $id ]['textdomain'];
				$path   = $gutenberg_script_module_translations[ $id ]['path'];
			} else {
				$domain = 'default';
				$path   = '';
			}

			$json_translations = load_script_module_textdomain( $id, $domain, $path );
			if ( ! $json_translations ) {
				continue;
			}

			$set_locale_data_js_function = <<<JS
			( domain, translations ) => {
				const localeData = translations.locale_data[ domain ] || translations.locale_data.messages;
				localeData[""].domain = domain;
				wp.i18n.setLocaleData( localeData, domain );
			}
			JS;

			$output     = sprintf(
				'( %s )( %s, %s );',
				$set_locale_data_js_function,
				wp_json_encode( $domain ),
				$json_translations
			);
			$source_url = rawurlencode( "wp-script-module-translation-data-{$id}" );
			$output    .= "\n//# sourceURL={$source_url}";
			wp_print_inline_script_tag( $output, array( 'id' => "wp-script-module-translation-data-{$id}" ) );
		}
	}

	// Print translations after classic scripts are loaded (priority 10) but before modules execute.
	add_action( 'wp_footer', 'gutenberg_print_script_module_translations', 21 );
	add_action( 'admin_print_footer_scripts', 'gutenberg_print_script_module_translations', 11 );
}

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
