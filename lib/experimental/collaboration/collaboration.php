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

/**
 * Post meta key recording collaborative editor sessions.
 *
 * Stored as a map of user ID to the time the session was last reported. A post
 * can be open in several collaborative editors at once, so this cannot be a
 * single most-recent value.
 */
const GUTENBERG_COLLABORATIVE_SESSION_META_KEY = '_collaborative_edit_session';

/**
 * Non-persistent cache group holding per-request edit lock collaboration state.
 */
const GUTENBERG_COLLABORATIVE_LOCK_CACHE_GROUP = 'gutenberg_collaborative_locks';

if ( ! function_exists( 'gutenberg_register_sync_storage_post_type' ) ) {
	/**
	 * Registers the custom post type for sync storage.
	 */
	function gutenberg_register_sync_storage_post_type() {
		if ( ! wp_is_collaboration_enabled() ) {
			return;
		}

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

if ( ! function_exists( 'gutenberg_get_sync_storage' ) ) {
	/**
	 * Returns the sync storage implementation for collaborative editing.
	 *
	 * @since 7.2.0
	 *
	 * @return WP_Sync_Storage Storage implementation.
	 */
	function gutenberg_get_sync_storage() {
		/**
		 * Filters the sync storage implementation for collaborative editing.
		 *
		 * Allows plugins to replace the default post meta storage with alternative
		 * backends. The primary use case is the realtime-collaboration plugin,
		 * which uses Presence API for awareness and a dedicated wp_collaboration
		 * table for CRDT updates, eliminating cache side effects.
		 *
		 * This filter is unstable and may change as RTC explores fundamental changes
		 * to how syncing works. The current interface assumes a pure naïve relay,
		 * which could change.
		 *
		 * @since Gutenberg 21.x
		 *
		 * @param WP_Sync_Storage $sync_storage Storage implementation. Must implement
		 *                                      the WP_Sync_Storage interface.
		 */
		$sync_storage = apply_filters( '__unstable_wp_sync_storage', new WP_Sync_Post_Meta_Storage() );

		if ( ! $sync_storage instanceof WP_Sync_Storage ) {
			$sync_storage = new WP_Sync_Post_Meta_Storage();
		}

		return $sync_storage;
	}
}

if ( ! function_exists( 'gutenberg_register_collaboration_rest_routes' ) ) {
	/**
	 * Registers REST API routes for collaborative editing.
	 */
	function gutenberg_register_collaboration_rest_routes(): void {
		if ( ! wp_is_collaboration_enabled() ) {
			return;
		}

		$sync_server = new WP_HTTP_Polling_Sync_Server( gutenberg_get_sync_storage() );
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
		if ( ! wp_is_collaboration_enabled() ) {
			return;
		}

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

if ( ! function_exists( 'wp_is_collaboration_enabled' ) ) {
	/**
	 * Determines whether real-time collaboration is enabled.
	 *
	 * @since 7.0.0
	 *
	 * @return bool Whether real-time collaboration is enabled.
	 */
	function wp_is_collaboration_enabled() {
		return gutenberg_is_experiment_enabled( 'gutenberg-real-time-collaboration' );
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
 * Disables real-time collaboration for post types that cannot persist the
 * CRDT document.
 *
 * Collaboration stores its CRDT document in post meta. The REST API only
 * exposes post meta for post types that support custom fields, so enabling
 * collaboration for other post types can cause stale sync updates to replace
 * newer entity content.
 *
 * @param bool   $disabled  Whether real-time collaboration is disabled for the post type.
 * @param string $post_type Post type name.
 * @return bool Whether real-time collaboration is disabled for the post type.
 */
function gutenberg_disable_collaboration_for_post_types_without_custom_fields( $disabled, $post_type ) {
	if ( $disabled ) {
		return $disabled;
	}

	/*
	 * The attachments REST controller always exposes meta, regardless of
	 * whether the attachment post type supports custom fields.
	 */
	if ( 'attachment' === $post_type ) {
		return false;
	}

	return ! post_type_supports( $post_type, 'custom-fields' );
}
add_filter( 'wp_is_post_type_collaboration_disabled', 'gutenberg_disable_collaboration_for_post_types_without_custom_fields', 10, 2 );

if ( ! function_exists( 'gutenberg_get_active_edit_lock_user' ) ) {
	/**
	 * Returns the user ID recorded in a fresh edit lock.
	 *
	 * Unlike wp_check_post_lock(), this includes locks owned by the current user.
	 *
	 * @since 7.1.0
	 *
	 * @param int $post_id Post ID.
	 * @return int User ID from a fresh lock, or 0 if none exists.
	 */
	function gutenberg_get_active_edit_lock_user( $post_id ) {
		$lock = get_post_meta( $post_id, '_edit_lock', true );
		if ( ! $lock ) {
			return 0;
		}

		$lock = explode( ':', $lock );
		$time = (int) $lock[0];
		$user = isset( $lock[1] ) ? (int) $lock[1] : (int) get_post_meta( $post_id, '_edit_last', true );

		if ( ! $time || ! $user || ! get_userdata( $user ) ) {
			return 0;
		}

		/** This filter is documented in wp-admin/includes/ajax-actions.php */
		$time_window = apply_filters( 'wp_check_post_lock_window', 150 );

		if ( $time > time() - $time_window ) {
			return $user;
		}

		return 0;
	}
}

if ( ! function_exists( 'gutenberg_mark_collaborative_edit_session' ) ) {
	/**
	 * Records that the current user opened this post in a collaborative editor.
	 *
	 * Written when the editor page renders and refreshed by the editor's
	 * heartbeat, so the signal does not depend on which sync transport is in
	 * use. Expires with the edit lock it describes.
	 *
	 * @since 7.2.0
	 *
	 * @param int      $post_id Post ID.
	 * @param int|null $user_id User ID. Defaults to the current user.
	 */
	function gutenberg_mark_collaborative_edit_session( $post_id, $user_id = null ) {
		$user_id = $user_id ? (int) $user_id : get_current_user_id();
		if ( ! $user_id ) {
			return;
		}

		$sessions             = gutenberg_get_collaborative_edit_sessions( $post_id );
		$sessions[ $user_id ] = time();

		update_post_meta( $post_id, GUTENBERG_COLLABORATIVE_SESSION_META_KEY, $sessions );
	}
}

if ( ! function_exists( 'gutenberg_get_collaborative_edit_sessions' ) ) {
	/**
	 * Returns the unexpired collaborative editor sessions recorded for a post.
	 *
	 * A post can be open in several collaborative editors at once, so sessions
	 * are kept per user rather than as a single most-recent value.
	 *
	 * @since 7.2.0
	 *
	 * @param int $post_id Post ID.
	 * @return array<int, int> Map of user ID to the time the session was last reported.
	 */
	function gutenberg_get_collaborative_edit_sessions( $post_id ) {
		$sessions = get_post_meta( $post_id, GUTENBERG_COLLABORATIVE_SESSION_META_KEY, true );
		if ( ! is_array( $sessions ) ) {
			return array();
		}

		$oldest = time() - gutenberg_get_collaborative_session_window();
		$fresh  = array();

		foreach ( $sessions as $user_id => $reported_at ) {
			if ( (int) $reported_at > $oldest ) {
				$fresh[ (int) $user_id ] = (int) $reported_at;
			}
		}

		return $fresh;
	}
}

if ( ! function_exists( 'gutenberg_clear_collaborative_edit_session' ) ) {
	/**
	 * Removes a user's recorded collaborative editor session for a post.
	 *
	 * @since 7.2.0
	 *
	 * @param int $post_id Post ID.
	 * @param int $user_id User ID.
	 */
	function gutenberg_clear_collaborative_edit_session( $post_id, $user_id ) {
		$sessions = gutenberg_get_collaborative_edit_sessions( $post_id );

		unset( $sessions[ (int) $user_id ] );

		update_post_meta( $post_id, GUTENBERG_COLLABORATIVE_SESSION_META_KEY, $sessions );
	}
}

if ( ! function_exists( 'gutenberg_get_collaborative_session_window' ) ) {
	/**
	 * Returns how long a recorded collaborative session stays valid.
	 *
	 * Matches the edit lock window, so the marker and the lock it describes
	 * expire together. Both are refreshed by the same heartbeat.
	 *
	 * @since 7.2.0
	 *
	 * @return int Window in seconds.
	 */
	function gutenberg_get_collaborative_session_window() {
		/** This filter is documented in wp-admin/includes/ajax-actions.php */
		return (int) apply_filters( 'wp_check_post_lock_window', 150 );
	}
}

if ( ! function_exists( 'gutenberg_is_user_in_collaborative_session' ) ) {
	/**
	 * Determines whether a user is editing a post in a collaborative session.
	 *
	 * True when they have recently reported a collaborative editor session, or
	 * when the HTTP polling sync server has recent awareness for them. The
	 * awareness check is a fallback: other transports do not record it.
	 *
	 * @since 7.2.0
	 *
	 * @param int $post_id Post ID.
	 * @param int $user_id User ID.
	 * @return bool Whether the user is in a collaborative session for the post.
	 */
	function gutenberg_is_user_in_collaborative_session( $post_id, $user_id ) {
		$post = get_post( $post_id );
		if ( ! $post || ! $user_id ) {
			return false;
		}

		$now = time();

		$sessions = gutenberg_get_collaborative_edit_sessions( $post->ID );
		if ( isset( $sessions[ (int) $user_id ] ) ) {
			return true;
		}

		$room      = 'postType/' . $post->post_type . ':' . $post->ID;
		$awareness = gutenberg_get_sync_storage()->get_awareness_state( $room );

		foreach ( $awareness as $entry ) {
			if ( ! isset( $entry['wp_user_id'], $entry['updated_at'] ) ) {
				continue;
			}

			if ( (int) $entry['wp_user_id'] !== (int) $user_id ) {
				continue;
			}

			if ( $now - (int) $entry['updated_at'] < WP_HTTP_Polling_Sync_Server::AWARENESS_TIMEOUT ) {
				return true;
			}
		}

		return false;
	}
}

if ( ! function_exists( 'gutenberg_is_post_lock_collaborative' ) ) {
	/**
	 * Determines whether a post's edit lock belongs to a collaborative session.
	 *
	 * The classic editor and page builders take the same lock but do not merge
	 * changes, so treating their lock as collaborative lets two people edit at
	 * once and the second save wins. A post with no active lock counts as
	 * collaborative: there is nothing to conflict with.
	 *
	 * @since 7.2.0
	 *
	 * @param WP_Post|int $post Post object or post ID.
	 * @return bool Whether the post's edit lock belongs to a collaborative session.
	 */
	function gutenberg_is_post_lock_collaborative( $post ) {
		$post = get_post( $post );
		if ( ! $post || wp_is_post_type_collaboration_disabled( $post->post_type ) ) {
			return false;
		}

		/*
		 * Asked three times per post list row, and reading awareness runs an
		 * uncached query. Non-persistent: awareness expires within seconds, so
		 * this must not outlive the request.
		 */
		wp_cache_add_non_persistent_groups( GUTENBERG_COLLABORATIVE_LOCK_CACHE_GROUP );

		$found  = false;
		$cached = wp_cache_get( $post->ID, GUTENBERG_COLLABORATIVE_LOCK_CACHE_GROUP, false, $found );
		if ( $found ) {
			return (bool) $cached;
		}

		$lock_user = gutenberg_get_active_edit_lock_user( $post->ID );

		if ( ! $lock_user || get_current_user_id() === $lock_user ) {
			$collaborative = true;
		} else {
			$collaborative = gutenberg_is_user_in_collaborative_session( $post->ID, $lock_user );
		}

		wp_cache_set( $post->ID, $collaborative, GUTENBERG_COLLABORATIVE_LOCK_CACHE_GROUP );

		return $collaborative;
	}
}

/**
 * Injects the post types for which real-time collaboration is disabled.
 */
function gutenberg_inject_collaboration_disabled_post_types() {
	if ( ! wp_is_collaboration_enabled() ) {
		return;
	}

	$disabled_post_types = array_values(
		array_filter(
			get_post_types( array( 'show_in_rest' => true ) ),
			'wp_is_post_type_collaboration_disabled'
		)
	);

	wp_add_inline_script(
		'wp-core-data',
		'window._wpCollaborationDisabledPostTypes = ' . wp_json_encode( $disabled_post_types ) . ';',
		'after'
	);
}
add_action( 'admin_init', 'gutenberg_inject_collaboration_disabled_post_types' );

/**
 * Modifies the post list UI and heartbeat responses for real-time collaboration.
 *
 * When RTC is enabled, hides the lock icon and user avatar, replaces the
 * user-specific lock text with "Currently being edited", changes the "Edit"
 * row action to "Join", and re-enables bulk-edit checkboxes that core
 * normally hides for locked posts (Quick Edit intentionally stays hidden,
 * as it is not collaboration-aware).
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
	add_filter( 'heartbeat_received', 'gutenberg_filter_locked_posts_heartbeat_for_rtc', 20, 2 );
	add_filter( 'heartbeat_received', 'gutenberg_track_collaborative_session_heartbeat', 20, 2 );

	// Register globally because Quick Edit submits `action=inline-save` through admin-ajax.php.
	add_action( 'wp_ajax_inline-save', 'gutenberg_block_quick_edit_for_active_lock', 0 );

	// CSS, JS, and row action overrides only apply on the posts list page.
	if ( 'edit.php' !== $pagenow ) {
		return;
	}

	add_action( 'admin_head', 'gutenberg_post_list_collaboration_styles' );
	add_filter( 'gettext', 'gutenberg_filter_locked_post_text_for_rtc', 10, 3 );
	add_filter( 'post_class', 'gutenberg_post_list_collaboration_row_class', 10, 3 );
	add_filter( 'post_row_actions', 'gutenberg_post_list_collaboration_row_actions', 10, 2 );
	add_filter( 'page_row_actions', 'gutenberg_post_list_collaboration_row_actions', 10, 2 );
}
add_action( 'admin_init', 'gutenberg_post_list_collaboration_ui' );

/**
 * Records whether the editor refreshing an edit lock can merge changes.
 *
 * The block editor reports this alongside its lock refresh, so the signal does
 * not depend on which sync transport is in use. The classic editor refreshes
 * the same lock without reporting anything, which clears the marker.
 *
 * @param array $response The heartbeat response.
 * @param array $data     The data sent by the client.
 * @return array Unmodified heartbeat response.
 */
function gutenberg_track_collaborative_session_heartbeat( $response, $data = array() ) {
	if ( empty( $data['wp-refresh-post-lock']['post_id'] ) ) {
		return $response;
	}

	$post_id = (int) $data['wp-refresh-post-lock']['post_id'];
	if ( ! $post_id || ! current_user_can( 'edit_post', $post_id ) ) {
		return $response;
	}

	$post = get_post( $post_id );
	if ( ! $post || wp_is_post_type_collaboration_disabled( $post->post_type ) ) {
		return $response;
	}

	// Only the lock holder describes the session the lock belongs to.
	if ( get_current_user_id() !== gutenberg_get_active_edit_lock_user( $post_id ) ) {
		return $response;
	}

	if ( empty( $data['wp-refresh-post-lock']['collaborative'] ) ) {
		gutenberg_clear_collaborative_edit_session( $post_id, get_current_user_id() );
		return $response;
	}

	gutenberg_mark_collaborative_edit_session( $post_id );

	return $response;
}

/**
 * Removes user-specific details from post lock heartbeat responses and adds
 * fresh locks owned by the current user when collaboration is enabled.
 *
 * Core populates other-user lock data at priority 10 and excludes locks owned
 * by the current user. This filter runs at priority 20 to replace those details
 * with generic text and add the current user's own locks.
 *
 * @param array $response The heartbeat response.
 * @param array $data     The data sent by the client.
 * @return array Modified heartbeat response.
 */
function gutenberg_filter_locked_posts_heartbeat_for_rtc( $response, $data = array() ) {
	if ( ! empty( $response['wp-check-locked-posts'] ) ) {
		foreach ( $response['wp-check-locked-posts'] as $key => $lock_data ) {
			$post_id = absint( substr( $key, 5 ) );

			// An exclusive lock keeps core's "%s is currently editing" details.
			if ( ! $post_id || ! gutenberg_is_post_lock_collaborative( $post_id ) ) {
				continue;
			}

			$response['wp-check-locked-posts'][ $key ]['text'] = __( 'Currently being edited', 'gutenberg' );
			unset( $response['wp-check-locked-posts'][ $key ]['avatar_src'] );
			unset( $response['wp-check-locked-posts'][ $key ]['avatar_src_2x'] );
		}
	}

	if ( ! empty( $data['wp-check-locked-posts'] ) && is_array( $data['wp-check-locked-posts'] ) ) {
		foreach ( $data['wp-check-locked-posts'] as $key ) {
			if ( isset( $response['wp-check-locked-posts'][ $key ] ) ) {
				continue;
			}

			$post_id = absint( substr( $key, 5 ) );
			if ( ! $post_id || ! current_user_can( 'edit_post', $post_id ) ) {
				continue;
			}

			$post = get_post( $post_id );
			if ( ! $post || wp_is_post_type_collaboration_disabled( $post->post_type ) ) {
				continue;
			}

			$lock_user = gutenberg_get_active_edit_lock_user( $post_id );
			if ( $lock_user && get_current_user_id() === $lock_user ) {
				$response['wp-check-locked-posts'][ $key ] = array(
					'text' => __( 'Currently being edited', 'gutenberg' ),
				);
			}
		}
	}

	return $response;
}

if ( ! function_exists( 'gutenberg_block_quick_edit_for_active_lock' ) ) {
	/**
	 * Rejects Quick Edit while the current user holds a fresh edit lock.
	 *
	 * Core handles locks owned by other users but excludes the current user's
	 * locks. Rejecting them prevents Quick Edit changes from diverging from the
	 * editing session. The server check also covers post lists loaded before the
	 * lock was created.
	 *
	 * @since 7.1.0
	 */
	function gutenberg_block_quick_edit_for_active_lock() {
		check_ajax_referer( 'inlineeditnonce', '_inline_edit' );

		$post_id = isset( $_POST['post_ID'] ) ? (int) $_POST['post_ID'] : 0;
		if ( ! $post_id ) {
			return;
		}

		$post = get_post( $post_id );
		if ( ! $post || wp_is_post_type_collaboration_disabled( $post->post_type ) ) {
			return;
		}

		$lock_user = gutenberg_get_active_edit_lock_user( $post_id );
		if ( ! $lock_user ) {
			/*
			 * Core creates a lock during inline save. Prevent that specific write
			 * so a later Quick Edit is not mistaken for an active editor session.
			 */
			add_filter(
				'update_post_metadata',
				static function ( $check, $object_id, $meta_key ) use ( $post_id ) {
					if ( $post_id === (int) $object_id && '_edit_lock' === $meta_key ) {
						return false;
					}

					return $check;
				},
				10,
				3
			);
			return;
		}

		if ( get_current_user_id() !== $lock_user ) {
			// Core handles locks owned by another user.
			return;
		}

		wp_die( esc_html__( 'Quick Edit is disabled: You are currently editing this post in another tab or window.', 'gutenberg' ) );
	}
}

/**
 * Marks post list rows whose edit lock belongs to a collaborative session.
 *
 * The collaborative treatment (generic lock text, no avatar, a "Join" action)
 * applies only to these rows; the rest keep core's exclusive lock UI.
 *
 * @param string[] $classes An array of post class names.
 * @param string[] $css_class An array of additional class names added to the post.
 * @param int      $post_id  The post ID.
 * @return string[] Filtered post class names.
 */
function gutenberg_post_list_collaboration_row_class( $classes, $css_class, $post_id ) {
	if ( gutenberg_is_post_lock_collaborative( $post_id ) ) {
		$classes[] = 'is-collaborative-lock';
	}

	return $classes;
}

/**
 * Outputs CSS to hide the post lock icon and user avatar in the post list
 * when real-time collaboration is enabled.
 *
 * Also re-enables checkboxes that WordPress core hides for locked posts, since
 * collaborative editing means the post is not exclusively locked. It toggles
 * "Edit" / "Join" action link text using the `.wp-locked` class managed by
 * heartbeat.
 */
function gutenberg_post_list_collaboration_styles() {
	?>
	<style type="text/css">
		/*
		 * Every rule is scoped to `.is-collaborative-lock`, added by
		 * gutenberg_post_list_collaboration_row_class(). Rows without it keep
		 * core's exclusive lock UI.
		 */

		/*
		 * Hide the lock indicator icon in the checkbox column.
		 * WordPress core shows it via .wp-locked .locked-indicator { display: block },
		 * so we match that specificity to override it.
		 */
		.is-collaborative-lock.wp-locked .locked-indicator {
			display: none;
		}
		/* Hide the user avatar in the locked info area. */
		.is-collaborative-lock.wp-locked .locked-info .locked-avatar {
			display: none;
		}
		/*
		 * Re-enable bulk-edit checkboxes that core hides for locked posts,
		 * since RTC allows collaborative editing.
		 * Must use `tr.wp-locked` to match core's specificity in
		 * list-tables.css and actually override its `display: none`.
		 * Quick Edit intentionally stays hidden: it is not collaboration-aware,
		 * so edits made through it diverge from the content in an active editor session.
		 */
		tr.is-collaborative-lock.wp-locked .check-column label,
		tr.is-collaborative-lock.wp-locked .check-column input[type="checkbox"] {
			display: revert;
		}
		/*
		 * Toggle "Edit" / "Join" action link text based on lock state.
		 * The heartbeat adds/removes .wp-locked on locked rows. Both labels are
		 * only rendered for rows with a collaborative lock, so the unlocked
		 * state of any other row is unaffected.
		 */
		.join-action-text {
			display: none;
		}
		.is-collaborative-lock.wp-locked .edit-action-text {
			display: none;
		}
		.is-collaborative-lock.wp-locked .join-action-text {
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
	if ( 'default' !== $domain || '%s is currently editing' !== $text ) {
		return $translation;
	}

	// single_row() sets the global post, so this resolves against the right row.
	$post = get_post();
	if ( ! $post || ! gutenberg_is_post_lock_collaborative( $post ) ) {
		return $translation;
	}

	return __( 'Currently being edited', 'gutenberg' );
}

/**
 * Filters post row actions to render both "Edit" and "Join" link text
 * when real-time collaboration is enabled.
 *
 * Both labels are always present in the markup; CSS toggles visibility using
 * the `.wp-locked` class managed by heartbeat. This updates the link text when
 * the lock state changes without requiring a page reload.
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

	// Locked by an editor that cannot merge changes, so there is nothing to join.
	if ( ! gutenberg_is_post_lock_collaborative( $post ) ) {
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
	 * still reaches the visible label. CSS in
	 * gutenberg_post_list_collaboration_styles() flips visibility on the
	 * outer spans based on the row's `wp-locked` class, which core's
	 * inline-edit-post.js maintains in response to heartbeat ticks.
	 */
	$actions['edit'] = sprintf(
		'<span class="edit-action-text"><a href="%1$s" aria-label="%2$s">%3$s</a></span>'
		. '<span class="join-action-text"><a href="%1$s" aria-label="%4$s">%5$s</a></span>',
		esc_url( get_edit_post_link( $post->ID ) ),
		/* translators: %s: Post title. */
		esc_attr( sprintf( __( 'Edit &#8220;%s&#8221;', 'default' ), $title ) ),
		__( 'Edit', 'default' ),
		/* translators: %s: Post title. */
		esc_attr( sprintf( __( 'Join editing &#8220;%s&#8221;', 'gutenberg' ), $title ) ),
		/* translators: Action link text for a singular post in the post list. Can be any type of post. */
		_x( 'Join', 'post list', 'gutenberg' )
	);

	return $actions;
}

/**
 * Tells the block editor whether the post's edit lock is collaborative, and
 * records this session so other collaborators can see it.
 *
 * The editor suppresses the "already being edited" modal while collaboration is
 * enabled, which is only correct when the existing lock can merge changes.
 *
 * @param array                   $settings             Editor settings.
 * @param WP_Block_Editor_Context $block_editor_context The current block editor context.
 * @return array Filtered editor settings.
 */
function gutenberg_add_lock_collaboration_state_to_editor_settings( $settings, $block_editor_context ) {
	if ( ! isset( $settings['postLock'] ) || empty( $block_editor_context->post ) ) {
		return $settings;
	}

	if ( ! wp_is_collaboration_enabled() ) {
		return $settings;
	}

	$post = $block_editor_context->post;

	if ( wp_is_post_type_collaboration_disabled( $post->post_type ) ) {
		return $settings;
	}

	$settings['postLock']['isCollaborative'] = gutenberg_is_post_lock_collaborative( $post );

	// Recorded after reading the lock, so this session isn't mistaken for it.
	gutenberg_mark_collaborative_edit_session( $post->ID );

	return $settings;
}
add_filter( 'block_editor_settings_all', 'gutenberg_add_lock_collaboration_state_to_editor_settings', 10, 2 );

/**
 * Adds the autosave's CRDT snapshot to the block editor settings when
 * real-time collaboration is enabled.
 *
 * The snapshot describes the document state the autosave captured. The editor
 * verifies its own shared document against it, and suppresses the "there is a
 * more recent autosave" notice when the shared document already contains
 * everything the autosave holds.
 *
 * @param array                   $settings             Editor settings.
 * @param WP_Block_Editor_Context $block_editor_context The current block editor context.
 * @return array Filtered editor settings.
 */
function gutenberg_add_autosave_details_to_editor_settings( $settings, $block_editor_context ) {
	if ( ! isset( $settings['autosave'] ) || empty( $block_editor_context->post ) ) {
		return $settings;
	}

	if ( ! wp_is_collaboration_enabled() ) {
		return $settings;
	}

	$post = $block_editor_context->post;

	if ( wp_is_post_type_collaboration_disabled( $post->post_type ) ) {
		return $settings;
	}

	$autosave = wp_get_post_autosave( $post->ID );

	if ( ! $autosave ) {
		return $settings;
	}

	$snapshot = get_post_meta( $autosave->ID, Gutenberg_REST_Autosaves_Controller::CRDT_SNAPSHOT_META_KEY, true );

	/*
	 * Snapshots can be missing from a pre-collaboration autosave, classic editor autosave,
	 * and other paths. The worst case is a "more recent autosave" notice when newer CRDT
	 * content is already present in the shared document.
	 */
	if ( ! is_string( $snapshot ) || '' === $snapshot ) {
		return $settings;
	}

	$settings['autosave']['crdtSnapshot'] = $snapshot;

	return $settings;
}
add_filter( 'block_editor_settings_all', 'gutenberg_add_autosave_details_to_editor_settings', 10, 2 );
