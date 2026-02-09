<?php
/**
 * Removes Core's admin enqueue scripts hooks to prevent duplicate route registration.
 *
 * Core's *_enqueue_scripts functions fire the page init actions, but Gutenberg's
 * render functions also fire them. We remove Core's to avoid duplicate route registration.
 *
 * @package gutenberg
 */

remove_action( 'admin_enqueue_scripts', 'wp_font_library_wp_admin_enqueue_scripts' );
remove_action( 'admin_enqueue_scripts', 'wp_site_editor_v2_wp_admin_enqueue_scripts' );

// Also remove Core's route registration callbacks from page init actions.
// Even though we remove Core's enqueue_scripts above, the plugin's enqueue
// functions fire the same init actions, which would trigger Core's route
// registration (registering modules with Core URLs instead of plugin URLs).
remove_action( 'font-library-wp-admin_init', 'wp_register_font_library_wp_admin_page_routes' );
remove_action( 'font-library_init', 'wp_register_font_library_page_routes' );
remove_action( 'site-editor_init', 'wp_register_site_editor_page_routes' );
remove_action( 'site-editor-wp-admin_init', 'wp_register_site_editor_wp_admin_page_routes' );
