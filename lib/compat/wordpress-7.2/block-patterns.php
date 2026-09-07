<?php
/**
 * Synced registered block patterns.
 *
 * A registered pattern (theme, plugin or core) can opt into being synced with
 * `'synced' => true` in its registration properties, or a `Synced: yes` header
 * in a theme's `patterns/` file. Inserting a synced pattern adds a `core/block`
 * that references the pattern by `slug` instead of copying its content, so
 * every instance follows the registered source. Patterns are unsynced by
 * default, which keeps the current copy-on-insert behavior.
 *
 * @package gutenberg
 */

/**
 * Whether a registered block pattern is synced.
 *
 * @param array $pattern Registered pattern properties.
 * @return bool True when inserting the pattern should reference it, false when
 *              it should copy its content.
 */
function gutenberg_is_block_pattern_synced( $pattern ) {
	return ! empty( $pattern['synced'] );
}

/**
 * Applies the `Synced` header of the active theme's `patterns/` files.
 *
 * Core's `WP_Theme::get_block_patterns()` only reads a fixed list of headers,
 * so patterns that opt in with `Synced: yes` are re-registered here with
 * `synced => true`. Runs after `_register_theme_block_patterns()`.
 */
function gutenberg_register_synced_theme_block_patterns() {
	if ( empty( wp_get_active_and_valid_themes() ) ) {
		return;
	}

	$themes   = array();
	$theme    = wp_get_theme();
	$themes[] = $theme;
	if ( $theme->parent() ) {
		$themes[] = $theme->parent();
	}
	$registry = WP_Block_Patterns_Registry::get_instance();
	$seen     = array();

	foreach ( $themes as $theme ) {
		$patterns    = $theme->get_block_patterns();
		$dirpath     = $theme->get_stylesheet_directory() . '/patterns/';
		$text_domain = $theme->get( 'TextDomain' );

		foreach ( $patterns as $file => $pattern_data ) {
			$slug = $pattern_data['slug'];
			// A child theme pattern wins over a parent theme pattern with the same slug.
			if ( isset( $seen[ $slug ] ) ) {
				continue;
			}
			$seen[ $slug ] = true;

			$file_path = $dirpath . $file;
			if ( ! file_exists( $file_path ) || ! $registry->is_registered( $slug ) ) {
				continue;
			}

			$headers = get_file_data( $file_path, array( 'synced' => 'Synced' ) );
			if ( ! in_array( strtolower( trim( $headers['synced'] ) ), array( 'yes', 'true', '1' ), true ) ) {
				continue;
			}

			// Mirror the registration in `_register_theme_block_patterns()`;
			// `WP_Block_Patterns_Registry::register()` overwrites the entry.
			$pattern_data['filePath'] = $file_path;
			$pattern_data['synced']   = true;
			// phpcs:ignore WordPress.WP.I18n.NonSingularStringLiteralText,WordPress.WP.I18n.NonSingularStringLiteralDomain,WordPress.WP.I18n.LowLevelTranslationFunction
			$pattern_data['title'] = translate_with_gettext_context( $pattern_data['title'], 'Pattern title', $text_domain );
			if ( ! empty( $pattern_data['description'] ) ) {
				// phpcs:ignore WordPress.WP.I18n.NonSingularStringLiteralText,WordPress.WP.I18n.NonSingularStringLiteralDomain,WordPress.WP.I18n.LowLevelTranslationFunction
				$pattern_data['description'] = translate_with_gettext_context( $pattern_data['description'], 'Pattern description', $text_domain );
			}

			register_block_pattern( $slug, $pattern_data );
		}
	}
}
add_action( 'init', 'gutenberg_register_synced_theme_block_patterns', 11 );
