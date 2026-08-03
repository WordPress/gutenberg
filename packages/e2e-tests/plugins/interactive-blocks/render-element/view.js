/**
 * WordPress dependencies
 */
import {
	store,
	getContext,
	getElement,
	renderElement,
} from '@wordpress/interactivity';

const { state } = store( 'test/render-element', {
	state: {
		hydrated: false,
	},
	actions: {
		increment() {
			const context = getContext();
			context.count += 1;
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
	},
} );
