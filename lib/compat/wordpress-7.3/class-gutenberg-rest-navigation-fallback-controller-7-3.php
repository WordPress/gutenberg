<?php
/**
 * REST API: Gutenberg_REST_Navigation_Fallback_Controller_7_3 class
 *
 * @package gutenberg
 */

/**
 * Navigation fallback REST controller before WordPress 7.3.
 *
 * Checks the `wp_navigation` post type's own capabilities, so that users who
 * can manage block Navigation Menus can get or create a fallback menu without
 * `edit_theme_options`.
 *
 * @see WP_REST_Navigation_Fallback_Controller
 */
class Gutenberg_REST_Navigation_Fallback_Controller_7_3 extends WP_REST_Navigation_Fallback_Controller {

	/**
	 * Checks if a given request has access to read fallbacks.
	 *
	 * @since 6.3.0
	 * @since 7.3.0 Checks the `wp_navigation` post type's `publish_posts`
	 *              capability instead of `edit_theme_options` and `edit_posts`.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has read access, WP_Error object otherwise.
	 */
	public function get_item_permissions_check( $request ) {
		// The parent's `$post_type` property is private.
		$post_type = get_post_type_object( 'wp_navigation' );

		/*
		 * Getting a fallback can create a published `wp_navigation` post, so
		 * both the create and publish capabilities are required.
		 *
		 * This deliberately no longer requires `edit_theme_options` or the
		 * general `edit_posts` capability, as Core's check does before 7.3.
		 * Users who can manage block Navigation Menus, but not theme options
		 * or posts, can then get a fallback menu.
		 */
		if (
			! current_user_can( $post_type->cap->create_posts ) ||
			! current_user_can( $post_type->cap->publish_posts )
		) {
			return new WP_Error(
				'rest_cannot_create',
				__( 'Sorry, you are not allowed to create Navigation Menus as this user.', 'gutenberg' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		if ( 'edit' === $request['context'] && ! current_user_can( $post_type->cap->edit_posts ) ) {
			return new WP_Error(
				'rest_forbidden_context',
				__( 'Sorry, you are not allowed to edit Navigation Menus as this user.', 'gutenberg' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}
}
