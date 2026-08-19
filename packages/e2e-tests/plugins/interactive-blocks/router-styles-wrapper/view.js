import { store, getElement, withSyncEvent } from '@wordpress/interactivity';

const { state } = store( 'test/router-styles', {
	state: {
		clientSideNavigation: false,
		prefetching: false,
		hydrated: false,
	},
	actions: {
		navigate: withSyncEvent( function* ( e ) {
			e.preventDefault();
			state.clientSideNavigation = false;
			const { actions } = yield import(
				'@wordpress/interactivity-router'
			);
			yield actions.navigate( e.target.href );
			state.clientSideNavigation = true;
		} ),
		navigateForce: withSyncEvent( function* ( e ) {
			e.preventDefault();
			state.clientSideNavigation = false;
			const { actions } = yield import(
				'@wordpress/interactivity-router'
			);
			yield actions.navigate( e.target.href, { force: true } );
			state.clientSideNavigation = true;
		} ),
		addDynamicStyles() {
			const style = document.createElement( 'style' );
			style.textContent = '.dynamic-style { color: rgb(255, 0, 255); }';
			document.head.appendChild( style );

			const link = document.createElement( 'link' );
			link.rel = 'stylesheet';
			link.href = state.dynamicLinkUrl;
			document.head.appendChild( link );
		},
		*prefetch() {
			state.prefetching = true;
			const { ref } = getElement();
			const { actions } = yield import(
				'@wordpress/interactivity-router'
			);
			yield actions.prefetch( ref.href );
			state.prefetching = false;
		},
	},
	callbacks: {
		setHydrated() {
			state.hydrated = true;
		},
	},
} );
