import {
	store,
	getContext,
	getServerContext,
	getServerState,
	withSyncEvent,
} from '@wordpress/interactivity';

const { state } = store( 'router-html-server', {
	state: {
		/** Shows that the page has hydrated. */
		hydrated: 'yes',
	},
	actions: {
		/** Navigates using the router without a document reload. */
		navigate: withSyncEvent( function* ( event ) {
			event.preventDefault();
			const { actions } =
				yield import( '@wordpress/interactivity-router' );
			yield actions.navigate( event.target.href );
		} ),
		/** Fetches the current page again and renders it. */
		*refresh() {
			const { actions } =
				yield import( '@wordpress/interactivity-router' );
			yield actions.navigate( window.location.href, { force: true } );
		},
	},
	callbacks: {
		/** Copies the page's server state into the client state. */
		syncState() {
			state.synced = getServerState().synced;
		},
		/** Copies the page's server context into the element's context. */
		syncContext() {
			getContext().synced = getServerContext().synced;
		},
	},
} );
