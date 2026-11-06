<?php
/**
 * Plugin Name: Admin Shell Demo
 * Description: Two admin pages built with @wordpress/build that opt into the admin shell, so you can switch between them, and Gutenberg's own pages, without a page load. Turn on the "Instant admin page switching" Gutenberg experiment to try it.
 * Version: 1.0.0
 * Author: The WordPress Contributors
 * License: GPL-2.0-or-later
 *
 * @package admin-shell-demo
 */

$admin_shell_demo_build = __DIR__ . '/build/build.php';
if ( ! file_exists( $admin_shell_demo_build ) ) {
	add_action(
		'admin_notices',
		static function () {
			wp_admin_notice(
				__( 'Admin Shell Demo is not built yet. Run `npm run build:plugin --workspace @wordpress/admin-shell-demo-plugin` in the Gutenberg repository.', 'admin-shell-demo' ),
				array( 'type' => 'warning' )
			);
		}
	);
	return;
}
require_once $admin_shell_demo_build;

/**
 * Adds the demo pages to the admin menu: a top-level "Shell Demo" menu with
 * a Notes page, a Counter page and a Settings page. The callbacks are the generated render
 * functions of the pages in `wpPlugin.pages`.
 *
 * Notes uses the default menu slug, the page ID plus `-wp-admin`. Counter
 * uses a slug of its own, `shell-counter`, to show that the menu slug
 * can be anything other than the bare page ID, which @wordpress/build keeps
 * for the page's full-screen mode.
 */
function admin_shell_demo_add_menu_pages() {
	add_menu_page(
		__( 'Notes', 'admin-shell-demo' ),
		__( 'Shell Demo', 'admin-shell-demo' ),
		'manage_options',
		'shell-demo-notes-wp-admin',
		'admin_shell_demo_shell_demo_notes_wp_admin_render_page',
		'dashicons-performance'
	);
	add_submenu_page(
		'shell-demo-notes-wp-admin',
		__( 'Notes', 'admin-shell-demo' ),
		__( 'Notes', 'admin-shell-demo' ),
		'manage_options',
		'shell-demo-notes-wp-admin',
		'admin_shell_demo_shell_demo_notes_wp_admin_render_page'
	);
	add_submenu_page(
		'shell-demo-notes-wp-admin',
		__( 'Counter', 'admin-shell-demo' ),
		__( 'Counter', 'admin-shell-demo' ),
		'manage_options',
		'shell-counter',
		'admin_shell_demo_shell_demo_counter_wp_admin_render_page'
	);
	// Three copies of a deliberately heavy page, to test memory limits.
	foreach ( array( 1, 2, 3 ) as $number ) {
		add_submenu_page(
			'shell-demo-notes-wp-admin',
			/* translators: %d: number of the heavy demo page. */
			sprintf( __( 'Heavy page %d', 'admin-shell-demo' ), $number ),
			/* translators: %d: number of the heavy demo page. */
			sprintf( __( 'Heavy page %d', 'admin-shell-demo' ), $number ),
			'manage_options',
			"shell-demo-heavy-{$number}-wp-admin",
			"admin_shell_demo_shell_demo_heavy_{$number}_wp_admin_render_page"
		);
	}
	add_submenu_page(
		'shell-demo-notes-wp-admin',
		__( 'Settings', 'admin-shell-demo' ),
		__( 'Settings', 'admin-shell-demo' ),
		'manage_options',
		'shell-demo-settings-wp-admin',
		'admin_shell_demo_shell_demo_settings_wp_admin_render_page'
	);
}
add_action( 'admin_menu', 'admin_shell_demo_add_menu_pages' );

/**
 * Lists the demo pages in the admin shell, by menu slug. This is the whole
 * integration: the pages were built with @wordpress/build, which tells the
 * shell how to boot them.
 *
 * @param string[] $pages Pages that can be switched between in place.
 * @return string[] Pages, with the demo pages added.
 */
function admin_shell_demo_add_shell_pages( $pages ) {
	$pages[] = 'shell-demo-notes-wp-admin';
	$pages[] = 'shell-counter';
	$pages[] = 'shell-demo-settings-wp-admin';
	$pages[] = 'shell-demo-heavy-1-wp-admin';
	$pages[] = 'shell-demo-heavy-2-wp-admin';
	$pages[] = 'shell-demo-heavy-3-wp-admin';
	return $pages;
}
add_filter( 'admin_shell_pages', 'admin_shell_demo_add_shell_pages' );

/**
 * Registers the "Pages to keep alive" option, which the Settings page edits
 * through the REST API.
 */
function admin_shell_demo_register_settings() {
	register_setting(
		'admin_shell_demo',
		'admin_shell_demo_max_alive_pages',
		array(
			'type'              => 'integer',
			'description'       => __( 'How many admin pages the admin shell keeps in memory.', 'admin-shell-demo' ),
			'default'           => 5,
			'sanitize_callback' => static function ( $value ) {
				return max( 1, absint( $value ) );
			},
			'show_in_rest'      => array(
				'schema' => array(
					'minimum' => 1,
				),
			),
		)
	);
}
add_action( 'init', 'admin_shell_demo_register_settings' );

/**
 * Passes the "Pages to keep alive" option to the admin shell.
 *
 * @param int $max_alive_pages Maximum number of pages the shell keeps mounted.
 * @return int The option's value.
 */
function admin_shell_demo_max_alive_pages( $max_alive_pages ) {
	return (int) get_option( 'admin_shell_demo_max_alive_pages', $max_alive_pages );
}
add_filter( 'admin_shell_max_alive_pages', 'admin_shell_demo_max_alive_pages' );
