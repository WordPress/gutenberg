<?php
/**
 * Script Modules compatibility functions for WordPress 6.9.
 *
 * Patches WP_Script_Modules to add support for the wp_script_module_attributes filter
 * which is intended to be backported to core.
 *
 * @package gutenberg
 */

if ( version_compare( get_bloginfo( 'version' ), '6.9.0', '<' ) ) {

	remove_action( 'after_setup_theme', array( wp_script_modules(), 'add_hooks' ) );
	add_action( 'after_setup_theme', 'gutenberg_script_modules_add_hooks', 9 );

	/**
	 * Adds hooks for script modules with custom printing logic.
	 *
	 * Replaces the default script module hooks with custom ones that support
	 * filtering script module attributes via the wp_script_module_attributes filter.
	 */
	function gutenberg_script_modules_add_hooks() {
		$wp_script_modules = wp_script_modules();
		$position          = wp_is_block_theme() ? 'wp_head' : 'wp_footer';

		add_action( $position, array( $wp_script_modules, 'print_import_map' ) );
		add_action( $position, 'gutenberg_print_enqueued_script_modules' );
		add_action( $position, array( $wp_script_modules, 'print_script_module_preloads' ) );

		add_action( 'admin_print_footer_scripts', array( $wp_script_modules, 'print_import_map' ) );
		add_action( 'admin_print_footer_scripts', 'gutenberg_print_enqueued_script_modules' );
		add_action( 'admin_print_footer_scripts', array( $wp_script_modules, 'print_script_module_preloads' ) );

		add_action( 'wp_footer', array( $wp_script_modules, 'print_script_module_data' ) );
		add_action( 'admin_print_footer_scripts', array( $wp_script_modules, 'print_script_module_data' ) );
		add_action( 'wp_footer', array( $wp_script_modules, 'print_a11y_script_module_html' ), 20 );
		add_action( 'admin_print_footer_scripts', array( $wp_script_modules, 'print_a11y_script_module_html' ), 20 );
	}

	/**
	 * Prints enqueued script modules with support for the wp_script_module_attributes filter.
	 *
	 * Uses reflection to access private methods of WP_Script_Modules and prints
	 * script module tags with attributes that can be filtered via the
	 * wp_script_module_attributes filter.
	 */
	function gutenberg_print_enqueued_script_modules() {
		$wp_script_modules = wp_script_modules();
		$reflection        = new ReflectionClass( $wp_script_modules );

		// Gets private methods via reflection.
		$get_marked_for_enqueue = $reflection->getMethod( 'get_marked_for_enqueue' );
		$get_marked_for_enqueue->setAccessible( true );

		$get_src = $reflection->getMethod( 'get_src' );
		$get_src->setAccessible( true );

		// Checks if newer methods exist (WP 6.9+).
		$has_dependents_methods = $reflection->hasMethod( 'get_recursive_dependents' ) && $reflection->hasMethod( 'get_highest_fetchpriority' );
		if ( $has_dependents_methods ) {
			$get_recursive_dependents = $reflection->getMethod( 'get_recursive_dependents' );
			$get_recursive_dependents->setAccessible( true );
			$get_highest_fetchpriority = $reflection->getMethod( 'get_highest_fetchpriority' );
			$get_highest_fetchpriority->setAccessible( true );
		}

		foreach ( $get_marked_for_enqueue->invoke( $wp_script_modules ) as $id => $script_module ) {
			$args = array(
				'type' => 'module',
				'src'  => $get_src->invoke( $wp_script_modules, $id ),
				'id'   => $id . '-js-module',
			);

			if ( $has_dependents_methods ) {
				$dependents    = $get_recursive_dependents->invoke( $wp_script_modules, $id );
				$fetchpriority = $get_highest_fetchpriority->invoke( $wp_script_modules, array_merge( array( $id ), $dependents ) );
				if ( 'auto' !== $fetchpriority ) {
					$args['fetchpriority'] = $fetchpriority;
				}
				if ( $fetchpriority !== $script_module['fetchpriority'] ) {
					$args['data-wp-fetchpriority'] = $script_module['fetchpriority'];
				}
			}

			// Adds the new filter allowing the augmentation of script module attributes.
			$args = apply_filters( 'wp_script_module_attributes', $args, $id, $script_module );

			wp_print_script_tag( $args );
		}
	}
}
