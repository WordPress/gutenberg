<?php
/**
 * Plugin Name: Gutenberg Test Custom Post Types
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-custom-post-types
 */

/**
 * Registers a custom post type that is not public_queryable and not public.
 */
function public_queryable_false_public_false_cpt() {
	// post type name has to be less than 20 chars.
	$public_queryable_false_public_false = 'not_public';
	register_post_type(
		$public_queryable_false_public_false,
		array(
			'label'        => 'NotPublicQNotPublic',
			'show_in_rest' => true,
			'public'       => false,
			'supports'     => array( 'title', 'editor', 'revisions' ),
			'show_ui'      => true,
			'show_in_menu' => true,
		)
	);
}
add_action( 'init', 'public_queryable_false_public_false_cpt' );

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
			'supports'           => array( 'excerpt', 'title', 'editor', 'revisions' ),
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
			'supports'           => array( 'excerpt', 'title', 'editor', 'revisions' ),
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
			'supports'           => array( 'excerpt', 'title', 'editor', 'revisions' ),
			'show_ui'            => true,
			'show_in_menu'       => true,
		)
	);
}
add_action( 'init', 'public_queryable_true_public_true_cpt' );

/**
 * Registers a custom post type with real-time collaboration disabled.
 */
function gutenberg_test_register_collaboration_disabled_post_type() {
	register_post_type(
		'rtc_disabled',
		array(
			'label'        => 'RTC Disabled',
			'show_in_rest' => true,
			'public'       => true,
			'supports'     => array( 'title', 'editor', 'revisions' ),
		)
	);
}
add_action( 'init', 'gutenberg_test_register_collaboration_disabled_post_type' );

/**
 * Disables real-time collaboration for the test post type.
 *
 * @param bool   $disabled  Whether collaboration is disabled.
 * @param string $post_type Post type name.
 * @return bool Whether collaboration is disabled.
 */
function gutenberg_test_disable_post_type_collaboration( $disabled, $post_type ) {
	return 'rtc_disabled' === $post_type ? true : $disabled;
}
add_filter( 'wp_is_post_type_collaboration_disabled', 'gutenberg_test_disable_post_type_collaboration', 10, 2 );

/**
 * Registers a custom post type that is hierarchical and does not supports the title attribute.
 */
function hierarchical_without_title_cpt() {
	register_post_type(
		'hierar-no-title',
		array(
			'public'       => true,
			'label'        => 'Hierarchical No Title',
			'show_in_rest' => true,
			'hierarchical' => true,
			'supports'     => array( 'page-attributes', 'editor', 'thumbnail', 'comments', 'post-formats' ),
			'show_ui'      => true,
			'show_in_menu' => true,
		)
	);
}
add_action( 'init', 'hierarchical_without_title_cpt' );

/**
 * Registers a custom post type that includes a legacy block in `template`.
 */
function legacy_block_in_template_cpt() {
	register_post_type(
		'leg_block_in_tpl',
		array(
			'label'              => 'Legacy block in template',
			'show_in_rest'       => true,
			'public'             => true,
			'publicly_queryable' => true,
			'supports'           => array( 'title', 'editor', 'revisions' ),
			'show_ui'            => true,
			'show_in_menu'       => true,
			'template'           => array(
				array(
					'core-embed/wordpress-tv',
					array( 'className' => 'wordpress_video' ),
				),
			),
		)
	);
}
add_action( 'init', 'legacy_block_in_template_cpt' );
