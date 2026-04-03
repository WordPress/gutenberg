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

/**
 * Registers the collaboration table on the global $wpdb instance.
 *
 * Since the Gutenberg plugin cannot modify class-wpdb.php, this function
 * registers the table at runtime so $wpdb->collaboration is available.
 *
 * @global wpdb $wpdb WordPress database abstraction object.
 */
function gutenberg_register_collaboration_table() {
	global $wpdb;

	if ( isset( $wpdb->collaboration ) && ! empty( $wpdb->collaboration ) ) {
		return;
	}

	$wpdb->collaboration = $wpdb->prefix . 'collaboration';
	$wpdb->tables[]      = 'collaboration';
}
add_action( 'plugins_loaded', 'gutenberg_register_collaboration_table', 0 );
// Also call it immediately so it's available during the current request.
gutenberg_register_collaboration_table();

/**
 * Creates the collaboration database table if it doesn't exist.
 *
 * Uses dbDelta() for safe schema management. This function is also registered
 * as an action hook so it can be triggered via WP-CLI:
 *
 *   wp eval 'do_action( "gutenberg_create_collaboration_table" );'
 *
 * @global wpdb $wpdb WordPress database abstraction object.
 */
function gutenberg_create_collaboration_table() {
	global $wpdb;

	gutenberg_register_collaboration_table();

	$charset_collate  = $wpdb->get_charset_collate();
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
add_action( 'gutenberg_create_collaboration_table', 'gutenberg_create_collaboration_table' );

if ( ! function_exists( 'gutenberg_register_collaboration_rest_routes' ) ) {
	/**
	 * Registers REST API routes for collaborative editing.
	 */
	function gutenberg_register_collaboration_rest_routes(): void {
		if ( ! wp_is_collaboration_enabled() ) {
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
		if ( ! wp_is_collaboration_allowed() || ! (bool) get_option( 'wp_collaboration_enabled' ) ) {
			return false;
		}

		global $wpdb;
		gutenberg_register_collaboration_table();

		// Check table existence (cached for the request).
		static $table_exists = null;
		if ( null === $table_exists ) {
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			$table_exists = $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $wpdb->collaboration ) ) === $wpdb->collaboration;
		}

		return $table_exists;
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

/**
 * Injects the real-time collaboration setting into a global variable.
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

	wp_add_inline_script(
		'wp-core-data',
		'window._wpCollaborationEnabled = ' . wp_json_encode( $enabled ) . ';',
		'after'
	);
}
add_action( 'admin_init', 'gutenberg_inject_real_time_collaboration_setting' );

/**
 * Core adds an option with the default value, so we need to set the option to
 * our intended default when the Gutenberg plugin is activated.
 */
function gutenberg_set_collaboration_option_on_activation() {
	update_option( 'wp_collaboration_enabled', '1' );
}
add_action( 'activate_gutenberg/gutenberg.php', 'gutenberg_set_collaboration_option_on_activation' );

/**
 * Deletes stale collaboration data from the collaboration table.
 *
 * Removes non-awareness rows older than 7 days and awareness rows older
 * than 60 seconds. Rows left behind by abandoned collaborative editing
 * sessions are cleaned up to prevent unbounded table growth.
 */
function gutenberg_delete_old_collaboration_data() {
	global $wpdb;

	gutenberg_register_collaboration_table();

	if ( ! wp_is_collaboration_enabled() ) {
		/*
		 * Collaboration was enabled in the past but has since been disabled.
		 * Unschedule the cron job prior to clean up so this callback does not
		 * continue to run.
		 */
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

/**
 * Schedules the cron event for cleaning up stale collaboration data.
 */
function gutenberg_schedule_collaboration_cleanup() {
	if ( wp_is_collaboration_enabled()
		&& ! wp_next_scheduled( 'gutenberg_delete_old_collaboration_data' )
		&& ! wp_installing()
	) {
		wp_schedule_event( time(), 'daily', 'gutenberg_delete_old_collaboration_data' );
	}
}
add_action( 'admin_init', 'gutenberg_schedule_collaboration_cleanup' );

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

	$title = _draft_or_post_title( $post->ID );

	/*
	 * Both "Edit" and "Join" labels are rendered. The visible label is
	 * toggled by CSS based on the row's `wp-collaborative-editing` class,
	 * which is added or removed by inline-edit-post.js in response to
	 * heartbeat ticks.
	 */
	$actions['edit'] = sprintf(
		'<a href="%1$s">'
		. '<span class="edit-action-text">'
		. '<span aria-hidden="true">%2$s</span>'
		. '<span class="screen-reader-text">%3$s</span>'
		. '</span>'
		. '<span class="join-action-text">'
		. '<span aria-hidden="true">%4$s</span>'
		. '<span class="screen-reader-text">%5$s</span>'
		. '</span>'
		. '</a>',
		get_edit_post_link( $post->ID ),
		__( 'Edit' ),
		/* translators: %s: Post title. */
		sprintf( __( 'Edit &#8220;%s&#8221;' ), $title ),
		/* translators: Action link text for a singular post in the post list. Can be any type of post. */
		_x( 'Join', 'post list', 'gutenberg' ),
		/* translators: %s: Post title. */
		sprintf( __( 'Join editing &#8220;%s&#8221;', 'gutenberg' ), $title )
	);

	return $actions;
}
