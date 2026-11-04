import {
	asDangerousHTML,
	getContext,
	getServerContext,
	store,
	withSyncEvent,
} from '@wordpress/interactivity';

/** HTML tokens selected by each page's server context. */
const tokens = {
	/** Initial or matching destination HTML. */
	T: asDangerousHTML( '<p>T</p>' ),
	/** Differing or late destination HTML. */
	U: asDangerousHTML( '<p>U</p>' ),
};

const { state } = store( 'router-html', {
	state: {
		/** The server's token representation used by the fallback-media fixture. */
		media: { wpServerHtml: true },
		/** Indicates that the fixture's router prefetch action is in progress. */
		prefetching: false,
		/** Always empty, including on a kept node. */
		never: null,
		/** Returns the destination token, representation, null, or pending value. */
		get html() {
			const value = getServerContext().value;
			if ( value === 'pending' ) {
				return state.late;
			}
			if ( value === 'representation' ) {
				return { wpServerHtml: true };
			}
			return getContext().resolved
				? tokens.U
				: ( tokens[ value ] ?? null );
		},
		/** Reports the destination's own serialized value selection. */
		get value() {
			return getServerContext().value;
		},
	},
	actions: {
		/** Navigates using the router without a document reload. */
		navigate: withSyncEvent( function* ( event ) {
			event.preventDefault();
			const { actions } =
				yield import( '@wordpress/interactivity-router' );
			yield actions.navigate( event.target.href );
		} ),
		/** Prefetches the destination URL selected by the test fixture. */
		prefetch: withSyncEvent( function* ( event ) {
			event.preventDefault();
			state.prefetching = true;
			try {
				const { actions } =
					yield import( '@wordpress/interactivity-router' );
				yield actions.prefetch(
					event.target.getAttribute( 'data-prefetch-url' )
				);
			} finally {
				state.prefetching = false;
			}
		} ),
		/** Resolves null HTML or registers the pending derived getter. */
		resolve() {
			getContext().resolved = true;
			store( 'router-html', {
				state: {
					/** Supplies a late token after the pending destination loads. */
					get late() {
						return tokens.U;
					},
				},
			} );
		},
	},
} );
