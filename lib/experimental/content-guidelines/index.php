<?php
/**
 * Content Guidelines experimental feature.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

require_once __DIR__ . '/class-post-type.php';
require_once __DIR__ . '/class-rest-controller.php';
require_once __DIR__ . '/class-admin-page.php';

// Register CPT.
add_action( 'init', array( 'Gutenberg_Content_Guidelines_Post_Type', 'register' ) );

// Register REST routes.
add_action(
	'rest_api_init',
	function () {
		$controller = new Gutenberg_Content_Guidelines_REST_Controller();
		$controller->register_routes();
	}
);

// Register admin page.
add_action( 'admin_menu', array( 'Gutenberg_Content_Guidelines_Admin_Page', 'register_menu' ) );
add_action( 'admin_enqueue_scripts', array( 'Gutenberg_Content_Guidelines_Admin_Page', 'enqueue_scripts' ) );
