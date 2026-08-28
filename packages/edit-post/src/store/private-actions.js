import { getMetaBoxesIframes } from '../utils/meta-boxes';

/**
 * Hides or shows a meta box the way the classic screen does: the change
 * is saved to the `metaboxhidden_{screen}` user option over admin-ajax,
 * so both editors share the same visibility, and any rendered meta boxes
 * pick the change up from the store.
 *
 * @param {string}  id     The meta box id.
 * @param {boolean} hidden Whether the meta box should be hidden.
 */
export const setMetaBoxHidden =
	( id, hidden ) =>
	( { select, dispatch } ) => {
		dispatch( { type: 'SET_META_BOX_HIDDEN', id, hidden } );

		const screenState = window._wpMetaBoxScreenState;
		if ( ! screenState ) {
			return;
		}

		// The same ajax action saves the collapsed state, which the boxes
		// maintain themselves, so the current value is read from the
		// rendered boxes to send it back unchanged.
		const closed = new Set( screenState.closed );
		for ( const iframe of getMetaBoxesIframes() ) {
			const boxes =
				iframe.contentDocument?.querySelectorAll( '.postbox' ) ?? [];
			for ( const box of boxes ) {
				if ( box.classList.contains( 'closed' ) ) {
					closed.add( box.id );
				} else {
					closed.delete( box.id );
				}
			}
		}
		screenState.closed = [ ...closed ];

		const hiddenIds = select
			.getAllMetaBoxes()
			.filter( ( metaBox ) => metaBox.hidden )
			.map( ( metaBox ) => metaBox.id );

		window.fetch( window.ajaxurl, {
			method: 'POST',
			credentials: 'same-origin',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new window.URLSearchParams( {
				action: 'closed-postboxes',
				closedpostboxesnonce: screenState.nonce,
				page: screenState.page,
				closed: screenState.closed.join( ',' ),
				hidden: hiddenIds.join( ',' ),
			} ).toString(),
		} );
	};
