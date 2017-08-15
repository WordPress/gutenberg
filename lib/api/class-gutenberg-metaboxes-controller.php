<?php
/**
 * REST API endpoint to render and (eventually) update metabox content.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

/**
 * Controller class for metaboxes API endpoint.
 */
class Gutenberg_Metaboxes_Controller {
	/**
	 * Register REST API routes.
	 */
	public static function register_routes() {
		register_rest_route( 'gutenberg/v1', '/metaboxes', array(
			array(
				'methods'             => WP_REST_Server::READABLE,
				'permission_callback' => array( __CLASS__, 'get_items_permissions_check' ),
				'callback'            => array( __CLASS__, 'get_items' ),
				'args'                => array(
					'post_id' => array(
						'description' => __(
							'The ID of the post for which to fetch metaboxes.',
							'gutenberg'
						),
						'type'        => 'integer',
					),
				),
			),
		) );
	}

	/**
	 * Check permissions for reading metaboxes.  Requires `edit_post` for the
	 * requested post.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return bool|WP_Error True if the request has read access for the item, WP_Error object otherwise.
	 */
	public static function get_items_permissions_check( $request ) {
		$post = get_post( $request['post_id'] );
		if ( ! $post ) {
			return new WP_Error(
				'rest_post_invalid_id',
				__( 'Invalid post ID.', 'gutenberg' ),
				array(
					'status' => 404,
				)
			);
		}

		$post_type = get_post_type_object( $post->post_type );
		$allowed_post_types = get_post_types( array(
			'show_in_rest' => true,
		) );
		if ( ! in_array( $post_type->name, $allowed_post_types, true ) ) {
			return new WP_Error(
				'rest_post_invalid_type',
				__( 'Invalid post type.', 'gutenberg' ),
				array(
					'status' => 404,
				)
			);
		}

		if ( current_user_can( $post_type->cap->edit_post, $post->ID ) ) {
			return true;
		}

		return false;
	}

	/**
	 * Returns information about metaboxes for the requested post.
	 *
	 * Plugins that add metaboxes along with their timing:
	 *
	 * advanced-custom-fields
	 * ======================
	 * An 'admin_enqueue_scripts' callback (priority 10) verifies that `$pagenow`
	 * is `post.php` or `post-new.php`, then adds an 'admin_head' callback which
	 * calls add_meta_box().
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return array Information about metaboxes for the requested post.
	 */
	public static function get_items( $request ) {
		$post = get_post( $request['post_id'] );
		$output = array();

		// advanced-custom-fields doesn't do anything unless is_admin().
		define( 'WP_ADMIN', true );

		// advanced-custom-fields doesn't register metaboxes without these.
		$GLOBALS['pagenow'] = 'post.php';
		$GLOBALS['typenow'] = $post->post_type;

		// Load wp-admin APIs and functions.  This shouldn't produce any
		// output, but we can collect it just in case and verify during
		// testing.
		ob_start();
		require_once ABSPATH . 'wp-admin/includes/admin.php';
		$output['include_admin'] = ob_get_clean();

		// Capture output produced by the following actions.
		// TODO: Collect more specific info about enqueued assets.
		ob_start();

		/*
		 * Normally called via wp-admin/post.php ->
		 * wp-admin/edit-form-advanced.php -> wp-admin/admin-header.php
		 */
		do_action( 'admin_enqueue_scripts', 'post.php' );
		do_action( 'admin_print_styles-post.php' );
		do_action( 'admin_print_styles' );
		do_action( 'admin_print_scripts-post.php' );
		do_action( 'admin_print_scripts' );
		do_action( 'admin_head-post.php' );
		do_action( 'admin_head' );

		$output['admin_head'] = ob_get_clean();

		/*
		 * Adapted from code in wp-admin/edit-form-advanced.php:
		 * do_action( 'do_meta_boxes', $post_type, {'normal','advanced','side'}, $post );
		 * do_meta_boxes( $post_type, 'side', $post );
		 * do_meta_boxes( null, 'normal', $post );
		 * do_meta_boxes( null, 'advanced', $post );
		 */
		foreach ( array( 'normal', 'advanced', 'side' ) as $location ) {
			ob_start();
			do_action(
				'do_meta_boxes',
				$post->post_type,
				$location,
				$post
			);
			do_meta_boxes(
				'side' === $location ? $post->post_type : null,
				$location,
				$post
			);
			$output[ $location ] = ob_get_clean();
		}

		// TODO wp-admin/post.php -> wp-admin/admin-footer.php ?
		; // Just for you, phpcs.

		return array(
			'html' => $output,
		);
	}
}

add_action(
	'rest_api_init',
	array( 'Gutenberg_Metaboxes_Controller', 'register_routes' )
);
