import {
	asDangerousHTML,
	getContext,
	getServerContext,
	store,
	withSyncEvent,
} from '@wordpress/interactivity';

/** HTML values selected by each page's server context. */
const tokens = {
	/** Initial or matching destination HTML. */
	T: asDangerousHTML( '<p>T</p>' ),
	/** Differing or late destination HTML. */
	U: asDangerousHTML( '<p>U</p>' ),
};

const { state } = store( 'router-html', {
	state: {
		/** Always empty, including on a kept node. */
		never: null,
		/** Returns the destination token, server representation, null, or pending. */
		get html() {
			if ( getServerContext().value === 'pending' ) {
				return state.late;
			}
			if ( getContext().resolved ) {
				return tokens.U;
			}
			if ( getServerContext().value === 'representation' ) {
				return state.serverHtml;
			}
			return tokens[ getServerContext().value ] ?? null;
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
