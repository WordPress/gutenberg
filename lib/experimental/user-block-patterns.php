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
				'name'                     => _x( 'Patterns', 'post type general name', 'gutenberg' ),
				'singular_name'            => _x( 'Pattern', 'post type singular name', 'gutenberg' ),
				'add_new'                  => _x( 'Add New', 'Pattern', 'gutenberg' ),
				'add_new_item'             => __( 'Add new Pattern', 'gutenberg' ),
				'new_item'                 => __( 'New Pattern', 'gutenberg' ),
				'edit_item'                => __( 'Edit Pattern', 'gutenberg' ),
				'view_item'                => __( 'View Pattern', 'gutenberg' ),
				'all_items'                => __( 'All Patterns', 'gutenberg' ),
				'search_items'             => __( 'Search Patterns', 'gutenberg' ),
				'not_found'                => __( 'No pattern found.', 'gutenberg' ),
				'not_found_in_trash'       => __( 'No pattern found in Trash.', 'gutenberg' ),
				'filter_items_list'        => __( 'Filter pattern list', 'gutenberg' ),
				'items_list_navigation'    => __( 'Patterns list navigation', 'gutenberg' ),
				'items_list'               => __( 'Patterns list', 'gutenberg' ),
				'item_published'           => __( 'Pattern published.', 'gutenberg' ),
				'item_published_privately' => __( 'Pattern published privately.', 'gutenberg' ),
				'item_reverted_to_draft'   => __( 'Pattern reverted to draft.', 'gutenberg' ),
				'item_scheduled'           => __( 'Pattern scheduled.', 'gutenberg' ),
				'item_updated'             => __( 'Pattern updated.', 'gutenberg' ),
			),
			'public'                => false,
			'_builtin'              => true, /* internal use only. don't use this when registering your own post type. */
			'show_ui'               => true,
			'show_in_menu'          => false,
			'rewrite'               => false,
			'show_in_rest'          => true,
			'rest_base'             => 'patterns',
			'rest_controller_class' => 'WP_REST_User_Patterns_Controller',
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
			'label'       => _x( 'User patterns', 'Block pattern category', 'gutenberg' ),
			'description' => __( 'Patterns that were created by users on this site.', 'gutenberg' ),
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
