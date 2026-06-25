<?php
/**
 * Bootstraps collaborative editing.
 *
 * @package gutenberg
 */

require_once __DIR__ . '/class-wp-sync-config.php';
if ( ! class_exists( 'WP_Sync_Post_Meta_Storage' ) ) {
	require_once __DIR__ . '/interface-wp-sync-storage.php';
	require_once __DIR__ . '/class-wp-sync-post-meta-storage.php';
	require_once __DIR__ . '/class-wp-http-polling-sync-server.php';
}
require_once __DIR__ . '/class-wp-sync-save-server.php';

if ( ! function_exists( 'gutenberg_register_sync_storage_post_type' ) ) {
	/**
	 * Registers the custom post type for sync storage.
	 */
	function gutenberg_register_sync_storage_post_type() {
		register_post_type(
			'wp_sync_storage',
			array(
				'labels'             => array(
					'name'          => __( 'Sync Updates', 'gutenberg' ),
					'singular_name' => __( 'Sync Update', 'gutenberg' ),
				),
				'public'             => false,
				'hierarchical'       => false,
				'capabilities'       => array(
					'read'                   => 'do_not_allow',
					'read_private_posts'     => 'do_not_allow',
					'create_posts'           => 'do_not_allow',
					'publish_posts'          => 'do_not_allow',
					'edit_posts'             => 'do_not_allow',
					'edit_others_posts'      => 'do_not_allow',
					'edit_published_posts'   => 'do_not_allow',
					'delete_posts'           => 'do_not_allow',
					'delete_others_posts'    => 'do_not_allow',
					'delete_published_posts' => 'do_not_allow',
				),
				'map_meta_cap'       => false,
				'publicly_queryable' => false,
				'query_var'          => false,
				'rewrite'            => false,
				'show_in_menu'       => false,
				'show_in_rest'       => false,
				'show_ui'            => false,
				'supports'           => array( 'custom-fields' ),
			)
		);
	}
	add_action( 'init', 'gutenberg_register_sync_storage_post_type' );
}

if ( ! function_exists( 'gutenberg_register_collaboration_rest_routes' ) ) {
	/**
	 * Registers REST API routes for collaborative editing.
	 */
	function gutenberg_register_collaboration_rest_routes(): void {
		$sync_storage = new WP_Sync_Post_Meta_Storage();
		$sync_server  = new WP_HTTP_Polling_Sync_Server( $sync_storage );
		$sync_server->register_routes();

		$sync_save_server = new WP_Sync_Save_Server();
		$sync_save_server->register_routes();
	}
	add_action( 'rest_api_init', 'gutenberg_register_collaboration_rest_routes' );
}

if ( ! function_exists( 'wp_collaboration_register_meta' ) ) {
	/**
	 * Registers post meta for persisting CRDT documents.
	 */
	function gutenberg_rest_api_crdt_post_meta() {
		// This string must match POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE in @wordpress/core-data.
		$persisted_crdt_post_meta_key = '_crdt_document';

		register_meta(
			'post',
			$persisted_crdt_post_meta_key,
			array(
				'auth_callback'     => static function ( bool $_allowed, string $_meta_key, int $object_id, int $user_id ): bool {
					return user_can( $user_id, 'edit_post', $object_id );
				},
				/*
				 * Revisions must be disabled because persisted CRDT documents are
				 * collaboration snapshots rather than revision fields. Restoring a
				 * revision invalidates the snapshot below, so the next collaboration
				 * load rebuilds from the restored raw post fields instead of applying
				 * a CRDT document from newer content.
				 *
				 * If we want to persist CRDT documents alongside revisions in the
				 * future, we should do so in a separate meta key.
				 */
				'revisions_enabled' => false,
				'show_in_rest'      => array(
					'schema' => array(
						'type'    => 'string',
						'context' => array( 'edit' ),
					),
				),
				'single'            => true,
				'type'              => 'string',
			)
		);
	}
	add_action( 'init', 'gutenberg_rest_api_crdt_post_meta' );
}

if ( ! function_exists( 'gutenberg_delete_crdt_document_meta_on_revision_restore' ) ) {
	/**
	 * Deletes persisted CRDT document meta after restoring an older post revision.
	 *
	 * The persisted CRDT document is a snapshot of collaborative state for the
	 * current post content. If an older revision is restored while a newer CRDT
	 * snapshot remains in post meta, the next collaborative load can apply that
	 * newer snapshot and resurrect content that the restore just removed.
	 *
	 * @param int $post_id      Post ID.
	 * @param int $_revision_id Revision ID.
	 */
	function gutenberg_delete_crdt_document_meta_on_revision_restore( int $post_id, int $_revision_id ): void {
		unset( $_revision_id );
		delete_post_meta( $post_id, '_crdt_document' );
	}
	add_action( 'wp_restore_post_revision', 'gutenberg_delete_crdt_document_meta_on_revision_restore', 10, 2 );
}

if ( ! function_exists( 'gutenberg_get_persisted_crdt_document_checksum' ) ) {
	/**
	 * Returns a deterministic checksum for a persisted CRDT document payload.
	 *
	 * This checksum mirrors @wordpress/sync and intentionally versions the
	 * serialized Yjs document payload itself, not the surrounding debugging
	 * metadata.
	 *
	 * @param string $document Base64-encoded Yjs document update.
	 * @return string Document checksum.
	 */
	function gutenberg_get_persisted_crdt_document_checksum( string $document ): string {
		$hash_a = 0x811c9dc5;
		$hash_b = $hash_a ^ 0x9e3779b9;
		$prime  = 0x01000193;
		$length = strlen( $document );

		for ( $i = 0; $i < $length; $i++ ) {
			$char_code = ord( $document[ $i ] );
			$hash_a    = ( ( $hash_a ^ $char_code ) * $prime ) & 0xffffffff;
			$hash_b    = ( ( $hash_b ^ $char_code ^ ( $i & 0xff ) ) * $prime ) & 0xffffffff;
		}

		return $length . ':' . sprintf( '%08x%08x', $hash_a, $hash_b );
	}
}

if ( ! function_exists( 'gutenberg_parse_persisted_crdt_document' ) ) {
	/**
	 * Parses a persisted CRDT document post meta value.
	 *
	 * @param mixed $value Post meta value.
	 * @return array|null Parsed CRDT document metadata, or null when invalid.
	 */
	function gutenberg_parse_persisted_crdt_document( $value ): ?array {
		if ( ! is_string( $value ) || '' === $value ) {
			return null;
		}

		$decoded = json_decode( $value, true );
		if ( ! is_array( $decoded ) || ! isset( $decoded['document'] ) || ! is_string( $decoded['document'] ) ) {
			return null;
		}

		return $decoded;
	}
}

if ( ! function_exists( 'gutenberg_get_persisted_crdt_document_version' ) ) {
	/**
	 * Returns the server version represented by a persisted CRDT document value.
	 *
	 * @param mixed $value Post meta value.
	 * @return string|null Version string, or null when the value is invalid.
	 */
	function gutenberg_get_persisted_crdt_document_version( $value ): ?string {
		$decoded = gutenberg_parse_persisted_crdt_document( $value );
		if ( null === $decoded ) {
			return null;
		}

		return 'document:' . gutenberg_get_persisted_crdt_document_checksum( $decoded['document'] );
	}
}

if ( ! function_exists( 'gutenberg_get_persisted_crdt_document_base_version' ) ) {
	/**
	 * Returns the base version submitted with a persisted CRDT document value.
	 *
	 * @param mixed $value Post meta value.
	 * @return string|null Base version, or null when missing.
	 */
	function gutenberg_get_persisted_crdt_document_base_version( $value ): ?string {
		$decoded = gutenberg_parse_persisted_crdt_document( $value );
		if ( null === $decoded || empty( $decoded['baseVersion'] ) || ! is_string( $decoded['baseVersion'] ) ) {
			return null;
		}

		return $decoded['baseVersion'];
	}
}

if ( ! function_exists( 'gutenberg_validate_persisted_crdt_document_base_version' ) ) {
	/**
	 * Validates that an incoming persisted CRDT document is based on the latest
	 * server copy.
	 *
	 * @param int   $post_id    Post ID.
	 * @param mixed $meta_value Incoming post meta value.
	 * @return true|WP_Error True when valid, otherwise an error.
	 */
	function gutenberg_validate_persisted_crdt_document_base_version( int $post_id, $meta_value ) {
		$current_value = get_metadata_raw(
			'post',
			$post_id,
			'_crdt_document',
			true
		);

		if ( ! is_string( $current_value ) || '' === $current_value ) {
			return true;
		}

		$current_version = gutenberg_get_persisted_crdt_document_version( $current_value );
		if ( null === $current_version ) {
			return true;
		}

		$incoming_version = gutenberg_get_persisted_crdt_document_version( $meta_value );
		if ( is_string( $incoming_version ) && hash_equals( $current_version, $incoming_version ) ) {
			return true;
		}

		$base_version = gutenberg_get_persisted_crdt_document_base_version( $meta_value );
		if ( is_string( $base_version ) && hash_equals( $current_version, $base_version ) ) {
			return true;
		}

		return new WP_Error(
			'rest_crdt_document_stale',
			__( 'Could not update the persisted CRDT document because it is stale.', 'gutenberg' ),
			array(
				'currentVersion' => $current_version,
				'status'         => 409,
			)
		);
	}
}

if ( ! function_exists( 'gutenberg_prevent_stale_crdt_document_meta_update' ) ) {
	/**
	 * Rejects stale persisted CRDT document post meta updates.
	 *
	 * @param null|bool $check      Whether to short-circuit the update.
	 * @param int       $object_id  Post ID.
	 * @param string    $meta_key   Meta key.
	 * @param mixed     $meta_value Meta value.
	 * @param mixed     $prev_value Previous meta value.
	 * @return null|bool Whether to short-circuit the update.
	 */
	function gutenberg_prevent_stale_crdt_document_meta_update( $check, int $object_id, string $meta_key, $meta_value, $prev_value ) {
		if ( null !== $check || '_crdt_document' !== $meta_key ) {
			return $check;
		}

		$result = gutenberg_validate_persisted_crdt_document_base_version( $object_id, $meta_value );
		if ( is_wp_error( $result ) ) {
			return false;
		}

		return $check;
	}
	add_filter( 'update_post_metadata', 'gutenberg_prevent_stale_crdt_document_meta_update', 10, 5 );
}

if ( ! function_exists( 'gutenberg_prevent_stale_crdt_document_meta_add' ) ) {
	/**
	 * Rejects stale persisted CRDT document post meta additions.
	 *
	 * This covers the race where update_metadata() observed no existing meta row,
	 * but another request added one before add_metadata() runs.
	 *
	 * @param null|bool $check      Whether to short-circuit the add.
	 * @param int       $object_id  Post ID.
	 * @param string    $meta_key   Meta key.
	 * @param mixed     $meta_value Meta value.
	 * @param bool      $unique     Whether only one value may exist.
	 * @return null|bool Whether to short-circuit the add.
	 */
	function gutenberg_prevent_stale_crdt_document_meta_add( $check, int $object_id, string $meta_key, $meta_value, bool $unique ) {
		if ( null !== $check || '_crdt_document' !== $meta_key ) {
			return $check;
		}

		$current_value = get_metadata_raw(
			'post',
			$object_id,
			'_crdt_document',
			true
		);

		if ( is_string( $current_value ) && '' !== $current_value ) {
			return false;
		}

		return $check;
	}
	add_filter( 'add_post_metadata', 'gutenberg_prevent_stale_crdt_document_meta_add', 10, 5 );
}

if ( ! function_exists( 'gutenberg_reject_stale_crdt_document_rest_update' ) ) {
	/**
	 * Rejects stale persisted CRDT document updates before REST post mutations.
	 *
	 * @param stdClass        $prepared_post Prepared post object.
	 * @param WP_REST_Request $request       Request object.
	 * @return stdClass|WP_Error Prepared post object or conflict error.
	 */
	function gutenberg_reject_stale_crdt_document_rest_update( $prepared_post, WP_REST_Request $request ) {
		$meta     = $request->get_param( 'meta' );
		$meta_key = '_crdt_document';

		if ( ! is_array( $meta ) || ! array_key_exists( $meta_key, $meta ) ) {
			return $prepared_post;
		}

		$post_id = isset( $request['id'] ) ? (int) $request['id'] : 0;
		if ( ! $post_id && isset( $prepared_post->ID ) ) {
			$post_id = (int) $prepared_post->ID;
		}

		if ( ! $post_id ) {
			return $prepared_post;
		}

		$result = gutenberg_validate_persisted_crdt_document_base_version( $post_id, $meta[ $meta_key ] );
		return is_wp_error( $result ) ? $result : $prepared_post;
	}
}

if ( ! function_exists( 'gutenberg_register_crdt_document_rest_conflict_filter' ) ) {
	/**
	 * Registers the REST stale-CRDT guard for a post type.
	 *
	 * @param string       $post_type        Post type name.
	 * @param WP_Post_Type $post_type_object Post type object.
	 */
	function gutenberg_register_crdt_document_rest_conflict_filter( string $post_type, $post_type_object = null ): void {
		static $registered = array();

		if ( isset( $registered[ $post_type ] ) ) {
			return;
		}

		if ( $post_type_object instanceof WP_Post_Type && ! $post_type_object->show_in_rest ) {
			return;
		}

		$registered[ $post_type ] = true;
		add_filter( "rest_pre_insert_{$post_type}", 'gutenberg_reject_stale_crdt_document_rest_update', 10, 2 );
	}
	add_action( 'registered_post_type', 'gutenberg_register_crdt_document_rest_conflict_filter', 10, 2 );
}

if ( ! function_exists( 'gutenberg_register_crdt_document_rest_conflict_filters' ) ) {
	/**
	 * Registers REST stale-CRDT guards for post types already registered.
	 */
	function gutenberg_register_crdt_document_rest_conflict_filters(): void {
		foreach ( get_post_types( array( 'show_in_rest' => true ), 'objects' ) as $post_type => $post_type_object ) {
			gutenberg_register_crdt_document_rest_conflict_filter( $post_type, $post_type_object );
		}
	}
	add_action( 'init', 'gutenberg_register_crdt_document_rest_conflict_filters', 100 );
}

if ( ! function_exists( 'wp_collaboration_inject_setting' ) ) {
	/**
	 * Registers the real-time collaboration setting.
	 */
	function gutenberg_register_real_time_collaboration_setting() {
		$option_name = 'wp_collaboration_enabled';

		register_setting(
			'writing',
			$option_name,
			array(
				'type'              => 'boolean',
				'description'       => __( 'Enable Real-Time Collaboration', 'gutenberg' ),
				'sanitize_callback' => 'rest_sanitize_boolean',
				'default'           => true,
				'show_in_rest'      => true,
			)
		);

		add_settings_field(
			$option_name,
			__( 'Collaboration', 'gutenberg' ),
			function () use ( $option_name ) {
				$option_value = get_option( $option_name );

				if ( wp_is_collaboration_allowed() ) :
					?>
					<label for="wp_collaboration_enabled">
						<input name="wp_collaboration_enabled" type="checkbox" id="wp_collaboration_enabled" value="1" <?php checked( '1', $option_value ); ?>/>
						<?php _e( "Enable early access to real-time collaboration. Real-time collaboration may affect your website's performance.", 'gutenberg' ); ?>
					</label>
				<?php else : ?>
					<div class="notice notice-warning inline">
						<?php
						printf(
								/* translators: %s: Prefix "Note:". */
							'<p>' . __( '%s Real-time collaboration has been disabled.', 'gutenberg' ) . '</p>',
							'<strong>' . __( 'Note:', 'gutenberg' ) . '</strong>'
						);
						?>
					</div>
					<?php
				endif;
			},
			'writing'
		);
	}
	add_action( 'admin_init', 'gutenberg_register_real_time_collaboration_setting' );
}

if ( ! function_exists( 'wp_is_collaboration_enabled' ) ) {
	/**
	 * Determines whether real-time collaboration is enabled.
	 *
	 * If the WP_ALLOW_COLLABORATION constant is false,
	 * collaboration is always disabled regardless of the database option.
	 * Otherwise, falls back to the 'wp_collaboration_enabled' option.
	 *
	 * @since 7.0.0
	 *
	 * @return bool Whether real-time collaboration is enabled.
	 */
	function wp_is_collaboration_enabled() {
		return ( wp_is_collaboration_allowed() && (bool) get_option( 'wp_collaboration_enabled' ) );
	}
}

if ( ! function_exists( 'wp_is_collaboration_allowed' ) ) {
	/**
	 * Determines whether real-time collaboration is allowed.
	 *
	 * If the WP_ALLOW_COLLABORATION constant is false,
	 * collaboration is not allowed and cannot be enabled.
	 * The constant defaults to true, unless the WP_ALLOW_COLLABORATION
	 * environment variable is set to string "false".
	 *
	 * @since 7.0.0
	 *
	 * @return bool Whether real-time collaboration is allowed.
	 */
	function wp_is_collaboration_allowed() {
		if ( ! defined( 'WP_ALLOW_COLLABORATION' ) ) {
			$env_value = getenv( 'WP_ALLOW_COLLABORATION' );
			if ( false === $env_value ) {
				// Environment variable is not defined, default to allowing collaboration.
				define( 'WP_ALLOW_COLLABORATION', true );
			} else {
				/*
				* Environment variable is defined, let's confirm it is actually set to
				* "true" as it may still have a string value "false" – the preceeding
				* `if` branch only tests for the boolean `false`.
				*/
				define( 'WP_ALLOW_COLLABORATION', 'true' === $env_value );
			}
		}

		return WP_ALLOW_COLLABORATION;
	}
}

if ( ! function_exists( 'wp_is_post_type_collaboration_disabled' ) ) {
	/**
	 * Determines whether real-time collaboration is disabled for a post type.
	 *
	 * @since 7.1.0
	 *
	 * @param string $post_type Post type name.
	 * @return bool Whether real-time collaboration is disabled for the post type.
	 */
	function wp_is_post_type_collaboration_disabled( $post_type ) {
		if ( ! post_type_exists( $post_type ) ) {
			return true;
		}

		/**
		 * Filters whether real-time collaboration is disabled for a post type.
		 *
		 * @since 7.1.0
		 *
		 * @param bool   $disabled  Whether real-time collaboration is disabled for the post type.
		 * @param string $post_type Post type name.
		 */
		return (bool) apply_filters( 'wp_is_post_type_collaboration_disabled', false, $post_type );
	}
}

/**
 * Injects the real-time collaboration setting into a global variable.
 *
 * @global string $pagenow The filename of the current screen.
 */
function gutenberg_inject_real_time_collaboration_setting() {
	global $pagenow;

	if ( ! wp_is_collaboration_enabled() ) {
		return;
	}

	// Disable real-time collaboration on the site editor.
	$enabled = true;
	if (
		'site-editor.php' === $pagenow ||
		( 'admin.php' === $pagenow && isset( $_GET['page'] ) && 'site-editor-v2' === $_GET['page'] )
	) {
		$enabled = false;
	}

	$disabled_post_types = array_values(
		array_filter(
			get_post_types( array( 'show_in_rest' => true ) ),
			'wp_is_post_type_collaboration_disabled'
		)
	);

	wp_add_inline_script(
		'wp-core-data',
		'window._wpCollaborationEnabled = ' . wp_json_encode( $enabled ) . ';' .
		'window._wpCollaborationDisabledPostTypes = ' . wp_json_encode( $disabled_post_types ) . ';',
		'after'
	);
}
add_action( 'admin_init', 'gutenberg_inject_real_time_collaboration_setting' );

/**
 * Core adds an option with the default value, so we need to set the option to
 * our intended default when the Gutenberg plugin is activated, provided
 * collaboration is allowed.
 */
function gutenberg_set_collaboration_option_on_activation() {
	if ( wp_is_collaboration_allowed() ) {
		update_option( 'wp_collaboration_enabled', '1' );
	}
}
add_action( 'activate_' . plugin_basename( dirname( __DIR__, 3 ) . '/gutenberg.php' ), 'gutenberg_set_collaboration_option_on_activation' );

/**
 * Modifies the post list UI and heartbeat responses for real-time collaboration.
 *
 * When RTC is enabled, hides the lock icon and user avatar, replaces the
 * user-specific lock text with "Currently being edited", changes the "Edit"
 * row action to "Join", and re-enables controls that core normally hides
 * for locked posts (since collaborative editing is possible).
 *
 * @global string $pagenow The filename of the current screen.
 */
function gutenberg_post_list_collaboration_ui() {
	global $pagenow;

	if ( ! wp_is_collaboration_enabled() ) {
		return;
	}

	// Heartbeat filter applies globally (not just edit.php) since the
	// heartbeat API can fire from any admin page.
	add_filter( 'heartbeat_received', 'gutenberg_filter_locked_posts_heartbeat_for_rtc', 20 );

	// CSS, JS, and row action overrides only apply on the posts list page.
	if ( 'edit.php' !== $pagenow ) {
		return;
	}

	add_action( 'admin_head', 'gutenberg_post_list_collaboration_styles' );
	add_filter( 'gettext', 'gutenberg_filter_locked_post_text_for_rtc', 10, 3 );
	add_filter( 'post_row_actions', 'gutenberg_post_list_collaboration_row_actions', 10, 2 );
	add_filter( 'page_row_actions', 'gutenberg_post_list_collaboration_row_actions', 10, 2 );
}
add_action( 'admin_init', 'gutenberg_post_list_collaboration_ui' );

/**
 * Filters the heartbeat response to remove user-specific lock information
 * when real-time collaboration is enabled.
 *
 * WordPress core's wp_check_locked_posts() runs at priority 10 and populates
 * the 'wp-check-locked-posts' key with user name, avatar, and text. This
 * filter runs at priority 20 to replace that data with a generic message,
 * preventing user-specific lock info from reaching the client.
 *
 * @param array $response The heartbeat response.
 * @return array Modified heartbeat response.
 */
function gutenberg_filter_locked_posts_heartbeat_for_rtc( $response ) {
	if ( ! empty( $response['wp-check-locked-posts'] ) ) {
		foreach ( $response['wp-check-locked-posts'] as $key => $lock_data ) {
			$response['wp-check-locked-posts'][ $key ]['text'] = __( 'Currently being edited', 'gutenberg' );
			unset( $response['wp-check-locked-posts'][ $key ]['avatar_src'] );
			unset( $response['wp-check-locked-posts'][ $key ]['avatar_src_2x'] );
		}
	}

	return $response;
}

/**
 * Outputs CSS to hide the post lock icon and user avatar in the post list
 * when real-time collaboration is enabled.
 *
 * Also re-enables checkboxes and row actions that WordPress core hides for
 * locked posts, since collaborative editing means the post is not exclusively
 * locked. Toggles "Edit" / "Join" action link text via the
 * `.wp-collaborative-editing` class that the heartbeat already manages.
 */
function gutenberg_post_list_collaboration_styles() {
	?>
	<style type="text/css">
		/*
		 * Hide the lock indicator icon in the checkbox column.
		 * WordPress core shows it via .wp-locked .locked-indicator { display: block },
		 * so we match that specificity to override it.
		 */
		.wp-locked .locked-indicator {
			display: none;
		}
		/* Hide the user avatar in the locked info area. */
		.wp-locked .locked-info .locked-avatar {
			display: none;
		}
		/*
		 * Re-enable controls that core hides for locked posts,
		 * since RTC allows collaborative editing.
		 * Must use `tr.wp-locked` to match core's specificity in
		 * list-tables.css and actually override its `display: none`.
		 */
		tr.wp-locked .check-column label,
		tr.wp-locked .check-column input[type="checkbox"] {
			display: revert;
		}
		tr.wp-locked .row-actions .inline {
			display: revert;
		}
		/*
		 * Toggle "Edit" / "Join" action link text based on lock state.
		 * The heartbeat adds/removes .wp-locked on locked rows. This
		 * CSS only runs when RTC is enabled, so .wp-locked here always
		 * means collaborative editing, not exclusive locking.
		 */
		.join-action-text {
			display: none;
		}
		.wp-locked .edit-action-text {
			display: none;
		}
		.wp-locked .join-action-text {
			display: inline;
		}
	</style>
	<?php
}

/**
 * Filters the translation of the lock text to replace user-specific
 * "%s is currently editing" with a generic "Currently being edited"
 * message on initial page render.
 *
 * WordPress core outputs this text server-side in WP_Posts_List_Table.
 * Using a gettext filter replaces it before it reaches the browser,
 * avoiding a flash of the original text.
 *
 * @param string $translation Translated text.
 * @param string $text        Original text to translate.
 * @param string $domain      Text domain.
 * @return string Modified translation.
 */
function gutenberg_filter_locked_post_text_for_rtc( $translation, $text, $domain ) {
	if ( 'default' === $domain && '%s is currently editing' === $text ) {
		return __( 'Currently being edited', 'gutenberg' );
	}

	return $translation;
}

/**
 * Filters post row actions to render both "Edit" and "Join" link text
 * when real-time collaboration is enabled.
 *
 * Both labels are always present in the markup; CSS toggles visibility
 * based on the `.wp-collaborative-editing` class the heartbeat manages.
 * This ensures the link text updates when the lock state changes without
 * requiring a page reload.
 *
 * @param string[] $actions An array of row action links.
 * @param WP_Post  $post    The post object.
 * @return string[] Modified row action links.
 */
function gutenberg_post_list_collaboration_row_actions( $actions, $post ) {
	if ( ! isset( $actions['edit'] ) ) {
		return $actions;
	}

	if ( wp_is_post_type_collaboration_disabled( $post->post_type ) ) {
		return $actions;
	}

	$title = _draft_or_post_title( $post->ID );

	/*
	 * Each state is rendered as `<span class="…-action-text"><a>…</a></span>`.
	 * The toggle classes sit on the outer <span> rather than the <a> so they
	 * fall outside core's responsive selector `.row-actions span a` at
	 * <=782px, which otherwise outranks our class selectors and (a) leaves
	 * both labels visible on unlocked rows and (b) forces `display: inline`
	 * on the visible Join link to misalign with sibling row actions. The
	 * visible label is still a direct text child of <a>, so core's mobile
	 * font-size rule
	 *     .row-actions span   { font-size: 0;  }
	 *     .row-actions span a { font-size: 13px; }
	 * still reaches it — that's the fix for the original "Edit invisible
	 * at 0px on mobile" regression. CSS in
	 * gutenberg_post_list_collaboration_styles() flips visibility on the
	 * outer spans based on the row's `wp-locked` class, which core's
	 * inline-edit-post.js maintains in response to heartbeat ticks.
	 */
	$actions['edit'] = sprintf(
		'<span class="edit-action-text"><a href="%1$s" aria-label="%2$s">%3$s</a></span>'
		. '<span class="join-action-text"><a href="%1$s" aria-label="%4$s">%5$s</a></span>',
		esc_url( get_edit_post_link( $post->ID ) ),
		/* translators: %s: Post title. */
		esc_attr( sprintf( __( 'Edit &#8220;%s&#8221;' ), $title ) ),
		__( 'Edit' ),
		/* translators: %s: Post title. */
		esc_attr( sprintf( __( 'Join editing &#8220;%s&#8221;', 'gutenberg' ), $title ) ),
		/* translators: Action link text for a singular post in the post list. Can be any type of post. */
		_x( 'Join', 'post list', 'gutenberg' )
	);

	return $actions;
}
