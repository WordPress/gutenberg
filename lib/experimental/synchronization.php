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
add_action( 'init', 'gutenberg_rest_api_crdt_post_meta' );
