<?php
/**
 * Functions to support collaboration.
 *
 * @package gutenberg
 */

if ( ! function_exists( 'register_post_meta_for_collab_comment' ) ) {
	/**
	 * Registers the collab meta field required for comments to work.
	 *
	 * @since // TODO: Add version number.
	 */
	function register_post_meta_for_collab_comment() {
		$post_types = get_post_types( array( 'show_in_rest' => true ) );

		foreach ( $post_types as $post_type ) {
			// Only register the meta field if the post type supports the editor, custom fields, and revisions.
			if (
				post_type_supports( $post_type, 'editor' ) &&
				post_type_supports( $post_type, 'custom-fields' ) &&
				post_type_supports( $post_type, 'revisions' )
			) {
				register_post_meta(
					$post_type,
					'collab',
					array(
						'show_in_rest'      => true,
						'single'            => true,
						'type'              => 'string',
						'revisions_enabled' => true,
					)
				);
			}
		}
	}
}

/*
 * Most post types are registered at priority 10, so use priority 20 here in
 * order to catch them.
*/
add_action( 'init', 'register_post_meta_for_collab_comment', 20 );
