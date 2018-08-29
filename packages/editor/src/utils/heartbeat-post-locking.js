/**
 * External dependencies
 */
import jQuery from 'jquery';

/**
 * WordPress dependencies
 */
import { dispatch, select } from '@wordpress/data';

/**
 * Configure Heartbeat post locks.
 *
 * Used to lock editing of an object by only one user at a time.
 *
 * @param {Object} settings The editor settings.
 */
const hearthbeatPostLocking = ( settings ) => {
	/**
	 * Keep the lock refreshed.
	 *
	 * When the user does not send a heartbeat in a heartbeat-tick
	 * the user is no longer editing and another user can start editing.
	 */
	jQuery( document ).on( 'heartbeat-send.refresh-lock', ( e, data ) => {
		// Check if the post is already locked by another user.
		const isLocked = select( 'core/editor' ).isPostLocked();
		if ( isLocked ) {
			return;
		}

		data[ 'wp-refresh-post-lock' ] = {
			lock: select( 'core/editor' ).getActivePostLock(),
			post_id: select( 'core/editor' ).getCurrentPostId(),
		};
	} )

		// Refresh post locks: update the lock string or show the dialog if somebody has taken over editing.
		.on( 'heartbeat-tick.refresh-lock', ( e, data ) => {
			if ( data[ 'wp-refresh-post-lock' ] ) {
				const received = data[ 'wp-refresh-post-lock' ];
				if ( received.lock_error ) {
					// Auto save and display the takeover modal.
					dispatch( 'core/editor' ).autosave();
					dispatch( 'core/editor' ).updatePostLock( {
						isLocked: true,
						isTakeover: true,
						user: {
							avatar: received.lock_error.avatar_src,
						},
					} );
				} else if ( received.new_lock ) {
					dispatch( 'core/editor' ).updatePostLock( {
						isLocked: false,
						activePostLock: received.new_lock,
					} );
				}
			}
		} );

	// Unlock the post before the window is exited.
	jQuery( window ).on( 'beforeunload.edit-post', ( event ) => {
		// Make sure we process only the main document unload.
		if ( event.target && event.target.nodeName !== '#document' ) {
			return;
		}

		const isLocked = select( 'core/editor' ).isPostLocked();
		const postLock = select( 'core/editor' ).getActivePostLock();
		if ( isLocked || ! postLock ) {
			return;
		}

		const data = {
			action: 'wp-remove-post-lock',
			_wpnonce: settings.postLockUtils.nonce,
			post_ID: select( 'core/editor' ).getCurrentPostId(),
			active_post_lock: postLock,
		};

		jQuery.post( {
			async: false,
			url: settings.postLockUtils.ajaxUrl,
			data,
		} );
	} );
};

export default hearthbeatPostLocking;

