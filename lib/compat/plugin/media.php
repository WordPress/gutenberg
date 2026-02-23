<?php
/**
 * Disables client-side media processing by default in the Gutenberg plugin.
 *
 * Client-side media processing is being polished during the 7.0 cycle.
 * It is disabled by default in the plugin until known issues are resolved,
 * but can still be enabled via the filter.
 *
 * Remove this file when the linked issues are resolved and the plugin
 * is ready to match Core's default.
 *
 * @see https://github.com/WordPress/gutenberg/issues/75302
 * @see https://github.com/WordPress/gutenberg/issues/75605
 *
 * @package gutenberg
 */

// @core-merge: Do not merge this into WordPress core.
add_filter( 'wp_client_side_media_processing_enabled', '__return_false' );
