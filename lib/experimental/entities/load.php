<?php
/**
 * Bootstraps the Entities page in wp-admin.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/class-gutenberg-entity-manager.php';
require_once __DIR__ . '/class-gutenberg-rest-entity-configs-controller.php';

// Initialize the entity manager (hooks into init at priority 99).
Gutenberg_Entity_Manager::init();

// Register REST API routes.
add_action(
	'rest_api_init',
	function () {
		$controller = new Gutenberg_REST_Entity_Configs_Controller();
		$controller->register_routes();
	}
);

// Register admin menu item under Appearance at priority 11 (after Core's menu setup).
add_action( 'admin_menu', 'gutenberg_register_entities_admin_submenu', 11 );

/**
 * Registers the Entities submenu item under Appearance.
 */
function gutenberg_register_entities_admin_submenu() {
	add_submenu_page(
		'themes.php',
		__( 'Entities', 'gutenberg' ),
		__( 'Entities', 'gutenberg' ),
		'manage_options',
		'entities-wp-admin',
		'gutenberg_entities_wp_admin_render_page'
	);
}

// Flush rewrite rules when entity configs have changed.
add_action( 'init', 'gutenberg_entity_configs_maybe_flush_rewrite_rules', 100 );

/**
 * Flushes rewrite rules if entity configurations have been modified.
 */
function gutenberg_entity_configs_maybe_flush_rewrite_rules() {
	if ( get_transient( 'gutenberg_entity_configs_flush_rewrite' ) ) {
		delete_transient( 'gutenberg_entity_configs_flush_rewrite' );
		flush_rewrite_rules( false );
	}
}
