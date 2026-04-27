<?php
/**
 * JSON-aware kses replacement for wp_user_taxonomy `post_content`.
 *
 * Mirrors the global-styles pattern in `lib/experimental/kses.php`:
 *
 *   - Runs on `content_save_pre` at priority 9, before `wp_filter_post_kses`
 *     (priority 10). Ordering matters — JSON sanitize must run before kses,
 *     otherwise a second JSON decode can reconstruct payloads kses already
 *     cleaned.
 *   - Self-identifies via the `isUserTaxonomyConfigJSON` marker embedded in
 *     the JSON. Only acts on payloads that carry the marker — so other
 *     `post_content` writes pass through untouched.
 *   - Re-encodes with {@see JSON_HEX_TAG} and {@see JSON_HEX_AMP} so the
 *     stored bytes contain no live `<`, `>`, or `&` characters.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Decodes wp_user_taxonomy JSON `post_content`, runs it through the shared
 * sanitizer, and re-encodes. Returns input unchanged for any non-matching
 * payload — including invalid JSON, JSON without the marker, and non-array
 * decoded values.
 *
 * @param string $data Raw post_content as it would be stored.
 * @return string Filtered post_content.
 */
function gutenberg_filter_user_taxonomy_post_content( $data ) {
	$decoded = json_decode( wp_unslash( (string) $data ), true );
	if ( JSON_ERROR_NONE !== json_last_error() || ! is_array( $decoded ) ) {
		return $data;
	}
	if ( empty( $decoded[ GUTENBERG_USER_TAXONOMY_CONFIG_MARKER ] ) ) {
		return $data;
	}
	unset( $decoded[ GUTENBERG_USER_TAXONOMY_CONFIG_MARKER ] );

	$clean = gutenberg_user_taxonomy_sanitize_config( $decoded );
	$clean[ GUTENBERG_USER_TAXONOMY_CONFIG_MARKER ] = true;

	return wp_slash(
		wp_json_encode(
			$clean,
			JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP
		)
	);
}

/**
 * Attaches the JSON-aware filter ahead of `wp_filter_post_kses`. Idempotent
 * via WP's built-in duplicate-handler check on `add_filter`.
 */
function gutenberg_init_user_taxonomy_kses_filter() {
	add_filter( 'content_save_pre', 'gutenberg_filter_user_taxonomy_post_content', 9 );
	add_filter( 'content_filtered_save_pre', 'gutenberg_filter_user_taxonomy_post_content', 9 );
}
add_action( 'init', 'gutenberg_init_user_taxonomy_kses_filter' );
