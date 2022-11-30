<?php
/**
 * Overrides the core custom custom_css post type to make it available via REST and core data getEntity calls.
 */
function gutenberg_register_custom_css_post_type() {
	register_post_type(
		'custom_css',
		array(
			'labels' => array(
				'name'          => __( 'Custom CSS', 'gutenberg' ),
				'singular_name' => __( 'Custom CSS', 'gutenberg' ),
			),
			'public'                => false,
			'show_in_rest'          => true,
			'rest_controller_class' => 'Gutenberg_REST_Custom_CSS_Controller',
			'hierarchical'          => false,
			'rewrite'               => false,
			'query_var'             => false,
			'delete_with_user'      => false,
			'can_export'            => true,
			'_builtin'              => true, /* internal use only. don't use this when registering your own post type. */
			'supports'              => array( 'title', 'revisions' ),
			'capabilities'          => array(
				'delete_posts'           => 'edit_theme_options',
				'delete_post'            => 'edit_theme_options',
				'delete_published_posts' => 'edit_theme_options',
				'delete_private_posts'   => 'edit_theme_options',
				'delete_others_posts'    => 'edit_theme_options',
				'edit_post'              => 'edit_css',
				'edit_posts'             => 'edit_css',
				'edit_others_posts'      => 'edit_css',
				'edit_published_posts'   => 'edit_css',
				'read_post'              => 'read',
				'read_private_posts'     => 'read',
				'publish_posts'          => 'edit_theme_options',
			),
		)
	);
}
add_action( 'init', 'gutenberg_register_custom_css_post_type' );
