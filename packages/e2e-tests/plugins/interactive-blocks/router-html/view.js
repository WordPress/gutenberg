import {
	asDangerousHTML,
	getContext,
	getServerContext,
	store,
	withSyncEvent,
} from '@wordpress/interactivity';

const tokens = {
	T: asDangerousHTML( '<p>T</p>' ),
	U: asDangerousHTML( '<p>U</p>' ),
};

const { state } = store( 'router-html', {
	state: {
		hydration: 'hydrated',
		markCount: 0,
		never: null,
		get html() {
			return getContext().resolved
				? tokens.U
				: ( tokens[ getServerContext().value ] ?? null );
		},
		get value() {
			return getServerContext().value;
		},
	},
	actions: {
		navigate: withSyncEvent( function* ( event ) {
			event.preventDefault();
			const { actions } =
				yield import( '@wordpress/interactivity-router' );
			yield actions.navigate( event.target.href );
		} ),
		mark() {
			state.markCount += 1;
		},
		resolve() {
			getContext().resolved = true;
		},
	},
} );
