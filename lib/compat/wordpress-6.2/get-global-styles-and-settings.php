<?php
/**
 * API to interact with global settings & styles.
 *
 * @package gutenberg
 */

if ( ! function_exists( 'wp_theme_has_theme_json' ) ) {
	/**
	 * Whether a theme or its parent have a theme.json file.
	 *
	 * The result would be cached via the WP_Object_Cache.
	 * It can be cleared by calling wp_theme_has_theme_json_clean_cache().
	 *
	 * @return boolean
	 */
	function wp_theme_has_theme_json() {
		$cache_group       = 'theme_json';
		$cache_key         = 'wp_theme_has_theme_json';
		$theme_has_support = wp_cache_get( $cache_key, $cache_group );

		/**
		 * $theme_has_support is stored as an int in the cache.
		 *
		 * The reason not to store it as a boolean is to avoid working
		 * with the $found parameter which apparently had some issues in some implementations
		 * https://developer.wordpress.org/reference/functions/wp_cache_get/
		 *
		 * Ignore cache when `WP_DEBUG` is enabled, so it doesn't interfere with the theme developers workflow.
		 */
		if ( ! WP_DEBUG && is_int( $theme_has_support ) ) {
			return (bool) $theme_has_support;
		}

		// Has the own theme a theme.json?
		$theme_has_support = is_readable( get_stylesheet_directory() . '/theme.json' );

		// Look up the parent if the child does not have a theme.json.
		if ( ! $theme_has_support ) {
			$theme_has_support = is_readable( get_template_directory() . '/theme.json' );
		}

		$theme_has_support = $theme_has_support ? 1 : 0;

		wp_cache_set( $cache_key, $theme_has_support, $cache_group );

		return (bool) $theme_has_support;
	}
}

if ( ! function_exists( 'wp_theme_has_theme_json_clean_cache' ) ) {
	/**
	 * Function to clean the cache used by wp_theme_has_theme_json method.
	 *
	 * Not to backport to core. Delete it instead.
	 */
	function wp_theme_has_theme_json_clean_cache() {
		_deprecated_function( __METHOD__, '14.7' );
	}
}

/**
 * Gets the global styles custom css from theme.json.
 *
 * @return string
 */
function gutenberg_get_global_styles_custom_css() {
	// Ignore cache when `WP_DEBUG` is enabled, so it doesn't interfere with the theme developers workflow.
	$can_use_cached = ! WP_DEBUG;
	$cache_key      = 'gutenberg_get_global_custom_css';
	$cache_group    = 'theme_json';
	if ( $can_use_cached ) {
		$cached = wp_cache_get( $cache_key, $cache_group );
		if ( $cached ) {
			return $cached;
		}
	}

	if ( ! wp_theme_has_theme_json() ) {
		return '';
	}

	$tree       = WP_Theme_JSON_Resolver_Gutenberg::get_merged_data();
	$stylesheet = $tree->get_custom_css();

	if ( $can_use_cached ) {
		wp_cache_set( $cache_key, $stylesheet, $cache_group );
	}

	return $stylesheet;
}

/**
 * Returns the stylesheet resulting of merging core, theme, and user data.
 *
 * @param array $types Types of styles to load. Optional.
 *                     It accepts as values: 'variables', 'presets', 'styles', 'base-layout-styles.
 *                     If empty, it'll load the following:
 *                     - for themes without theme.json: 'variables', 'presets', 'base-layout-styles'.
 *                     - for themes with theme.json: 'variables', 'presets', 'styles'.
 *
 * @return string Stylesheet.
 */
function gutenberg_get_global_stylesheet( $types = array() ) {
	// Ignore cache when `WP_DEBUG` is enabled, so it doesn't interfere with the theme developers workflow.
	$can_use_cached = empty( $types ) && ! WP_DEBUG;
	$cache_key      = 'gutenberg_get_global_stylesheet';
	$cache_group    = 'theme_json';
	if ( $can_use_cached ) {
		$cached = wp_cache_get( $cache_key, $cache_group );
		if ( $cached ) {
			return $cached;
		}
	}
	$tree                = WP_Theme_JSON_Resolver_Gutenberg::get_merged_data();
	$supports_theme_json = wp_theme_has_theme_json();
	if ( empty( $types ) && ! $supports_theme_json ) {
		$types = array( 'variables', 'presets', 'base-layout-styles' );
	} elseif ( empty( $types ) ) {
		$types = array( 'variables', 'presets', 'styles' );
	}

	/*
	 * If variables are part of the stylesheet,
	 * we add them.
	 *
	 * This is so themes without a theme.json still work as before 5.9:
	 * they can override the default presets.
	 * See https://core.trac.wordpress.org/ticket/54782
	 */
	$styles_variables = '';
	if ( in_array( 'variables', $types, true ) ) {
		/*
		 * We only use the default, theme, and custom origins.
		 * This is because styles for blocks origin are added
		 * at a later phase (render cycle) so we only render the ones in use.
		 * @see wp_add_global_styles_for_blocks
		 */
		$origins          = array( 'default', 'theme', 'custom' );
		$styles_variables = $tree->get_stylesheet( array( 'variables' ), $origins );
		$types            = array_diff( $types, array( 'variables' ) );
	}

	/*
	 * For the remaining types (presets, styles), we do consider origins:
	 *
	 * - themes without theme.json: only the classes for the presets defined by core
	 * - themes with theme.json: the presets and styles classes, both from core and the theme
	 */
	$styles_rest = '';
	if ( ! empty( $types ) ) {
		/*
		 * We only use the default, theme, and custom origins.
		 * This is because styles for blocks origin are added
		 * at a later phase (render cycle) so we only render the ones in use.
		 * @see wp_add_global_styles_for_blocks
		 */
		$origins = array( 'default', 'theme', 'custom' );
		if ( ! $supports_theme_json ) {
			$origins = array( 'default' );
		}
		$styles_rest = $tree->get_stylesheet( $types, $origins );
	}
	$stylesheet = $styles_variables . $styles_rest;
	if ( $can_use_cached ) {
		wp_cache_set( $cache_key, $stylesheet, $cache_group );
	}
	return $stylesheet;
}

/**
 * Function to get the settings resulting of merging core, theme, and user data.
 *
 * @param array $path    Path to the specific setting to retrieve. Optional.
 *                       If empty, will return all settings.
 * @param array $context {
 *     Metadata to know where to retrieve the $path from. Optional.
 *
 *     @type string $block_name Which block to retrieve the settings from.
 *                              If empty, it'll return the settings for the global context.
 *     @type string $origin     Which origin to take data from.
 *                              Valid values are 'all' (core, theme, and user) or 'base' (core and theme).
 *                              If empty or unknown, 'all' is used.
 * }
 *
 * @return array The settings to retrieve.
 */
function gutenberg_get_global_settings( $path = array(), $context = array() ) {
	if ( ! empty( $context['block_name'] ) ) {
		$new_path = array( 'blocks', $context['block_name'] );
		foreach ( $path as $subpath ) {
			$new_path[] = $subpath;
		}
		$path = $new_path;
	}

	// This is the default value when no origin is provided or when it is 'all'.
	$origin = 'custom';
	if (
		! wp_theme_has_theme_json() ||
		( isset( $context['origin'] ) && 'base' === $context['origin'] )
	) {
		$origin = 'theme';
	}

	$cache_group = 'theme_json';
	$cache_key   = 'gutenberg_get_global_settings_' . $origin;
	$settings    = wp_cache_get( $cache_key, $cache_group );

	if ( false === $settings || WP_DEBUG ) {
		$settings = WP_Theme_JSON_Resolver_Gutenberg::get_merged_data( $origin )->get_settings();
		wp_cache_set( $cache_key, $settings, $cache_group );
	}

	return _wp_array_get( $settings, $path, $settings );
}

/**
 * Private function to clean the caches used by gutenberg_get_global_settings method.
 *
 * @access private
 */
function _gutenberg_clean_theme_json_caches() {
	wp_cache_delete( 'wp_theme_has_theme_json', 'theme_json' );
	wp_cache_delete( 'gutenberg_get_global_stylesheet', 'theme_json' );
	wp_cache_delete( 'gutenberg_get_global_settings_custom', 'theme_json' );
	wp_cache_delete( 'gutenberg_get_global_settings_theme', 'theme_json' );
	wp_cache_delete( 'gutenberg_get_global_custom_css', 'theme_json' );
	WP_Theme_JSON_Resolver_Gutenberg::clean_cached_data();
}

/**
 * Tell the cache mechanisms not to persist theme.json data across requests.
 * The data stored under this cache group:
 *
 * - wp_theme_has_theme_json
 * - gutenberg_get_global_settings
 * - gutenberg_get_global_stylesheet
 *
 * There is some hooks consumers can use to modify parts
 * of the theme.json logic.
 * See https://make.wordpress.org/core/2022/10/10/filters-for-theme-json-data/
 *
 * The rationale to make this cache group non persistent is to make sure derived data
 * from theme.json is always fresh from the potential modifications done via hooks
 * that can use dynamic data (modify the stylesheet depending on some option,
 * or settings depending on user permissions, etc.).
 *
 * A different alternative considered was to invalidate the cache upon certain
 * events such as options add/update/delete, user meta, etc.
 * It was judged not enough, hence this approach.
 * See https://github.com/WordPress/gutenberg/pull/45372
 */
function _gutenberg_add_non_persistent_theme_json_cache_group() {
	wp_cache_add_non_persistent_groups( 'theme_json' );
}
add_action( 'plugins_loaded', '_gutenberg_add_non_persistent_theme_json_cache_group' );

if ( ! function_exists( 'wp_get_block_css_selector' ) ) {
	/**
	 * Determine the CSS selector for the block type and property provided,
	 * returning it if available.
	 *
	 * @param WP_Block_Type $block_type The block's type.
	 * @param string|array  $target     The desired selector's target, `root` or array path.
	 * @param boolean       $fallback   Whether or not to fallback to broader selector.
	 *
	 * @return string|null CSS selector or `null` if no selector available.
	 */
	function wp_get_block_css_selector( $block_type, $target = 'root', $fallback = false ) {
		if ( empty( $target ) ) {
			return null;
		}

		$has_selectors = isset( $block_type->selectors ) && ! empty( $block_type->selectors );

		// Duotone (No fallback selectors for Duotone).
		if ( 'duotone' === $target ) {
			// If selectors API in use, only use it's value or null.
			if ( $has_selectors ) {
				return _wp_array_get( $block_type->selectors, array( 'color', 'duotone' ), null );
			}

			// Selectors API, not available, check for old experimental selector.
			return _wp_array_get( $block_type->supports, array( 'color', '__experimentalDuotone' ), null );
		}

		// Root Selector.

		// Calculated before returning as it can be used as fallback for
		// feature selectors later on.
		$root_selector = null;

		if ( $has_selectors && isset( $block_type->selectors['root'] ) ) {
			// Prefer the selectors API if available.
			$root_selector = $block_type->selectors['root'];
		} elseif ( isset( $block_type->supports['__experimentalSelector'] ) && is_string( $block_type->supports['__experimentalSelector'] ) ) {
			// Use the old experimental selector supports property if set.
			$root_selector = $block_type->supports['__experimentalSelector'];
		} else {
			// If no root selector found, generate default block class selector.
			$block_name    = str_replace( '/', '-', str_replace( 'core/', '', $block_type->name ) );
			$root_selector = ".wp-block-{$block_name}";
		}

		// Return selector if it's the root target we are looking for.
		if ( 'root' === $target ) {
			return $root_selector;
		}

		// If target is not `root` or `duotone` we have a feature or subfeature
		// as the target. If the target is a string convert to an array.
		if ( is_string( $target ) ) {
			$target = explode( '.', $target );
		}

		// Feature Selectors ( May fallback to root selector ).
		if ( 1 === count( $target ) ) {
			$fallback_selector = $fallback ? $root_selector : null;

			// Prefer the selectors API if available.
			if ( $has_selectors ) {
				// Look for selector under `feature.root`.
				$path             = array_merge( $target, array( 'root' ) );
				$feature_selector = _wp_array_get( $block_type->selectors, $path, null );

				if ( $feature_selector ) {
					return $feature_selector;
				}

				// Check if feature selector set via shorthand.
				$feature_selector = _wp_array_get( $block_type->selectors, $target, null );

				return is_string( $feature_selector ) ? $feature_selector : $fallback_selector;
			}

			// Try getting old experimental supports selector value.
			$path             = array_merge( $target, array( '__experimentalSelector' ) );
			$feature_selector = _wp_array_get( $block_type->supports, $path, null );

			// Nothing to work with, provide fallback or null.
			if ( null === $feature_selector ) {
				return $fallback_selector;
			}

			// Scope the feature selector by the block's root selector.
			// TODO: Following is boilerplate from theme.json class. Is there a util?
			$scopes    = explode( ',', $root_selector );
			$selectors = explode( ',', $feature_selector );

			$selectors_scoped = array();
			foreach ( $scopes as $outer ) {
				foreach ( $selectors as $inner ) {
					$outer = trim( $outer );
					$inner = trim( $inner );
					if ( ! empty( $outer ) && ! empty( $inner ) ) {
						$selectors_scoped[] = $outer . ' ' . $inner;
					} elseif ( empty( $outer ) ) {
						$selectors_scoped[] = $inner;
					} elseif ( empty( $inner ) ) {
						$selectors_scoped[] = $outer;
					}
				}
			}

			return implode( ', ', $selectors_scoped );
		}

		// Subfeature selector
		// This may fallback either to parent feature or root selector.
		$subfeature_selector = null;
		// Use selectors API if available.
		if ( $has_selectors ) {
			$subfeature_selector = _wp_array_get( $block_type->selectors, $target, null );

			// Only return if we have a subfeature selector.
			if ( $subfeature_selector ) {
				return $subfeature_selector;
			}
		}

		// To this point we don't have a subfeature selector. If a fallback
		// has been requested, remove subfeature from target path and return
		// results of a call for the parent feature's selector.
		if ( $fallback ) {
			return wp_get_block_css_selector( $block_type, $target[0], $fallback );
		}

		// We tried...
		return null;
	}
}
