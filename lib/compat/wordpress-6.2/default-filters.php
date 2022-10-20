<?php

/**
 * Note for backport: we should also remove the existing filters:
 *
 * > add_action( 'switch_theme', array( 'WP_Theme_JSON_Resolver', 'clean_cached_data' ) );
 * > add_action( 'start_previewing_theme', array( 'WP_Theme_JSON_Resolver', 'clean_cached_data' ) );
 */
add_action( 'switch_theme', 'wp_theme_clean_theme_json_cached_data' );
add_action( 'start_previewing_theme', 'wp_theme_clean_theme_json_cached_data' );
