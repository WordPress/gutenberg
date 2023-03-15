<?php
/**
 * Updates the script-loader.php file
 *
 * @package gutenberg
 */

/**
 * Removes duotone SVG filter presets from all being output. 
 * WP_Duotone_Gutenberg now handles only outputting the duotone SVG filters necessary
 * depending on the block content.
 */
remove_action( 'wp_body_open', 'wp_global_styles_render_svg_filters' );
remove_action( 'in_admin_header', 'wp_global_styles_render_svg_filters' );
 