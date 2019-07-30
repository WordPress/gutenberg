<?php
/**
 * Plugin Name: Gutenberg Test Custom Post Types
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-custom-post-types
 */

/**
 * Registers a custom post type that is public_queryable but not public.
 */
function public_queryable_true_public_false_cpt() {
	$public_queryable_true_public_false = 'public_q_not_public';
	register_post_type(
		$public_queryable_true_public_false,
		array(
			'label'              => 'PublicQNotPublic',
			'show_in_rest'       => true,
			'public'             => false,
			'publicly_queryable' => true,
			'supports'           => array( 'title', 'editor', 'revisions' ),
			'show_ui'            => true,
			'show_in_menu'       => true,
		)
	);
}
add_action( 'init', 'public_queryable_true_public_false_cpt' );

/**
 * Registers a custom post type that is public but not public_queryable.
 */
function public_queryable_false_public_true_cpt() {
	$public_queryable_false_public_true = 'not_public_q_public';
	register_post_type(
		$public_queryable_false_public_true,
		array(
			'label'              => 'NotPublicQPublic',
			'show_in_rest'       => true,
			'public'             => true,
			'publicly_queryable' => false,
			'supports'           => array( 'title', 'editor', 'revisions' ),
			'show_ui'            => true,
			'show_in_menu'       => true,
		)
	);
}
add_action( 'init', 'public_queryable_false_public_true_cpt' );

/**
 * Registers a custom post type that is public and public_queryable.
 */
function public_queryable_true_public_true_cpt() {
	$public_queryable_true_public_true = 'public_q_public';
	register_post_type(
		$public_queryable_true_public_true,
		array(
			'label'              => 'PublicQueryPublic',
			'show_in_rest'       => true,
			'public'             => true,
			'publicly_queryable' => true,
			'supports'           => array( 'title', 'editor', 'revisions' ),
			'show_ui'            => true,
			'show_in_menu'       => true,
		)
	);
}
add_action( 'init', 'public_queryable_true_public_true_cpt' );
