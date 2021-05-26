<?php
/**
 * Plugin Name: Gutenberg Test Classic Widgets
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-classic-widgets
 */

// Disable the widgets block editor and enable the legacy widgets screen.
add_filter( 'use_widgets_block_editor', '__return_false' );
