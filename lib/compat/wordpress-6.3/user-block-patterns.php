<?php
/**
 * Handles user-created block patterns.
 *
 * @package gutenberg
 */

/**
 * Creates the `wp_block_pattern` post type.
 */
function gutenberg_create_wp_block_pattern_post_type() {
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
			'public'                => false,
			'_builtin'              => true, /* internal use only. don't use this when registering your own post type. */
			'show_ui'               => true,
			'show_in_menu'          => false,
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
add_action( 'init', 'gutenberg_create_wp_block_pattern_post_type' );

/**
 * Registers user-created block patterns.
 */
function gutenberg_register_user_block_patterns() {
	// Get posts from the wp_block_pattern post type.
	$posts = get_posts(
		array(
			'post_type'      => 'wp_block_pattern',
			'post_status'    => 'publish',
			'posts_per_page' => -1,
		)
	);

	// Bail if there are no posts.
	if ( empty( $posts ) ) {
		return;
	}

	// Register the user category.
	register_block_pattern_category(
		'user',
		array(
			'label'       => _x( 'User patterns', 'Block pattern category' ),
			'description' => __( 'Patterns that were created by users on this site.' ),
		)
	);

	// Register each post as a block pattern.
	foreach ( $posts as $post ) {
		register_block_pattern(
			'wp-block-pattern/' . $post->post_name,
			array(
				'title'       => $post->post_title,
				'description' => $post->post_excerpt,
				'content'     => $post->post_content,
				'categories'  => array( 'user' ),
			)
		);
	}
}
add_action( 'init', 'gutenberg_register_user_block_patterns' );
