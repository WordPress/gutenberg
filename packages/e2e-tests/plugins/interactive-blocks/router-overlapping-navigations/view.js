import {
	store,
	getElement,
	getServerContext,
	getServerState,
	watch,
	withSyncEvent,
} from '@wordpress/interactivity';

// Read, not imported, so the readouts work before the router module loads.
const { state: routerState } = store( 'core/router' );

const { state } = store( 'router-overlapping-navigations', {
	state: {
		// The `href` of the last navigation whose promise resolved.
		resolved: '',
		// Every value `state.navigating` and `state.initiator` of `core/router`
		// have taken, in order.
		lifecycle: '',
		get routerUrl() {
			return routerState.url;
		},
		get serverStatePage() {
			return getServerState().page;
		},
		get serverContextPage() {
			return getServerContext().page;
		},
	},
	actions: {
		navigate: withSyncEvent( function* ( event ) {
			event.preventDefault();
			const { href } = getElement().ref;
			const { actions } =
				yield import( '@wordpress/interactivity-router' );
			yield actions.navigate( href );
			state.resolved = href;
		} ),
	},
} );

const lifecycle = [];
watch( () => {
	lifecycle.push(
		`${ routerState.navigating ? 'navigating' : 'idle' } ${
			routerState.initiator
		}`
	);
	state.lifecycle = lifecycle.join( ', ' );
} );
