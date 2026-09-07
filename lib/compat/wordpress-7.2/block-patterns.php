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
 * Registers the `wp_pattern_slug` meta on `wp_block` posts.
 *
 * A `wp_block` post carrying this meta is the customization (an edited copy) of
 * the registered pattern with that name. It wins over the registry when the
 * pattern is rendered, inserted or previewed, the same way a `wp_template_part`
 * post wins over the theme file. Trashing the post reverts to the registry.
 */
function gutenberg_register_block_pattern_slug_meta() {
	register_post_meta(
		'wp_block',
		'wp_pattern_slug',
		array(
			'type'         => 'string',
			'single'       => true,
			'show_in_rest' => true,
			'label'        => __( 'Registered pattern name', 'gutenberg' ),
			'description'  => __( 'The name of the registered pattern this pattern is an edited copy of.', 'gutenberg' ),
		)
	);
}
add_action( 'init', 'gutenberg_register_block_pattern_slug_meta' );

/**
 * Applies the `Synced` and `Area` headers of the active theme's `patterns/`
 * files.
 *
 * Core's `WP_Theme::get_block_patterns()` only reads a fixed list of headers,
 * so patterns carrying `Synced: yes` or `Area: header` are re-registered here
 * with the `synced` and `area` properties. Runs after
 * `_register_theme_block_patterns()`.
 */
function gutenberg_register_theme_block_pattern_headers() {
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

			$headers = get_file_data(
				$file_path,
				array(
					'synced' => 'Synced',
					'area'   => 'Area',
				)
			);
			$synced  = in_array( strtolower( trim( $headers['synced'] ) ), array( 'yes', 'true', '1' ), true );
			$area    = sanitize_key( $headers['area'] );
			if ( ! $synced && '' === $area ) {
				continue;
			}

			// Mirror the registration in `_register_theme_block_patterns()`;
			// `WP_Block_Patterns_Registry::register()` overwrites the entry.
			$pattern_data['filePath'] = $file_path;
			if ( $synced ) {
				$pattern_data['synced'] = true;
			}
			if ( '' !== $area ) {
				$pattern_data['area'] = $area;
			}
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
add_action( 'init', 'gutenberg_register_theme_block_pattern_headers', 11 );
