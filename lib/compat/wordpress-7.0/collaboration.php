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
 * Modifies the post list UI for real-time collaboration.
 *
 * When RTC is enabled, hides the lock icon and removes the user-specific
 * lock text, replacing it with a generic "Currently being edited" message
 * to reflect that collaborative editing is possible.
 */
function gutenberg_post_list_collaboration_ui() {
	global $pagenow;

	if ( ! get_option( 'wp_enable_real_time_collaboration' ) ) {
		return;
	}

	// Only apply on the posts list page.
	if ( 'edit.php' !== $pagenow ) {
		return;
	}

	add_action( 'admin_head', 'gutenberg_post_list_collaboration_styles' );
	add_action( 'admin_footer', 'gutenberg_post_list_collaboration_scripts' );
}
add_action( 'admin_init', 'gutenberg_post_list_collaboration_ui' );

/**
 * Outputs CSS to hide the post lock icon and user avatar in the post list
 * when real-time collaboration is enabled.
 */
function gutenberg_post_list_collaboration_styles() {
	?>
	<style type="text/css">
		/* Hide the lock indicator icon in the checkbox column. */
		.locked-indicator {
			display: none;
		}
		/* Hide the user avatar in the locked info area. */
		.locked-info .locked-avatar {
			display: none;
		}
	</style>
	<?php
}

/**
 * Outputs JavaScript to replace the user-specific lock text with a generic
 * "Currently being edited" message in the post list when real-time
 * collaboration is enabled.
 */
function gutenberg_post_list_collaboration_scripts() {
	$locked_text = __( 'Currently being edited', 'gutenberg' );
	// Use JSON_HEX_TAG to prevent script injection if a translation
	// string contains characters like '<' or '>'.
	$locked_text_json = wp_json_encode( $locked_text, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT );
	?>
	<script type="text/javascript">
		( function () {
			var lockedText = <?php echo $locked_text_json; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- wp_json_encode with HEX flags is safe. ?>;

			/**
			 * Replaces user-specific lock text with a generic message.
			 */
			function updateLockedText() {
				var elements = document.querySelectorAll( '.locked-text' );
				elements.forEach( function ( el ) {
					el.textContent = lockedText;
				} );
			}

			if ( document.readyState === 'loading' ) {
				document.addEventListener( 'DOMContentLoaded', updateLockedText );
			} else {
				updateLockedText();
			}

			// jQuery is always available on admin pages. Re-run after each
			// heartbeat tick so that any dynamically refreshed lock text is
			// also replaced with the generic message.
			jQuery( document ).on( 'heartbeat-tick', function () {
				updateLockedText();
			} );
		} )();
	</script>
	<?php
}
