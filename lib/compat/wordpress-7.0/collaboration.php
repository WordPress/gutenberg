<?php
/**
 * Bootstraps collaborative editing.
 *
 * @package gutenberg
 */

if ( ! class_exists( 'WP_Sync_Post_Meta_Storage' ) ) {
	require_once __DIR__ . '/interface-wp-sync-storage.php';
	require_once __DIR__ . '/class-wp-sync-post-meta-storage.php';
	require_once __DIR__ . '/class-wp-http-polling-sync-server.php';
}

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
	}
	add_action( 'rest_api_init', 'gutenberg_register_collaboration_rest_routes' );
}

if ( ! function_exists( 'wp_collaboration_register_meta' ) ) {
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
				'auth_callback'     => static function ( bool $_allowed, string $_meta_key, int $object_id, int $user_id ): bool {
					return user_can( $user_id, 'edit_post', $object_id );
				},
				/*
				 * Revisions must be disabled because we always want to preserve
				 * the latest persisted CRDT document, even when a revision is restored.
				 * This ensures that we can continue to apply updates to a shared document
				 * and peers can simply merge the restored revision like any other incoming
				 * update.
				 *
				 * If we want to persist CRDT documents alongside revisions in the
				 * future, we should do so in a separate meta key.
				 */
				'revisions_enabled' => false,
				'show_in_rest'      => true,
				'single'            => true,
				'type'              => 'string',
			)
		);
	}
	add_action( 'init', 'gutenberg_rest_api_crdt_post_meta' );
}

if ( ! function_exists( 'wp_collaboration_inject_setting' ) ) {
	/**
	 * Registers the real-time collaboration setting.
	 */
	function gutenberg_register_real_time_collaboration_setting() {
		$option_name = 'wp_enable_real_time_collaboration';

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
				<label for="wp_enable_real_time_collaboration">
					<input name="wp_enable_real_time_collaboration" type="checkbox" id="wp_enable_real_time_collaboration" value="1" <?php checked( '1', $option_value ); ?>/>
					<?php _e( 'Enable real-time collaboration', 'gutenberg' ); ?>
				</label>
				<?php
			},
			'writing'
		);
	}
	add_action( 'admin_init', 'gutenberg_register_real_time_collaboration_setting' );
}

/**
 * Injects the real-time collaboration setting into a global variable.
 */
function gutenberg_inject_real_time_collaboration_setting() {
	global $pagenow;

	if ( ! get_option( 'wp_enable_real_time_collaboration' ) ) {
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

	wp_add_inline_script(
		'wp-core-data',
		'window._wpCollaborationEnabled = ' . ( $enabled ? 'true' : 'false' ) . ';',
		'after'
	);
}
add_action( 'admin_init', 'gutenberg_inject_real_time_collaboration_setting' );
add_filter( 'default_option_wp_enable_real_time_collaboration', '__return_true' );

/**
 * Modifies the post list UI and heartbeat responses for real-time collaboration.
 *
 * When RTC is enabled, hides the lock icon and user avatar, replaces the
 * user-specific lock text with "Currently being edited", changes the "Edit"
 * row action to "Join", and re-enables controls that core normally hides
 * for locked posts (since collaborative editing is possible).
 */
function gutenberg_post_list_collaboration_ui() {
	global $pagenow;

	if ( ! get_option( 'wp_enable_real_time_collaboration' ) ) {
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
 * locked.
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
		 */
		.wp-locked .check-column label,
		.wp-locked .check-column input[type="checkbox"] {
			display: revert;
		}
		.wp-locked .row-actions .inline {
			display: revert;
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
 * Filters post row actions to change "Edit" to "Join" for locked posts
 * when real-time collaboration is enabled.
 *
 * @param string[] $actions An array of row action links.
 * @param WP_Post  $post    The post object.
 * @return string[] Modified row action links.
 */
function gutenberg_post_list_collaboration_row_actions( $actions, $post ) {
	if ( ! function_exists( 'wp_check_post_lock' ) ) {
		require_once ABSPATH . 'wp-admin/includes/post.php';
	}

	$lock_holder = wp_check_post_lock( $post->ID );
	if ( ! $lock_holder ) {
		return $actions;
	}

	if ( isset( $actions['edit'] ) ) {
		$actions['edit'] = preg_replace(
			'/>Edit</',
			'>' . esc_html__( 'Join', 'gutenberg' ) . '<',
			$actions['edit']
		);
	}

	return $actions;
}
