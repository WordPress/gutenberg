<?php
/**
 * Bootstraps collaborative editing.
 *
 * @package gutenberg
 */

if ( ! class_exists( 'WP_Collaboration_Table_Storage' ) ) {
	require_once __DIR__ . '/class-wp-collaboration-table-storage.php';
	require_once __DIR__ . '/class-wp-http-polling-collaboration-server.php';
}

if ( ! function_exists( 'gutenberg_is_collaboration_enabled' ) ) {
	/**
	 * Checks whether real-time collaboration is enabled.
	 *
	 * In the Gutenberg plugin context, this checks only the site option.
	 * The dedicated database table is created by gutenberg_create_collaboration_table().
	 *
	 * @return bool True if collaboration is enabled, false otherwise.
	 */
	function gutenberg_is_collaboration_enabled() {
		return (bool) get_option( 'wp_collaboration_enabled' );
	}
}

if ( ! function_exists( 'gutenberg_create_collaboration_table' ) ) {
	/**
	 * Creates the collaboration database table if it doesn't exist.
	 *
	 * Uses dbDelta() to create or update the table schema. This runs
	 * on admin_init to ensure the table exists before collaboration
	 * features attempt to use it.
	 */
	function gutenberg_create_collaboration_table() {
		global $wpdb;

		// Register the table name on $wpdb so it's available everywhere.
		if ( ! isset( $wpdb->collaboration ) || empty( $wpdb->collaboration ) ) {
			$wpdb->collaboration = $wpdb->prefix . 'collaboration';
			$wpdb->tables[]      = 'collaboration';
		}

		if ( ! gutenberg_is_collaboration_enabled() ) {
			return;
		}

		// Only run the table creation check once per request.
		static $table_checked = false;
		if ( $table_checked ) {
			return;
		}
		$table_checked = true;

		$charset_collate = $wpdb->get_charset_collate();
		$max_index_length = 191;

		$sql = "CREATE TABLE {$wpdb->collaboration} (
	id bigint(20) unsigned NOT NULL auto_increment,
	room varchar({$max_index_length}) NOT NULL default '',
	type varchar(32) NOT NULL default '',
	client_id varchar(32) NOT NULL default '',
	user_id bigint(20) unsigned NOT NULL default '0',
	data longtext NOT NULL,
	date_gmt datetime NOT NULL default '0000-00-00 00:00:00',
	PRIMARY KEY  (id),
	KEY type_client_id (type,client_id),
	KEY room (room,id),
	KEY date_gmt (date_gmt)
) $charset_collate;";

		require_once ABSPATH . 'wp-admin/includes/upgrade.php';
		dbDelta( $sql );
	}
	add_action( 'admin_init', 'gutenberg_create_collaboration_table' );
}

if ( ! function_exists( 'gutenberg_register_collaboration_wpdb_table' ) ) {
	/**
	 * Registers the collaboration table on $wpdb so queries work outside admin context.
	 */
	function gutenberg_register_collaboration_wpdb_table() {
		global $wpdb;
		if ( ! isset( $wpdb->collaboration ) || empty( $wpdb->collaboration ) ) {
			$wpdb->collaboration = $wpdb->prefix . 'collaboration';
			$wpdb->tables[]      = 'collaboration';
		}
	}
	add_action( 'init', 'gutenberg_register_collaboration_wpdb_table', 0 );
}

if ( ! function_exists( 'gutenberg_register_collaboration_rest_routes' ) ) {
	/**
	 * Registers REST API routes for collaborative editing.
	 */
	function gutenberg_register_collaboration_rest_routes(): void {
		if ( ! gutenberg_is_collaboration_enabled() ) {
			return;
		}
		$collaboration_storage = new WP_Collaboration_Table_Storage();
		$collaboration_server  = new WP_HTTP_Polling_Collaboration_Server( $collaboration_storage );
		$collaboration_server->register_routes();
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
		$option_name = 'wp_collaboration_enabled';

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
				<label for="wp_collaboration_enabled">
					<input name="wp_collaboration_enabled" type="checkbox" id="wp_collaboration_enabled" value="1" <?php checked( '1', $option_value ); ?>/>
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

	if ( ! gutenberg_is_collaboration_enabled() ) {
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
add_filter( 'default_option_wp_collaboration_enabled', '__return_true', 500 );

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

	if ( ! gutenberg_is_collaboration_enabled() ) {
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

if ( ! function_exists( 'gutenberg_delete_old_collaboration_data' ) ) {
	/**
	 * Deletes stale collaboration data from the collaboration table.
	 *
	 * Removes non-awareness rows older than 7 days and awareness rows older
	 * than 60 seconds. Rows left behind by abandoned collaborative editing
	 * sessions are cleaned up to prevent unbounded table growth.
	 */
	function gutenberg_delete_old_collaboration_data() {
		global $wpdb;

		if ( ! isset( $wpdb->collaboration ) || empty( $wpdb->collaboration ) ) {
			return;
		}

		if ( ! gutenberg_is_collaboration_enabled() ) {
			/*
			 * Collaboration was enabled in the past but has since been disabled.
			 * Clean up any remaining stale data and unschedule the cron job
			 * so this callback does not continue to run.
			 */
			$wpdb->query(
				$wpdb->prepare(
					"DELETE FROM {$wpdb->collaboration} WHERE date_gmt < %s",
					gmdate( 'Y-m-d H:i:s', time() - WEEK_IN_SECONDS )
				)
			);

			$wpdb->query(
				$wpdb->prepare(
					"DELETE FROM {$wpdb->collaboration} WHERE type = 'awareness' AND date_gmt < %s",
					gmdate( 'Y-m-d H:i:s', time() - 60 )
				)
			);

			wp_clear_scheduled_hook( 'gutenberg_delete_old_collaboration_data' );
			return;
		}

		/* Clean up rows older than 7 days. */
		$wpdb->query(
			$wpdb->prepare(
				"DELETE FROM {$wpdb->collaboration} WHERE date_gmt < %s",
				gmdate( 'Y-m-d H:i:s', time() - WEEK_IN_SECONDS )
			)
		);

		// Clean up awareness rows older than 60 seconds.
		$wpdb->query(
			$wpdb->prepare(
				"DELETE FROM {$wpdb->collaboration} WHERE type = 'awareness' AND date_gmt < %s",
				gmdate( 'Y-m-d H:i:s', time() - 60 )
			)
		);
	}
	add_action( 'gutenberg_delete_old_collaboration_data', 'gutenberg_delete_old_collaboration_data' );
}

if ( ! function_exists( 'gutenberg_schedule_collaboration_cleanup' ) ) {
	/**
	 * Schedules the collaboration data cleanup cron job.
	 */
	function gutenberg_schedule_collaboration_cleanup() {
		if ( gutenberg_is_collaboration_enabled()
			&& ! wp_next_scheduled( 'gutenberg_delete_old_collaboration_data' )
			&& ! wp_installing()
		) {
			wp_schedule_event( time(), 'daily', 'gutenberg_delete_old_collaboration_data' );
		}
	}
	add_action( 'admin_init', 'gutenberg_schedule_collaboration_cleanup' );
}
