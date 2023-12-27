<?php
/**
 * Dataviews custom post type and taxonomy.
 *
 * @package gutenberg
 */

/**
 * Registers the `wp_dataviews` post type and the `wp_dataviews_type` taxonomy.
 */
function _gutenberg_register_data_views_post_type() {
	$gutenberg_experiments = get_option( 'gutenberg-experiments' );
	if ( empty( $gutenberg_experiments ) || ! array_key_exists( 'gutenberg-dataviews', $gutenberg_experiments ) ) {
		return;
	}
	register_post_type(
		'wp_dataviews',
		array(
			'label'        => _x( 'Dataviews', 'post type general name', 'gutenberg' ),
			'description'  => __( 'Post which stores the different data views configurations', 'gutenberg' ),
			'public'       => false,
			'show_ui'      => false,
			'show_in_rest' => true,
			'rewrite'      => false,
			'capabilities' => array(
				'read' => 'edit_published_posts',
			// 'create_posts'           => 'edit_published_posts',
			// 'edit_posts'             => 'edit_published_posts',
			// 'edit_published_posts'   => 'edit_published_posts',
			// 'delete_published_posts' => 'delete_published_posts',
			// 'edit_others_posts'      => 'edit_others_posts',
			// 'delete_others_posts'    => 'edit_theme_options',
			),
			'map_meta_cap' => true,
			'supports'     => array( 'title', 'slug', 'editor' ),
		)
	);

	register_taxonomy(
		'wp_dataviews_type',
		array( 'wp_dataviews' ),
		array(
			'public'            => false,
			'hierarchical'      => false,
			'labels'            => array(
				'name'          => __( 'Dataview types', 'gutenberg' ),
				'singular_name' => __( 'Dataview type', 'gutenberg' ),
			),
			'rewrite'           => false,
			'show_ui'           => false,
			'show_in_nav_menus' => false,
			'show_in_rest'      => true,
		)
	);
}

add_action( 'init', '_gutenberg_register_data_views_post_type' );
