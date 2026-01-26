<?php
/**
 * Content Guidelines Post Type registration.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

/**
 * Handles registration of the Content Guidelines custom post type.
 */
class Gutenberg_Content_Guidelines_Post_Type {

	/**
	 * The post type name.
	 *
	 * @var string
	 */
	const POST_TYPE = 'wp_guidelines';

	/**
	 * Register the custom post type.
	 */
	public static function register() {
		$args = array(
			'labels'                => array(
				'name'          => __( 'Content Guidelines', 'gutenberg' ),
				'singular_name' => __( 'Content Guidelines', 'gutenberg' ),
			),
			'public'                => false,
			'publicly_queryable'    => false,
			'show_ui'               => false,
			'show_in_menu'          => false,
			'show_in_rest'          => true,
			'rest_namespace'        => '__experimental',
			'rest_base'             => 'content-guidelines',
			'rest_controller_class' => 'Gutenberg_Content_Guidelines_REST_Controller',
			'capability_type'       => 'post',
			'capabilities'          => array(
				'read'                   => 'edit_posts',
				'create_posts'           => 'manage_options',
				'edit_posts'             => 'manage_options',
				'edit_published_posts'   => 'manage_options',
				'delete_posts'           => 'manage_options',
				'delete_published_posts' => 'manage_options',
				'edit_others_posts'      => 'manage_options',
				'delete_others_posts'    => 'manage_options',
				'publish_posts'          => 'manage_options',
			),
			'map_meta_cap'          => true,
			'supports'              => array( 'revisions' ),
			'hierarchical'          => false,
			'has_archive'           => false,
			'rewrite'               => false,
			'query_var'             => false,
		);

		register_post_type( self::POST_TYPE, $args );
	}
}
