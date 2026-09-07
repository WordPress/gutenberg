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
 * A `wp_block` post carrying this meta is the edited copy (the "override") of
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
 * Returns the `wp_block` posts that are edited copies of registered patterns,
 * keyed by registered pattern name.
 *
 * Loaded once per request: the block patterns REST endpoint needs the lookup
 * for every registered pattern. Rendering a single `core/block` uses
 * `block_core_block_get_pattern_override()` instead.
 *
 * @return WP_Post[] Published override posts keyed by pattern name.
 */
function gutenberg_get_block_pattern_overrides() {
	static $overrides = null;

	if ( null === $overrides ) {
		$overrides = array();
		$posts     = get_posts(
			array(
				'post_type'      => 'wp_block',
				'post_status'    => 'publish',
				'posts_per_page' => -1,
				'meta_key'       => 'wp_pattern_slug',
				'no_found_rows'  => true,
			)
		);
		foreach ( $posts as $post ) {
			$name = get_post_meta( $post->ID, 'wp_pattern_slug', true );
			if ( $name && ! isset( $overrides[ $name ] ) ) {
				$overrides[ $name ] = $post;
			}
		}
	}

	return $overrides;
}

/**
 * Returns the `wp_block` post that overrides a registered pattern, if any.
 *
 * @param string $pattern_name Registered pattern name.
 * @return WP_Post|null The published override post, or null.
 */
function gutenberg_get_block_pattern_override( $pattern_name ) {
	$overrides = gutenberg_get_block_pattern_overrides();
	return $overrides[ $pattern_name ] ?? null;
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
