<?php
/**
 * Core Post API
 *
 * @package WordPress
 * @subpackage Post
 */

//
// Post Type registration.
//

/**
 * Creates the initial post types when 'init' action is fired.
 *
 * See {@see 'init'}.
 *
 * @since 2.9.0
 */
function gutenberg_create_initial_post_types() {
	register_post_type(
		'wp_block_pattern',
		array(
			'labels'                => array(
				'name'                     => _x( 'Patterns', 'post type general name' ),
				'singular_name'            => _x( 'Pattern', 'post type singular name' ),
				'add_new'                  => _x( 'Add New', 'Pattern' ),
				'add_new_item'             => __( 'Add new Pattern' ),
				'new_item'                 => __( 'New Pattern' ),
				'edit_item'                => __( 'Edit Pattern' ),
				'view_item'                => __( 'View Pattern' ),
				'all_items'                => __( 'All Patterns' ),
				'search_items'             => __( 'Search Patterns' ),
				'not_found'                => __( 'No pattern found.' ),
				'not_found_in_trash'       => __( 'No pattern found in Trash.' ),
				'filter_items_list'        => __( 'Filter pattern list' ),
				'items_list_navigation'    => __( 'Patterns list navigation' ),
				'items_list'               => __( 'Patterns list' ),
				'item_published'           => __( 'Pattern published.' ),
				'item_published_privately' => __( 'Pattern published privately.' ),
				'item_reverted_to_draft'   => __( 'Pattern reverted to draft.' ),
				'item_scheduled'           => __( 'Pattern scheduled.' ),
				'item_updated'             => __( 'Pattern updated.' ),
			),
			'public'                => true,
			'_builtin'              => true, /* internal use only. don't use this when registering your own post type. */
			'show_ui'               => true,
			'show_in_menu'          => true,
			'rewrite'               => false,
			'show_in_rest'          => true,
			'rest_base'             => 'patterns',
			'rest_controller_class' => 'Gutenberg_REST_Patterns_Controller',
			'capability_type'       => 'block',
			'capabilities'          => array(
				// You need to be able to edit posts, in order to read blocks in their raw form.
				'read'                   => 'edit_posts',
				// You need to be able to publish posts, in order to create blocks.
				'create_posts'           => 'publish_posts',
				'edit_posts'             => 'edit_posts',
				'edit_published_posts'   => 'edit_published_posts',
				'delete_published_posts' => 'delete_published_posts',
				'edit_others_posts'      => 'edit_others_posts',
				'delete_others_posts'    => 'delete_others_posts',
			),
			'map_meta_cap'          => true,
			'supports'              => array(
				'title',
				'editor',
				'revisions',
			),
		)
	);
}
add_action( 'init', 'gutenberg_create_initial_post_types' );
