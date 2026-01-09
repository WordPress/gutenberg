<?php
/**
 * Clears Core's routes before Gutenberg registers its own.
 *
 * @package gutenberg
 */

// Remove Core's enqueue scripts functions to prevent double init action firing.
// Core's *_enqueue_scripts functions fire the page init actions, but Gutenberg's
// render functions also fire them. We remove Core's to avoid duplicate route registration.
remove_action( 'admin_enqueue_scripts', 'font_library_wp_admin_enqueue_scripts' );
remove_action( 'admin_enqueue_scripts', 'site_editor_v2_wp_admin_enqueue_scripts' );
