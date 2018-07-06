export function setupHearthbeat() {

	/**
	 * Configure Heartbeat post locks.
	 *
	 * Used to lock editing of an object by only one user at a time.
	 *
	 * When the user does not send a heartbeat in a heartbeat-time
	 * the user is no longer editing and another user can start editing.
	 */
	jQuery( document ).on( 'heartbeat-send.refresh-lock', function( e, data ) {
		const lock = jQuery( '#active_post_lock' ).val(),
			postId = jQuery( '#post_ID' ).val(),
			send = {};

		if ( ! postId ) {
			return;
		}

		send.postId = postId;

		if ( lock ) {
			send.lock = lock;
		}

		data[ 'wp-refresh-post-lock' ] = send;
	} );

	// Refresh post locks: update the lock string or show the dialog if somebody has taken over editing.
	jQuery( document ).on( 'heartbeat-tick.refresh-lock', function( e, data ) {
		if ( data[ 'wp-refresh-post-lock' ] ) {
			const received = data[ 'wp-refresh-post-lock' ];

			if ( received.lock_error ) {
				// @todo suspend autosaving
				// @todo Show "editing taken over" message.
			} else if ( received.new_lock ) {
				jQuery( '#active_post_lock' ).val( received.new_lock );
			}
		}
	} );
}
