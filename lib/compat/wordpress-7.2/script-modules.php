<?php
/**
 * Script modules changes for WordPress 7.2.
 *
 * `WP_Script_Modules::print_script_module_translations()` only prints the
 * translations of the enqueued script modules and their dependencies, so a
 * script module that only a classic script imports, through its
 * `module_dependencies`, loads with no translations. The method can't be
 * patched, so its hooks are replaced with a function that also prints the
 * translations of those script modules. Each script module's translations are
 * printed once, whether or not WordPress includes the fix.
 */

/**
 * Gets the IDs of the script modules that classic scripts depend on.
 *
 * Walks the enqueued, to-do and done classic scripts and their dependencies,
 * and collects the script modules in their `module_dependencies` data, like
 * WordPress does for the import map. Unlike WordPress, it doesn't trigger a
 * notice for the script modules that are not registered, since WordPress
 * already does when it prints the import map.
 *
 * @global WP_Scripts $wp_scripts
 *
 * @return string[] Script module IDs.
 */
function gutenberg_get_classic_script_module_dependencies() {
	global $wp_scripts;

	$module_ids = array();
	if ( ! $wp_scripts instanceof WP_Scripts ) {
		return $module_ids;
	}

	$handles   = array_merge( $wp_scripts->queue, $wp_scripts->to_do, $wp_scripts->done );
	$processed = array();
	while ( ! empty( $handles ) ) {
		$handle = array_pop( $handles );
		if ( isset( $processed[ $handle ] ) || ! isset( $wp_scripts->registered[ $handle ] ) ) {
			continue;
		}
		$processed[ $handle ] = true;

		$module_dependencies = $wp_scripts->get_data( $handle, 'module_dependencies' );
		if ( is_array( $module_dependencies ) ) {
			foreach ( $module_dependencies as $module ) {
				if ( is_string( $module ) ) {
					$module_ids[] = $module;
				} elseif ( is_array( $module ) && isset( $module['id'] ) && is_string( $module['id'] ) ) {
					$module_ids[] = $module['id'];
				}
			}
		}

		foreach ( $wp_scripts->registered[ $handle ]->deps as $dep ) {
			if ( ! isset( $processed[ $dep ] ) ) {
				$handles[] = $dep;
			}
		}
	}

	return $module_ids;
}

/**
 * Prints the translations of the enqueued script modules, of the script
 * modules that classic scripts depend on, and of their dependencies.
 *
 * Works like `WP_Script_Modules::print_script_module_translations()` with the
 * fix, using only public methods. One difference: WordPress skips an enqueued
 * script module with dependencies that are not registered, since it can't
 * load, while this function still prints its translations, which are unused.
 */
function gutenberg_print_script_module_translations() {
	$script_modules = wp_script_modules();

	// Collect the registered script modules that can load on the page.
	$modules  = array();
	$id_queue = array_merge( $script_modules->get_queue(), gutenberg_get_classic_script_module_dependencies() );
	while ( ! empty( $id_queue ) ) {
		$id = array_shift( $id_queue );
		if ( isset( $modules[ $id ] ) ) {
			continue;
		}
		$module = $script_modules->get_registered( $id );
		if ( null === $module ) {
			continue;
		}
		$modules[ $id ] = $module;
		foreach ( $module['dependencies'] as $dependency ) {
			$id_queue[] = $dependency['id'];
		}
	}

	$set_locale_data_js_function = <<<'JS'
	( domain, translations ) => {
		const localeData = translations.locale_data[ domain ] || translations.locale_data.messages;
		localeData[""].domain = domain;
		wp.i18n.setLocaleData( localeData, domain );
	}
	JS;

	foreach ( $modules as $id => $module ) {
		$domain = $module['textdomain'] ?? 'default';
		$path   = $module['translations_path'] ?? '';

		$json_translations = load_script_module_textdomain( $id, $domain, $path );

		if ( ! $json_translations ) {
			continue;
		}

		$output    = sprintf(
			'( %s )( %s, %s );',
			$set_locale_data_js_function,
			wp_json_encode( $domain, JSON_HEX_TAG | JSON_UNESCAPED_SLASHES ),
			$json_translations
		);
		$script_id = "wp-script-module-translation-data-{$id}";
		$output   .= "\n//# sourceURL=" . rawurlencode( $script_id );

		// Ensure wp-i18n is printed; the inline script below relies on wp.i18n.setLocaleData().
		if ( ! wp_script_is( 'wp-i18n', 'done' ) ) {
			wp_scripts()->do_items( array( 'wp-i18n' ) );
		}

		wp_print_inline_script_tag( $output, array( 'id' => $script_id ) );
	}
}

/**
 * Replaces the hooks of `WP_Script_Modules::print_script_module_translations()`
 * with `gutenberg_print_script_module_translations()`, at the same priorities.
 *
 * WordPress adds its hooks on `after_setup_theme`, so this runs after it. A
 * hook that was removed stays removed.
 */
function gutenberg_replace_script_module_translations_hooks() {
	$callback = array( wp_script_modules(), 'print_script_module_translations' );
	foreach ( array( 'wp_footer', 'admin_print_footer_scripts' ) as $hook_name ) {
		$priority = has_action( $hook_name, $callback );
		if ( false !== $priority ) {
			remove_action( $hook_name, $callback, $priority );
			add_action( $hook_name, 'gutenberg_print_script_module_translations', $priority );
		}
	}
}
add_action( 'after_setup_theme', 'gutenberg_replace_script_module_translations_hooks', 11 );
