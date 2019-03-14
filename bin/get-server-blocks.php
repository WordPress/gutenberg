#!/usr/bin/env php
<?php
/**
 * Generates server-registered blocks, writing to standard output. By default
 * assumes plugin exists in a standard install `wp-content/plugins` directory.
 * Define ABSPATH environment variable pointing to WordPress install otherwise.
 *
 * @package gutenberg-build
 */

// Disable error reporting which would otherwise be displayed in stdout along
// with the JSON output.
error_reporting( 0 );

$abspath = getenv( 'ABSPATH' );
define( 'ABSPATH', $abspath ? $abspath : dirname( dirname( dirname( dirname( dirname( __FILE__ ) ) ) ) ) . '/' );
define( 'WPINC', 'wp-includes' );
define( 'WP_SETUP_CONFIG', true );
define( 'WP_USE_THEMES', false );
require_once ABSPATH . WPINC . '/load.php';
require_once ABSPATH . WPINC . '/default-constants.php';
wp_fix_server_vars();
wp_initial_constants();
require_once ABSPATH . WPINC . '/functions.php';
wp_load_translations_early();
wp_set_lang_dir();
require_once ABSPATH . WPINC . '/blocks.php';
require_once ABSPATH . WPINC . '/class-wp-block-type-registry.php';
require_once ABSPATH . WPINC . '/class-wp-block-type.php';
require_once ABSPATH . '/wp-admin/includes/post.php';

// Register server-side code for individual blocks.
foreach ( glob( dirname( dirname( __FILE__ ) ) . '/packages/block-library/src/*/index.php' ) as $block_logic ) {
	require_once $block_logic;
}

do_action( 'init' );

echo json_encode( get_block_editor_server_block_settings() );
