<?php
/**
 *
 * Font Library initialization.
 *
 * This file contains Font Library init calls.
 *
 * @package    WordPress
 * @subpackage Font Library
 */

function gutenberg_override_default_font_collections() {
	// Remove the default font collection.
	wp_unregister_font_collection( 'google-fonts' );

	wp_register_font_collection(
		'google-fonts',
		array(
			'name'          => _x( 'Google Fonts', 'font collection name' ),
			'description'   => __( 'Install from Google Fonts. Fonts are copied to and served from your site.' ),
			'font_families' => 'https://s.w.org/images/fonts/18.2/collections/google-fonts-with-preview.json',
			'categories'    => array(
				array(
					'name' => _x( 'Sans Serif', 'font category' ),
					'slug' => 'sans-serif',
				),
				array(
					'name' => _x( 'Display', 'font category' ),
					'slug' => 'display',
				),
				array(
					'name' => _x( 'Serif', 'font category' ),
					'slug' => 'serif',
				),
				array(
					'name' => _x( 'Handwriting', 'font category' ),
					'slug' => 'handwriting',
				),
				array(
					'name' => _x( 'Monospace', 'font category' ),
					'slug' => 'monospace',
				),
			),
		)
	);
}

// Run after default priority to make sure the default font collections are registered.
// add_action( 'init', 'gutenberg_override_default_font_collections', 20 );
