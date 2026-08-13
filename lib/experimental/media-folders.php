<?php
/**
 * Media folders: a hierarchical taxonomy for organizing attachments.
 *
 * Experimental. Loaded from `lib/load.php` only when the `gutenberg-media-folders`
 * experiment is enabled, so with the experiment off the taxonomy is never
 * registered and every consumer degrades to the pre-existing behaviour.
 *
 * @package gutenberg
 */

/**
 * Registers the `wp_media_folder` taxonomy on attachments.
 *
 * Storing folders as a taxonomy (rather than a custom table or a custom post
 * type) is what makes them interoperable: `show_in_rest` alone yields term CRUD
 * via `WP_REST_Terms_Controller`, a `media-folders` collection parameter on
 * `/wp/v2/media` for filtering, and a `media-folders` field on each attachment
 * record for assignment — so the editor needs no bespoke endpoints.
 *
 * Registered as hierarchical even though the current UI only creates top-level
 * folders: nesting is the expected direction, and changing `hierarchical` later
 * would mean re-registering an already-populated taxonomy.
 */
function gutenberg_register_media_folder_taxonomy() {
	register_taxonomy(
		'wp_media_folder',
		'attachment',
		array(
			'hierarchical'          => true,
			// Folders are an admin-side organizational tool: they have no
			// public archive, permalink or query var of their own.
			'public'                => false,
			'publicly_queryable'    => false,
			'rewrite'               => false,
			'query_var'             => false,
			// Surfaces the taxonomy on the attachment edit screen, which is a
			// useful way to inspect assignments while the feature is
			// experimental.
			'show_ui'               => true,
			'show_in_menu'          => false,
			'show_in_nav_menus'     => false,
			'show_in_rest'          => true,
			'rest_base'             => 'media-folders',
			// The default `_update_post_term_count` bases an attachment's count
			// on its *parent post's* status, and only counts attachments with
			// `post_parent > 0`. Media in a folder is typically unattached, so
			// the default would report every folder as empty. The generic
			// callback simply counts term relationships, which is what a folder
			// means here.
			'update_count_callback' => '_update_generic_term_count',
			'capabilities'          => array(
				'manage_terms' => 'manage_categories',
				'edit_terms'   => 'manage_categories',
				'delete_terms' => 'manage_categories',
				// Anyone who can upload media can file it into an existing
				// folder; only editors and above can create or rename folders.
				'assign_terms' => 'upload_files',
			),
			'labels'                => array(
				'name'                       => _x( 'Folders', 'taxonomy general name', 'gutenberg' ),
				'singular_name'              => _x( 'Folder', 'taxonomy singular name', 'gutenberg' ),
				'menu_name'                  => __( 'Folders', 'gutenberg' ),
				'all_items'                  => __( 'All folders', 'gutenberg' ),
				'edit_item'                  => __( 'Edit folder', 'gutenberg' ),
				'view_item'                  => __( 'View folder', 'gutenberg' ),
				'update_item'                => __( 'Update folder', 'gutenberg' ),
				'add_new_item'               => __( 'Add folder', 'gutenberg' ),
				'new_item_name'              => __( 'New folder name', 'gutenberg' ),
				'parent_item'                => __( 'Parent folder', 'gutenberg' ),
				'parent_item_colon'          => __( 'Parent folder:', 'gutenberg' ),
				'search_items'               => __( 'Search folders', 'gutenberg' ),
				'not_found'                  => __( 'No folders found.', 'gutenberg' ),
				'no_terms'                   => __( 'No folders', 'gutenberg' ),
				'items_list'                 => __( 'Folders list', 'gutenberg' ),
				'items_list_navigation'      => __( 'Folders list navigation', 'gutenberg' ),
				'back_to_items'              => __( '&larr; Go to folders', 'gutenberg' ),
				'item_link'                  => __( 'Folder Link', 'gutenberg' ),
				'item_link_description'      => __( 'A link to a folder.', 'gutenberg' ),
				'separate_items_with_commas' => __( 'Separate folders with commas', 'gutenberg' ),
				'add_or_remove_items'        => __( 'Add or remove folders', 'gutenberg' ),
				'choose_from_most_used'      => __( 'Choose from the most used folders', 'gutenberg' ),
			),
		)
	);
}
add_action( 'init', 'gutenberg_register_media_folder_taxonomy' );
