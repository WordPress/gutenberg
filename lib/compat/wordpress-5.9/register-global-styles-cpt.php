<?php
/**
 * Function to register the Custom Post Type
 * to be used to store user's config.
 *
 * @package gutenberg
 */

/*
 * If wp_get_global_settings is defined, it means the plugin
 * is running on WordPress 5.9, so don't need to register the CPT
 * as it was already done by WordPress core.
 */
if ( ! function_exists( 'wp_get_global_settings' ) ) {

	/**
	 * Registers a Custom Post Type to store the user's origin config.
	 *
	 * This has been ported to src/wp-includes/post.php
	 */
	function register_global_styles_custom_post_type() {
		$args = array(
			'label'        => __( 'Global Styles', 'gutenberg' ),
			'description'  => 'Global styles to include in themes.',
			'public'       => false,
			'show_ui'      => false,
			'show_in_rest' => false,
			'rewrite'      => false,
			'capabilities' => array(
				'read'                   => 'edit_theme_options',
				'create_posts'           => 'edit_theme_options',
				'edit_posts'             => 'edit_theme_options',
				'edit_published_posts'   => 'edit_theme_options',
				'delete_published_posts' => 'edit_theme_options',
				'edit_others_posts'      => 'edit_theme_options',
				'delete_others_posts'    => 'edit_theme_options',
			),
			'map_meta_cap' => true,
			'supports'     => array(
				'title',
				'editor',
				'revisions',
			),
		);
		register_post_type( 'wp_global_styles', $args );
	}

	add_action( 'init', 'register_global_styles_custom_post_type' );
}
