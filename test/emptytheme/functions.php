<?php
/**
 * Empty theme functions and definitions.
 *
 * @package Gutenberg
 */

if ( ! function_exists( 'emptytheme_support' ) ) :
	/**
	 * Add theme support for various features.
	 */
	function emptytheme_support() {

		// Adding support for core block visual styles.
		add_theme_support( 'wp-block-styles' );

		// Enqueue editor styles.
		add_editor_style( 'style.css' );
	}
	add_action( 'after_setup_theme', 'emptytheme_support' );
endif;

if ( ! function_exists( 'emptytheme_scripts' ) ) :
	/**
	 * Enqueue scripts and styles.
	 */
	function emptytheme_scripts() {
		// Enqueue theme stylesheet.
		wp_enqueue_style( 'emptytheme-style', get_template_directory_uri() . '/style.css', array(), wp_get_theme()->get( 'Version' ) );
	}
	add_action( 'wp_enqueue_scripts', 'emptytheme_scripts' );
endif;
