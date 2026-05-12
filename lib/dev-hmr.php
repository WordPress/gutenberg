<?php
/**
 * Development-only HMR script injection.
 *
 * No-op unless the sentinel file `build/hmr/.live` exists, which is created
 * by `bin/live-reload.mjs` while the live-reload SSE server is running and
 * removed on shutdown. The sentinel's contents are the SSE server's port.
 *
 * @package gutenberg
 */

// Defence in depth: even if the sentinel file somehow got committed or
// the build dir ended up on a production install, require WP_DEBUG to
// inject any HMR scripts. Fast Refresh is strictly a dev-time feature.
if ( ! defined( 'WP_DEBUG' ) || ! WP_DEBUG ) {
	return;
}

$gutenberg_hmr_sentinel = __DIR__ . '/../build/hmr/.live';
if ( ! file_exists( $gutenberg_hmr_sentinel ) ) {
	return;
}

$gutenberg_hmr_port = trim( (string) file_get_contents( $gutenberg_hmr_sentinel ) );
if ( ! ctype_digit( $gutenberg_hmr_port ) ) {
	return;
}

$gutenberg_hmr_runtime_url = 'http://localhost:' . $gutenberg_hmr_port . '/hmr/react-refresh-runtime.js';
$gutenberg_hmr_client_url  = 'http://localhost:' . $gutenberg_hmr_port . '/hmr/hmr-client.js';

// Load react-refresh runtime BEFORE React. We hook the script-printing actions
// directly rather than wp_head/admin_head, because:
//   - wp_head priority 1 fires before wp_print_head_scripts (priority 9), so that's fine on the frontend.
//   - admin_head fires AFTER admin_print_scripts, so a priority-1 callback there runs too late
//     — React would already be printed (and initialized) before our runtime arrived.
// admin_print_scripts/wp_print_scripts at priority 1 run before the default
// printer at priority 10, so our <script> appears first in the document.
$gutenberg_hmr_print_runtime = static function () use ( $gutenberg_hmr_runtime_url ) {
	echo '<script src="' . esc_url( $gutenberg_hmr_runtime_url ) . '"></script>';
};
// wp_head priority 1 fires before wp_print_head_scripts (priority 9), so this is fine on the frontend.
add_action( 'wp_head', $gutenberg_hmr_print_runtime, 1 );
// On admin pages, admin_print_scripts at priority < 10 fires before the default
// print_admin_scripts callback that emits all enqueued scripts.
add_action( 'admin_print_scripts', $gutenberg_hmr_print_runtime, 1 );

// Load HMR client AFTER all scripts.
$gutenberg_hmr_print_client = static function () use ( $gutenberg_hmr_client_url ) {
	echo '<script src="' . esc_url( $gutenberg_hmr_client_url ) . '"></script>';
};
add_action( 'wp_footer', $gutenberg_hmr_print_client, PHP_INT_MAX );
add_action( 'admin_footer', $gutenberg_hmr_print_client, PHP_INT_MAX );
