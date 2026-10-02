<?php
/**
 * Exposes a same-origin URL for the bundled Emojibase data, so the Notes
 * emoji picker fetches its dataset without an external CDN.
 *
 * `tools/build-scripts/copy-emojibase-data.mjs` copies the files into
 * `build/emojibase-data/{locale}/` at plugin build time.
 *
 * @package gutenberg
 * @since   7.2.0
 */

/**
 * Injects the Emojibase dataset URL into the block editor settings, where
 * the Notes picker reads it. npm consumers of `@wordpress/editor` opt in by
 * supplying the same setting.
 *
 * @since 7.2.0
 *
 * @param array $settings Existing block editor settings.
 * @return array Updated block editor settings.
 */
function gutenberg_add_emojibase_settings( $settings ) {
	// Without the copied data the picker would 404 on every open.
	if ( is_dir( gutenberg_dir_path() . 'build/emojibase-data' ) ) {
		$settings['noteEmojibaseUrl'] = gutenberg_url( 'build/emojibase-data' );
	}
	return $settings;
}
add_filter( 'block_editor_settings_all', 'gutenberg_add_emojibase_settings' );
