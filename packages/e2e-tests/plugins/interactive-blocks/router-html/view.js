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

store( 'router-html', {
	state: {
		hydration: 'hydrated',
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
		resolve() {
			getContext().resolved = true;
		},
	},
} );
