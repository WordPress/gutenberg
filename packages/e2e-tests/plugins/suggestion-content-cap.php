<?php
/**
 * Plugin Name: Gutenberg Test Suggestion Content Cap
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * Lowers the size cap on the proposals the save pass stores on a note, so an
 * e2e test can produce a suggestion that is too large to move out of the post
 * content. Test plugins load before Gutenberg, so the constant is defined
 * before Gutenberg's default.
 *
 * @package gutenberg-test-suggestion-content-cap
 */

if ( ! defined( 'GUTENBERG_SUGGESTION_CONTENT_MAX_BYTES' ) ) {
	define( 'GUTENBERG_SUGGESTION_CONTENT_MAX_BYTES', 1 );
}
