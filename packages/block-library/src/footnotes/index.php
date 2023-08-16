<?php
/**
 * Server-side rendering of the `core/footnotes` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/footnotes` block on the server.
 *
 * @since 6.3.0
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 *
 * @return string Returns the HTML representing the footnotes.
 */
function render_block_core_footnotes( $attributes, $content, $block ) {
	// Bail out early if the post ID is not set for some reason.
	if ( empty( $block->context['postId'] ) ) {
		return '';
	}

	if ( post_password_required( $block->context['postId'] ) ) {
		return;
	}

	$footnotes = get_post_meta( $block->context['postId'], 'footnotes', true );

	if ( ! $footnotes ) {
		return;
	}

	$footnotes = json_decode( $footnotes, true );

	if ( ! is_array( $footnotes ) || count( $footnotes ) === 0 ) {
		return '';
	}

	$wrapper_attributes = get_block_wrapper_attributes();

	$block_content = '';

	foreach ( $footnotes as $footnote ) {
		$block_content .= sprintf(
			'<li id="%1$s">%2$s <a href="#%1$s-link">↩︎</a></li>',
			$footnote['id'],
			$footnote['content']
		);
	}

	return sprintf(
		'<ol %1$s>%2$s</ol>',
		$wrapper_attributes,
		$block_content
	);
}

/**
 * Registers the `core/footnotes` block on the server.
 *
 * @since 6.3.0
 */
function register_block_core_footnotes() {
	foreach ( array( 'post', 'page' ) as $post_type ) {
		register_post_meta(
			$post_type,
			'footnotes',
			array(
				'show_in_rest' => true,
				'single'       => true,
				'type'         => 'string',
			)
		);
	}
	register_block_type_from_metadata(
		__DIR__ . '/footnotes',
		array(
			'render_callback' => 'render_block_core_footnotes',
		)
	);
}
add_action( 'init', 'register_block_core_footnotes' );

/**
 * Saves the footnotes meta value to the revision.
 *
 * @since 6.3.0
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
add_action( 'wp_after_insert_post', 'wp_save_footnotes_meta' );

/**
 * Keeps track of the revision ID for "rest_after_insert_{$post_type}".
 *
 * @since 6.3.0
 *
 * @global int $wp_temporary_footnote_revision_id The footnote revision ID.
 *
 * @param int $revision_id The revision ID.
 */
function wp_keep_footnotes_revision_id( $revision_id ) {
	global $wp_temporary_footnote_revision_id;
	$wp_temporary_footnote_revision_id = $revision_id;
}
add_action( '_wp_put_post_revision', 'wp_keep_footnotes_revision_id' );

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

add_action( 'rest_after_insert_post', 'wp_add_footnotes_revisions_to_post_meta' );
add_action( 'rest_after_insert_page', 'wp_add_footnotes_revisions_to_post_meta' );

/**
 * Restores the footnotes meta value from the revision.
 *
 * @since 6.3.0
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
add_action( 'wp_restore_post_revision', 'wp_restore_footnotes_from_revision', 10, 2 );

/**
 * Adds the footnotes field to the revision.
 *
 * @since 6.3.0
 *
 * @param array $fields The revision fields.
 * @return array The revision fields.
 */
function wp_add_footnotes_to_revision( $fields ) {
	$fields['footnotes'] = __( 'Footnotes' );
	return $fields;
}
add_filter( '_wp_post_revision_fields', 'wp_add_footnotes_to_revision' );

/**
 * Gets the footnotes field from the revision.
 *
 * @since 6.3.0
 *
 * @param string $revision_field The field value, but $revision->$field
 *                               (footnotes) does not exist.
 * @param string $field          The field name, in this case "footnotes".
 * @param object $revision       The revision object to compare against.
 * @return string The field value.
 */
function wp_get_footnotes_from_revision( $revision_field, $field, $revision ) {
	return get_metadata( 'post', $revision->ID, $field, true );
}
add_filter( '_wp_post_revision_field_footnotes', 'wp_get_footnotes_from_revision', 10, 3 );

/**
 * The REST API autosave endpoint doesn't save meta, so we can use the
 * `wp_creating_autosave` when it updates an exiting autosave, and
 * `_wp_put_post_revision` when it creates a new autosave.
 *
 * @since 6.3.0
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

	update_post_meta( $id, 'footnotes', wp_slash( $body['meta']['footnotes'] ) );
}
// See https://github.com/WordPress/wordpress-develop/blob/2103cb9966e57d452c94218bbc3171579b536a40/src/wp-includes/rest-api/endpoints/class-wp-rest-autosaves-controller.php#L391C1-L391C1.
add_action( 'wp_creating_autosave', '_wp_rest_api_autosave_meta' );
// See https://github.com/WordPress/wordpress-develop/blob/2103cb9966e57d452c94218bbc3171579b536a40/src/wp-includes/rest-api/endpoints/class-wp-rest-autosaves-controller.php#L398.
// Then https://github.com/WordPress/wordpress-develop/blob/2103cb9966e57d452c94218bbc3171579b536a40/src/wp-includes/revision.php#L367.
add_action( '_wp_put_post_revision', '_wp_rest_api_autosave_meta' );

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

add_filter( 'rest_pre_insert_post', '_wp_rest_api_force_autosave_difference', 10, 2 );

/**
 * Parses footnotes values for unescaped quotes and replaces with "&quot;".
 *
 * @param string $meta_value  Footnotes metavalue.
 * @return string|array The parsed footnotes.
 */
function _wp_footnotes_sanitize_saved_metadata( $meta_value ) {
	if ( ! json_decode( $meta_value, true ) ) {

		$re = '/{"content":([^{}]+),"id":([^{}]+)/';

		preg_match_all( $re, $meta_value, $matches, PREG_SET_ORDER, 0 );

		if ( ! is_array( $matches ) ) {
			return $meta_value;
		}

		$json_array = array();

		foreach ( $matches as $match_value ) {
			$footnote_array = array();
			$content_value  = preg_replace( '/^(")(.+)(")$/', '${2}', $match_value[1] );
			$id_value       = preg_replace( '/^(")(.+)(")$/', '${2}', $match_value[2] );
			$content_value  = preg_replace( '/\\\\/', '', $content_value );
			// Can't use wp_slash because frontend will render apostrophes as \”.
			// So we substitute with &quot; instead.
			$content_value = preg_replace( '/"/', '&quot;', $content_value );
			if ( ! empty( $match_value[1] ) && ! empty( $match_value[2] ) ) {
				$footnote_array['content'] = $content_value;
				$footnote_array['id']      = $id_value;
				$json_array[]              = $footnote_array;
			}
		}

		if ( ! empty( $json_array ) ) {
			return wp_json_encode( $json_array );
		}
	}
	return $meta_value;
}

/**
 * Short-circuits the return value of a footnotes meta field,
 * and tests if its valid JSON.
 *
 * @param mixed  $value The value to return, either a single metadata value or an array
 *                           of values depending on the value of `$single`. Default null.
 * @param int    $object_id ID of the object metadata is for.
 * @param string $meta_key Metadata key.
 * @return mixed
 */
function _wp_footnotes_get_post_metadata( $value, $object_id, $meta_key ) {
	if ( 'footnotes' !== $meta_key ) {
		return $value;
	}
	// Avoid infinite recursion.
	remove_filter( current_filter(), __FUNCTION__ );

	$value = get_metadata( 'post', $object_id, 'footnotes', true );

	return _wp_footnotes_sanitize_saved_metadata( $value );
}

add_filter( 'get_post_metadata', '_wp_footnotes_get_post_metadata', 10, 5 );

/**
 * Filters the post data for a REST API response.
 *
 * @param WP_REST_Response $response The response object.
 * @return WP_REST_Response Modified response object.
 */
function _wp_footnotes_rest_prepare_post( $response ) {
	$data = $response->get_data();
	if ( isset( $data['meta']['footnotes'] ) && ! empty( isset( $data['meta']['footnotes'] ) ) ) {
		$data['meta']['footnotes'] = _wp_footnotes_sanitize_saved_metadata( $data['meta']['footnotes'] );
		$response->set_data( $data );
		return $response;
	}
	return $response;
}

add_filter( 'rest_prepare_post', '_wp_footnotes_rest_prepare_post', 10, 3 );
