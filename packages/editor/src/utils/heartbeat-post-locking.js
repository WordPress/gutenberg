/**
 * WordPress dependencies
 */
import { dispatch, select } from '@wordpress/data';

/**
 * Configure Heartbeat post locks.
 *
 * Used to lock editing of an object by only one user at a time.
 *
 * @param {number} postId   The post Id.
 * @param {Object} settings The editor settings.
 */
const hearthbeatPostLocking = ( postId, settings ) => {
	// Track the current post lock.
	let activePostLock = settings.activePostLock;

	/**
	 * Keep the lock refreshed.
	 *
	 * When the user does not send a heartbeat in a heartbeat-tick
	 * the user is no longer editing and another user can start editing.
	 */
	jQuery( document ).on( 'heartbeat-send.refresh-lock', function( e, data ) {
		const lock = activePostLock,
			send = {};

		if ( ! postId ) {
			return;
		}

		// Check if the post is already locked by another user.
		const locked = select( 'core/editor' ).isPostLocked();
		if ( locked ) {
			return;
		}

		send.post_id = postId;

		if ( lock ) {
			send.lock = lock;
		}

		data[ 'wp-refresh-post-lock' ] = send;
	} )

		// Refresh post locks: update the lock string or show the dialog if somebody has taken over editing.
		.on( 'heartbeat-tick.refresh-lock', function( e, data ) {
			if ( data[ 'wp-refresh-post-lock' ] ) {
				const received = data[ 'wp-refresh-post-lock' ];
				if ( received.lock_error ) {
					// Auto save and display the takeover modal.
					dispatch( 'core/editor' ).autosave();
					dispatch( 'core/editor' ).lockPost( true, received.lock_error );
				} else if ( received.new_lock ) {
					activePostLock = received.new_lock;
					dispatch( 'core/editor' ).lockPost( false );
				}
			}
		} );

	// Unlock the post before the window is exited.
	jQuery( window ).on( 'beforeunload.edit-post', function( event ) {
		const postLock = activePostLock;

		// Make sure we process only the main document unload.
		if ( event.target && event.target.nodeName !== '#document' ) {
			return;
		}

		if ( ! postId || ! postLock ) {
			return;
		}

		const data = {
			action: 'wp-remove-post-lock',
			_wpnonce: settings._wpnonce,
			post_ID: postId,
			active_post_lock: postLock,
		};

		jQuery.post( {
			async: false,
			data: data,
			url: settings.ajaxurl,
		} );
	} );
};

export default hearthbeatPostLocking;

