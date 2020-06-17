<?php
/**
 * Bootstraps Collaborative Editing.
 *
 * @package gutenberg
 */

/**
 * Initializes collaborative editing.
 */
function gutenberg_init_collaborative_editing() {
	if ( ! gutenberg_is_experiment_enabled( 'gutenberg-collaborative-editing' ) ) {
		return;
	}

	register_post_meta(
		'',
		'_collaborative_editing_secret',
		array(
			'type'        => 'string',
			'description' => 'The secret for collaborative editing.',
			'single'      => true,
		)
	);
}
add_action( 'init', 'gutenberg_init_collaborative_editing' );

/**
 * Initializes the REST API for collaborative editing.
 */
function gutenberg_rest_api_init_collaborative_editing() {
	if ( ! gutenberg_is_experiment_enabled( 'gutenberg-collaborative-editing' ) ) {
		return;
	}

	register_rest_field(
		'post',
		'collaborative_editing_secret',
		array(
			'get_callback' => function ( $params ) {
				if ( ! current_user_can( 'edit_post', $params['id'] ) ) {
					return null;
				}

				// Check if there exists any other active sessions for this site.
				$has_another_active_session = false;
				if ( count( WP_Session_Tokens::get_instance( get_current_user_id() )->get_all() ) > 1 ) {
					$has_another_active_session = true;
				} else {
					$users = get_users(
						array(
							'exclude'      => get_current_user_id(),
							'meta_key'     => 'session_tokens',
							'meta_compare' => 'EXISTS',
						)
					);
					foreach ( $users as $user ) {
						if ( ! empty( WP_Session_Tokens::get_instance( $user->ID )->get_all() ) ) {
							$has_another_active_session = true;
							break;
						}
					}
				}

				// Create a new secret the first time this post is fetched and every time it's fetched when there is only one active session.
				if ( ! $has_another_active_session || empty( get_post_meta( $params['id'], '_collaborative_editing_secret', true ) ) ) {
					// Using a hash of the current session token and post ID allows multiple windows using the same session to derive the same value,
					// without exposing the session token or sharing it across posts.
					update_post_meta( $params['id'], '_collaborative_editing_secret', wp_hash( wp_get_session_token() . $params['id'] ) );
				}

				return get_post_meta( $params['id'], '_collaborative_editing_secret', true );
			},
		)
	);
}
add_action( 'rest_api_init', 'gutenberg_rest_api_init_collaborative_editing' );

/**
 * Enqueues collaborative editing admin scripts.
 *
 * @param string $hook Page.
 */
function gutenberg_admin_enqueue_scripts_collaborative_editing( $hook ) {
	if ( ! gutenberg_is_experiment_enabled( 'gutenberg-collaborative-editing' ) ) {
		return;
	}

	if ( 'post-new.php' === $hook || 'post.php' === $hook ) {
		wp_add_inline_script(
			'wp-block-collab',
			'wp.blockCollab.addBlockSelections();
			 wp.blockCollab.addBlockComments();'
		);
	}
}
add_action( 'admin_enqueue_scripts', 'gutenberg_admin_enqueue_scripts_collaborative_editing' );
