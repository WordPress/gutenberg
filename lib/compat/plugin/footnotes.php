<?php
/**
 * Compatibility shim for the footnotes block to enable test passing while awaiting the tested code to be merged to core.
 *
 * See https://github.com/WordPress/gutenberg/pull/52988.
 *
 * Once merged, this shim can be removed.
 *
 * @package gutenberg
 */

/**
 * Remove footnote revision hooks when plugin is running on a version of core that already supports meta revisions.
 */
if ( function_exists( 'wp_post_revision_meta_keys' ) ) {
	if ( has_action( 'rest_after_insert_post', 'wp_add_footnotes_revisions_to_post_meta' ) ) {
		remove_action( 'rest_after_insert_post', 'wp_add_footnotes_revisions_to_post_meta' );
	}
	if ( has_action( 'rest_after_insert_page', 'wp_add_footnotes_revisions_to_post_meta' ) ) {
		remove_action( 'rest_after_insert_page', 'wp_add_footnotes_revisions_to_post_meta' );
	}
	if ( has_action( 'wp_after_insert_post', 'wp_save_footnotes_meta' ) ) {
		remove_action( 'wp_after_insert_post', 'wp_save_footnotes_meta' );
	}
	if ( has_action( '_wp_put_post_revision', 'wp_keep_footnotes_revision_id' ) ) {
		remove_action( '_wp_put_post_revision', 'wp_keep_footnotes_revision_id' );
	}
	if ( has_action( 'wp_restore_post_revision', 'wp_restore_footnotes_from_revision' ) ) {
		remove_action( 'wp_restore_post_revision', 'wp_restore_footnotes_from_revision' );
	}
	if ( has_action( 'wp_creating_autosave', '_wp_rest_api_autosave_meta' ) ) {
		remove_action( 'wp_creating_autosave', '_wp_rest_api_autosave_meta' );
	}
	if ( has_action( '_wp_put_post_revision', '_wp_rest_api_autosave_meta' ) ) {
		remove_action( '_wp_put_post_revision', '_wp_rest_api_autosave_meta' );
	}
	if ( has_filter( 'rest_pre_insert_post', '_wp_rest_api_force_autosave_difference' ) ) {
		remove_filter( 'rest_pre_insert_post', '_wp_rest_api_force_autosave_difference' );
	}
} else {
	/**
	 * For versions of core that don't support meta revisions, use hooks to add.
	 */
	if ( ! function_exists( 'wp_save_footnotes_meta' ) ) {
		/**
		 * Saves the footnotes meta value to the revision.
		 *
		 * @since 6.3.0
		 * @since 6.4.0 Core added post meta revisions, so this is no longer needed.
		 *
		 * @param int $revision_id The revision ID.
		 */
		function wp_save_footnotes_meta( $revision_id ) {
			$post_id = wp_is_post_revision( $revision_id );

			if ( $post_id ) {
				$footnotes = get_post_meta( $post_id, 'footnotes', true );

				if ( $footnotes ) {
					// Can't use update_post_meta() because it doesn't allow revisions.
					update_metadata( 'post', $revision_id, 'footnotes', wp_slash( $footnotes ) );
				}
			}
		}
		if ( ! function_exists( 'wp_post_revision_meta_keys' ) ) {
			add_action( 'wp_after_insert_post', 'wp_save_footnotes_meta' );
		}
	}

	if ( ! function_exists( 'wp_keep_footnotes_revision_id' ) ) {
		/**
		 * Keeps track of the revision ID for "rest_after_insert_{$post_type}".
		 *
		 * @since 6.3.0
		 * @since 6.4.0 Core added post meta revisions, so this is no longer needed.
		 *
		 * @global int $wp_temporary_footnote_revision_id The footnote revision ID.
		 *
		 * @param int $revision_id The revision ID.
		 */
		function wp_keep_footnotes_revision_id( $revision_id ) {
			global $wp_temporary_footnote_revision_id;
			$wp_temporary_footnote_revision_id = $revision_id;
		}
		if ( ! function_exists( 'wp_post_revision_meta_keys' ) ) {
			add_action( '_wp_put_post_revision', 'wp_keep_footnotes_revision_id' );
		}
	}

	if ( ! function_exists( 'wp_add_footnotes_revisions_to_post_meta' ) ) {

		/**
		 * This is a specific fix for the REST API. The REST API doesn't update
		 * the post and post meta in one go (through `meta_input`). While it
		 * does fix the `wp_after_insert_post` hook to be called correctly after
		 * updating meta, it does NOT fix hooks such as post_updated and
		 * save_post, which are normally also fired after post meta is updated
		 * in `wp_insert_post()`. Unfortunately, `wp_save_post_revision` is
		 * added to the `post_updated` action, which means the meta is not
		 * available at the time, so we have to add it afterwards through the
		 * `"rest_after_insert_{$post_type}"` action.
		 *
		 * @since 6.3.0
		 * @since 6.4.0 Core added post meta revisions, so this is no longer needed.
		 *
		 * @global int $wp_temporary_footnote_revision_id The footnote revision ID.
		 *
		 * @param WP_Post $post The post object.
		 */
		function wp_add_footnotes_revisions_to_post_meta( $post ) {
			global $wp_temporary_footnote_revision_id;

			if ( $wp_temporary_footnote_revision_id ) {
				$revision = get_post( $wp_temporary_footnote_revision_id );

				if ( ! $revision ) {
					return;
				}

				$post_id = $revision->post_parent;

				// Just making sure we're updating the right revision.
				if ( $post->ID === $post_id ) {
					$footnotes = get_post_meta( $post_id, 'footnotes', true );

					if ( $footnotes ) {
						// Can't use update_post_meta() because it doesn't allow revisions.
						update_metadata( 'post', $wp_temporary_footnote_revision_id, 'footnotes', wp_slash( $footnotes ) );
					}
				}
			}
		}

		if ( ! function_exists( 'wp_post_revision_meta_keys' ) ) {
			add_action( 'rest_after_insert_post', 'wp_add_footnotes_revisions_to_post_meta' );
			add_action( 'rest_after_insert_page', 'wp_add_footnotes_revisions_to_post_meta' );
		}
	}

	if ( ! function_exists( 'wp_restore_footnotes_from_revision' ) ) {

		/**
		 * Restores the footnotes meta value from the revision.
		 *
		 * @since 6.3.0
		 * @since 6.4.0 Core added post meta revisions, so this is no longer needed.
		 *
		 * @param int $post_id     The post ID.
		 * @param int $revision_id The revision ID.
		 */
		function wp_restore_footnotes_from_revision( $post_id, $revision_id ) {
			$footnotes = get_post_meta( $revision_id, 'footnotes', true );

			if ( $footnotes ) {
				update_post_meta( $post_id, 'footnotes', wp_slash( $footnotes ) );
			} else {
				delete_post_meta( $post_id, 'footnotes' );
			}
		}
		if ( ! function_exists( 'wp_post_revision_meta_keys' ) ) {
			add_action( 'wp_restore_post_revision', 'wp_restore_footnotes_from_revision', 10, 2 );
		}
	}

	if ( ! function_exists( '_wp_rest_api_autosave_meta' ) ) {

		/**
		 * The REST API autosave endpoint doesn't save meta, so we can use the
		 * `wp_creating_autosave` when it updates an exiting autosave, and
		 * `_wp_put_post_revision` when it creates a new autosave.
		 *
		 * @since 6.3.0
		 * @since 6.4.0 Core added post meta revisions, so this is no longer needed.
		 *
		 * @param int|array $autosave The autosave ID or array.
		 */
		function _wp_rest_api_autosave_meta( $autosave ) {
			// Ensure it's a REST API request.
			if ( ! defined( 'REST_REQUEST' ) || ! REST_REQUEST ) {
				return;
			}

			$body = rest_get_server()->get_raw_data();
			$body = json_decode( $body, true );

			if ( ! isset( $body['meta']['footnotes'] ) ) {
				return;
			}

			// `wp_creating_autosave` passes the array,
			// `_wp_put_post_revision` passes the ID.
			$id = is_int( $autosave ) ? $autosave : $autosave['ID'];

			if ( ! $id ) {
				return;
			}

			// Can't use update_post_meta() because it doesn't allow revisions.
			update_metadata( 'post', $id, 'footnotes', wp_slash( $body['meta']['footnotes'] ) );
		}

		if ( ! function_exists( 'wp_post_revision_meta_keys' ) ) {
			// See https://github.com/WordPress/wordpress-develop/blob/2103cb9966e57d452c94218bbc3171579b536a40/src/wp-includes/rest-api/endpoints/class-wp-rest-autosaves-controller.php#L391C1-L391C1.
			add_action( 'wp_creating_autosave', '_wp_rest_api_autosave_meta' );
			// See https://github.com/WordPress/wordpress-develop/blob/2103cb9966e57d452c94218bbc3171579b536a40/src/wp-includes/rest-api/endpoints/class-wp-rest-autosaves-controller.php#L398.
			// Then https://github.com/WordPress/wordpress-develop/blob/2103cb9966e57d452c94218bbc3171579b536a40/src/wp-includes/revision.php#L367.
			add_action( '_wp_put_post_revision', '_wp_rest_api_autosave_meta' );
		}
	}

	if ( ! function_exists( '_wp_rest_api_force_autosave_difference' ) ) {

		/**
		 * This is a workaround for the autosave endpoint returning early if the
		 * revision field are equal. The problem is that "footnotes" is not real
		 * revision post field, so there's nothing to compare against.
		 *
		 * This trick sets the "footnotes" field (value doesn't matter), which will
		 * cause the autosave endpoint to always update the latest revision. That should
		 * be fine, it should be ok to update the revision even if nothing changed. Of
		 * course, this is temporary fix.
		 *
		 * @since 6.3.0
		 * @since 6.4.0 Core added post meta revisions, so this is no longer needed.
		 *
		 * @param WP_Post         $prepared_post The prepared post object.
		 * @param WP_REST_Request $request       The request object.
		 *
		 * See https://github.com/WordPress/wordpress-develop/blob/2103cb9966e57d452c94218bbc3171579b536a40/src/wp-includes/rest-api/endpoints/class-wp-rest-autosaves-controller.php#L365-L384.
		 * See https://github.com/WordPress/wordpress-develop/blob/2103cb9966e57d452c94218bbc3171579b536a40/src/wp-includes/rest-api/endpoints/class-wp-rest-autosaves-controller.php#L219.
		 */
		function _wp_rest_api_force_autosave_difference( $prepared_post, $request ) {
			// We only want to be altering POST requests.
			if ( $request->get_method() !== 'POST' ) {
				return $prepared_post;
			}

			// Only alter requests for the '/autosaves' route.
			if ( substr( $request->get_route(), -strlen( '/autosaves' ) ) !== '/autosaves' ) {
				return $prepared_post;
			}

			$prepared_post->footnotes = '[]';
			return $prepared_post;
		}
		if ( ! function_exists( 'wp_post_revision_meta_keys' ) ) {
			add_filter( 'rest_pre_insert_post', '_wp_rest_api_force_autosave_difference', 10, 2 );
		}
	}
}
