<?php
/**
 * Bootstraps synchronization (collaborative editing).
 *
 * @package gutenberg
 */

/**
 * Registers REST API routes for collaborative editing.
 */
function gutenberg_rest_api_register_routes_for_collaborative_editing(): void {
	$sync_storage = new Gutenberg_Sync_Post_Meta_Storage();
	$sync_storage->init();

	$sse_sync_server = new Gutenberg_HTTP_Polling_Sync_Server( $sync_storage );
	$sse_sync_server->init();
}
add_action( 'init', 'gutenberg_rest_api_register_routes_for_collaborative_editing' );

/**
 * Registers post meta for persisting CRDT documents.
 */
function gutenberg_rest_api_crdt_post_meta() {
	// This string must match WORDPRESS_META_KEY_FOR_CRDT_DOC_PERSISTENCE in @wordpress/sync.
	$persisted_crdt_post_meta_key = '_crdt_document';

	register_meta(
		'post',
		$persisted_crdt_post_meta_key,
		array(
			'auth_callback'     => function ( bool $_allowed, string $_meta_key, int $object_id, int $user_id ): bool {
				return user_can( $user_id, 'edit_post', $object_id );
			},
			// IMPORTANT: Revisions must be disabled because we always want to preserve
			// the latest persisted CRDT document, even when a revision is restored.
			// This ensures that we can continue to apply updates to a shared document
			// and peers can simply merge the restored revision like any other incoming
			// update.
			//
			// If we want to persist CRDT documents alongisde revisions in the
			// future, we should do so in a separate meta key.
			'revisions_enabled' => false,
			'show_in_rest'      => true,
			'single'            => true,
			'type'              => 'string',
		)
	);
}
add_action( 'init', 'gutenberg_rest_api_crdt_post_meta', 999, 0 );

/**
 * Registers the real-time collaboration setting.
 */
function gutenberg_register_real_time_collaboration_setting() {
	$option_name = 'gutenberg_enable_real_time_collaboration';

	register_setting(
		'writing',
		$option_name,
		array(
			'type'              => 'boolean',
			'description'       => __( 'Enable Real-Time Collaboration', 'gutenberg' ),
			'sanitize_callback' => 'rest_sanitize_boolean',
			'default'           => false,
			'show_in_rest'      => true,
		)
	);

	add_settings_field(
		$option_name,
		__( 'Collaboration', 'gutenberg' ),
		function () use ( $option_name ) {
			$option_value = get_option( $option_name );

			?>
			<label for="gutenberg_enable_real_time_collaboration">
			<input name="gutenberg_enable_real_time_collaboration" type="checkbox" id="gutenberg_enable_real_time_collaboration" value="1" <?php checked( '1', $option_value ); ?>/>
				<?php _e( 'Enable real-time collaboration', 'gutenberg' ); ?>
			</label>
			<?php
		},
		'writing'
	);
}
add_action( 'admin_init', 'gutenberg_register_real_time_collaboration_setting' );

/**
 * Injects the real-time collaboration setting for the sync package.
 */
function gutenberg_inject_real_time_collaboration_setting() {
	if ( get_option( 'gutenberg_enable_real_time_collaboration' ) ) {
		wp_add_inline_script(
			'wp-sync',
			'window.__wpSyncEnabled = true;',
			'after'
		);
	}
}
add_action( 'admin_init', 'gutenberg_inject_real_time_collaboration_setting' );

/**
 * Saves CRDT post meta on autosave requests. Autosaves are sometimes applied to
 * the post itself instead of a revision:
 *
 * https://github.com/WordPress/wordpress-develop/blob/dc62ecbc345ca1b8d1801eca794d71755b7568f1/src/wp-includes/rest-api/endpoints/class-wp-rest-autosaves-controller.php#L235-L244
 *
 * When this happens, the special post meta handling in `create_post_autosave` is
 * not called. We do it manually in this filter before the response is returned.
 *
 * @param WP_REST_Response $response The response object.
 * @param WP_Post          $post     The post object.
 * @param WP_REST_Request  $request  The request object.
 * @return WP_REST_Response Modified response object.
 */
function gutenberg_add_crdt_meta_on_autosave( WP_REST_Response $response, WP_Post $post, WP_REST_Request $request ) {
	// Ensure that this is an autosave request.
	if ( ! defined( 'DOING_AUTOSAVE' ) || true !== constant( 'DOING_AUTOSAVE' ) ) {
		return $response;
	}

	// Get the persisted CRDT meta from the request.
	$meta  = $request->get_param( 'meta' );
	$key   = '_crdt_document'; // Must match the key registered in gutenberg_rest_api_crdt_post_meta().
	$value = $meta[ $key ] ?? '';

	if ( empty( $value ) ) {
		return $response;
	}

	update_post_meta( $post->ID, $key, $value );

	// Update the response.
	$data         = $response->get_data();
	$data['meta'] = array_merge( $data['meta'] ?? array(), array( $key => $value ) );
	$response->set_data( $data );

	return $response;
}
add_filter( 'rest_prepare_autosave', 'gutenberg_add_crdt_meta_on_autosave', 10, 3 );

/**
 * Overrides the default REST controller for autosaves to fix real-time
 * collaboration on draft posts.
 *
 * When RTC is enabled, draft autosaves from all users update the post directly
 * instead of creating per-user autosave revisions depending on post lock and
 * assigned author.
 *
 * Only overrides when autosave_rest_controller_class is not explicitly set,
 * i.e. when WP_REST_Autosaves_Controller would be used by default. Post types
 * with their own specialized autosave controller (e.g. templates) are left alone.
 */
function gutenberg_override_autosaves_rest_controller( $args ) {
	if ( empty( $args['autosave_rest_controller_class'] ) ) {
		$args['autosave_rest_controller_class'] = 'Gutenberg_REST_Autosaves_Controller';
	}
	return $args;
}

add_filter( 'register_post_type_args', 'gutenberg_override_autosaves_rest_controller', 10, 1 );
