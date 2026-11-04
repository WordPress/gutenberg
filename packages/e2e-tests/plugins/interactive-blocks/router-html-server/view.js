import { store, withSyncEvent } from '@wordpress/interactivity';

store( 'router-html-server', {
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
} );
