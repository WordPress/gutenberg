/**
 * WordPress dependencies
 */
import {
	store,
	getContext,
	getElement,
	withSyncEvent,
	renderHTML,
} from '@wordpress/interactivity';

const { state } = store( 'test/render-element', {
	state: {
		isHydrated: 'no',
		lifecycle: null,
		watchText: 'not watched',
		items: [ 'one', 'two', 'three' ],
		resizeCount: 0,
	},
	callbacks: {
		updateWatch() {
			state.watchText = `watched ${ state.items.length }`;
		},
	},
	actions: {
		increment() {
			const context = getContext();
			context.count += 1;
		},
		incResize() {
			state.resizeCount += 1;
		},
		addItem() {
			state.items = [
				...state.items,
				`item-${ state.items.length + 1 }`,
			];
		},
		initFragment() {
			state.lifecycle = 'initialized';
			state.isHydrated = 'yes';
		},
		/*
		 * Generic fragment loader. The button's `data-position` attribute
		 * selects the `renderHTML` position; `data-fragment-url` the endpoint.
		 */
		*loadFragment() {
			const { ref } = getElement();
			const res = yield fetch( ref.dataset.fragmentUrl );
			const html = yield res.json();
			const target = document.querySelector( '[data-testid="target"]' );
			renderHTML( target, html, {
				position: ref.dataset.position ?? 'append',
			} );
			state.isHydrated = 'yes';
		},
		/*
		 * Loads a window-listener node into a SPECIFIC container (the router
		 * region's content), as a separate renderHTML fragment — the scenario
		 * where a navigation must clean up the node's own per-node fragment.
		 */
		*loadListenerIntoRegion() {
			const { ref } = getElement();
			const res = yield fetch( ref.dataset.fragmentUrl );
			const html = yield res.json();
			const content = document.querySelector(
				'[data-testid="region-content"]'
			);
			if ( content ) {
				renderHTML( content, html );
			}
			state.isHydrated = 'yes';
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
