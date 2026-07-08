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

if ( ! function_exists( 'gutenberg_get_active_edit_lock_user' ) ) {
	/**
	 * Returns the user ID holding a fresh edit lock on a post, including
	 * the current user.
	 *
	 * Unlike wp_check_post_lock(), this does not exclude the current user,
	 * so it can detect that the current user has the post open in the
	 * editor themselves (e.g. in another tab).
	 *
	 * @since 7.1.0
	 *
	 * @param int $post_id Post ID.
	 * @return int User ID holding a fresh lock, or 0 if there is none.
	 */
	function gutenberg_get_active_edit_lock_user( $post_id ) {
		$lock = get_post_meta( $post_id, '_edit_lock', true );
		if ( ! $lock ) {
			return 0;
		}

		$lock = explode( ':', $lock );
		$time = (int) $lock[0];
		$user = isset( $lock[1] ) ? (int) $lock[1] : (int) get_post_meta( $post_id, '_edit_last', true );

		if ( ! $time || ! $user ) {
			return 0;
		}

		/** This filter is documented in wp-admin/includes/post.php */
		$time_window = apply_filters( 'wp_check_post_lock_window', 150 );

		if ( $time > time() - $time_window ) {
			return $user;
		}

		return 0;
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
	add_filter( 'heartbeat_received', 'gutenberg_filter_locked_posts_heartbeat_for_rtc', 20, 3 );

	// Reject Quick Edit saves while the post is open in an editor session.
	// Registered globally since Quick Edit saves go through admin-ajax.php.
	// Core fires "wp_ajax_{$_POST['action']}" and Quick Edit posts
	// action=inline-save, so the hook name uses a hyphen.
	add_action( 'wp_ajax_inline-save', 'gutenberg_block_quick_edit_for_active_lock', 0 );

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
 * and to mark the current user's own actively edited posts as locked,
 * when real-time collaboration is enabled.
 *
 * WordPress core's wp_check_locked_posts() runs at priority 10 and populates
 * the 'wp-check-locked-posts' key with user name, avatar, and text. This
 * filter runs at priority 20 to replace that data with a generic message,
 * preventing user-specific lock info from reaching the client.
 *
 * Core also excludes posts locked by the current user, so a lock holder
 * never sees their own rows as locked. This filter adds those rows back so
 * Quick Edit is also disabled for the lock holder while they have the post
 * open in the editor (see gh-79640).
 *
 * @param array  $response  The heartbeat response.
 * @param array  $data      The data sent by the client.
 * @param string $screen_id The screen ID.
 * @return array Modified heartbeat response.
 */
function gutenberg_filter_locked_posts_heartbeat_for_rtc( $response, $data = array(), $screen_id = '' ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	if ( ! empty( $response['wp-check-locked-posts'] ) ) {
		foreach ( $response['wp-check-locked-posts'] as $key => $lock_data ) {
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
	 * Rejects Quick Edit saves while the current user has the post open in
	 * the editor, when real-time collaboration is enabled.
	 *
	 * Runs before core's wp_ajax_inline_save() handler. Core already rejects
	 * saves when another user holds the edit lock, but never when the current
	 * user does, allowing Quick Edit changes that silently diverge from the
	 * user's own open editor session. Hiding the Quick Edit action is not
	 * enough on its own: a posts list loaded before the session started can
	 * still submit the form.
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
			 * The save will proceed. Core's handler refreshes the edit lock
			 * during the save; clear it afterwards so this guard does not
			 * reject the user's next Quick Edit of the same post.
			 */
			add_action(
				'shutdown',
				static function () use ( $post_id ) {
					gutenberg_release_own_edit_lock( $post_id );
				}
			);
			return;
		}

		if ( get_current_user_id() !== $lock_user ) {
			// Another user's lock — core rejects that save itself.
			return;
		}

		wp_die( esc_html__( 'Quick Edit is disabled: You are currently editing this post in another tab or window.', 'gutenberg' ) );
	}
}

if ( ! function_exists( 'gutenberg_release_own_edit_lock' ) ) {
	/**
	 * Deletes a post's edit lock if the current user holds it and it is
	 * still fresh.
	 *
	 * Core's inline-save handler refreshes the edit lock as part of the
	 * save. With collaboration enabled that lock would make
	 * gutenberg_block_quick_edit_for_active_lock() reject a follow-up
	 * Quick Edit for the lock window even though no editor session exists.
	 * An open editor session re-establishes its own lock via heartbeat.
	 *
	 * @since 7.1.0
	 *
	 * @param int $post_id Post ID.
	 */
	function gutenberg_release_own_edit_lock( $post_id ) {
		$lock_user = gutenberg_get_active_edit_lock_user( $post_id );
		if ( $lock_user && get_current_user_id() === $lock_user ) {
			delete_post_meta( $post_id, '_edit_lock' );
		}
	}
}

/**
 * Outputs CSS to hide the post lock icon and user avatar in the post list
 * when real-time collaboration is enabled.
 *
 * Also re-enables checkboxes that WordPress core hides for
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
		 * Re-enable bulk-edit checkboxes that core hides for locked posts,
		 * since RTC allows collaborative editing.
		 * Must use `tr.wp-locked` to match core's specificity in
		 * list-tables.css and actually override its `display: none`.
		 * Quick Edit intentionally stays hidden: it is not collaboration-aware,
		 * so edits made through it diverge from the content in an active editor session.
		 */
		tr.wp-locked .check-column label,
		tr.wp-locked .check-column input[type="checkbox"] {
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

	/*
	 * Core hides Quick Edit on locked rows with CSS, but only marks rows
	 * locked by other users. Remove the action server-side when the current
	 * user holds the lock, i.e. has the post open in the editor themselves.
	 */
	$lock_user = gutenberg_get_active_edit_lock_user( $post->ID );
	if ( $lock_user && get_current_user_id() === $lock_user ) {
		unset( $actions['inline hide-if-no-js'] );
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
