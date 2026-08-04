/**
 * WordPress dependencies
 */
import {
	store,
	getContext,
	getElement,
	withSyncEvent,
	renderElement,
} from '@wordpress/interactivity';

const { state } = store( 'test/render-element', {
	state: {
		hydrated: false,
		lifecycle: null,
		items: [ 'one', 'two', 'three' ],
	},
	actions: {
		increment() {
			const context = getContext();
			context.count += 1;
		},
		initFragment() {
			state.lifecycle = 'initialized';
			state.hydrated = true;
		},
		*loadFragment() {
			const { ref } = getElement();
			const res = yield fetch( ref.dataset.fragmentUrl );
			const html = yield res.json();
			const doc = new DOMParser().parseFromString( html, 'text/html' );
			const node = doc.body.firstElementChild;
			document
				.querySelector( '[data-testid="target"]' )
				.appendChild( node );
			renderElement( node );
			state.hydrated = true;
		},
		*reloadFragment() {
			const { ref } = getElement();
			const res = yield fetch( ref.dataset.fragmentUrl );
			const html = yield res.json();
			const doc = new DOMParser().parseFromString( html, 'text/html' );
			const node = doc.body.firstElementChild;
			// Replace the previously inserted fragment with fresh markup.
			const target = document.querySelector(
				'[data-testid="target"]'
			);
			target.replaceChildren( node );
			renderElement( node );
			state.hydrated = true;
		},
		*loadIslandFragment() {
			const { ref } = getElement();
			const res = yield fetch( ref.dataset.fragmentUrl );
			const html = yield res.json();
			const doc = new DOMParser().parseFromString( html, 'text/html' );
			const node = doc.body.firstElementChild;
			document
				.querySelector( '[data-testid="target"]' )
				.appendChild( node );
			renderElement( node );
			state.hydrated = true;
		},
		navigate: withSyncEvent( function* ( event ) {
			event.preventDefault();
			const { actions } = yield import(
				'@wordpress/interactivity-router'
			);
			yield actions.navigate( event.target.href );
		} ),
	},
} );
