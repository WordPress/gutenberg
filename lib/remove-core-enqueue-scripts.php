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
