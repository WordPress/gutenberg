<?php
/**
 * Content Guidelines experimental feature.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

require_once __DIR__ . '/class-gutenberg-content-guidelines-admin-page.php';

// Register admin page.
add_action( 'admin_menu', array( 'Gutenberg_Content_Guidelines_Admin_Page', 'register_menu' ) );
add_action( 'admin_enqueue_scripts', array( 'Gutenberg_Content_Guidelines_Admin_Page', 'enqueue_scripts' ) );
