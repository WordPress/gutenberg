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
		items: [ 'one', 'two', 'three' ],
	},
	actions: {
		increment() {
			const context = getContext();
			context.count += 1;
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
		*loadFragment() {
			const { ref } = getElement();
			const res = yield fetch( ref.dataset.fragmentUrl );
			const html = yield res.json();
			const target = document.querySelector(
				'[data-testid="target"]'
			);
			renderHTML( target, html );
			state.isHydrated = 'yes';
		},
		*reloadFragment() {
			const { ref } = getElement();
			const res = yield fetch( ref.dataset.fragmentUrl );
			const html = yield res.json();
			const target = document.querySelector(
				'[data-testid="target"]'
			);
			renderHTML( target, html, { position: 'inner' } );
			state.isHydrated = 'yes';
		},
		*loadIslandFragment() {
			const { ref } = getElement();
			const res = yield fetch( ref.dataset.fragmentUrl );
			const html = yield res.json();
			const target = document.querySelector(
				'[data-testid="target"]'
			);
			renderHTML( target, html );
			state.isHydrated = 'yes';
		},
		*loadBefore() {
			const { ref } = getElement();
			const res = yield fetch( ref.dataset.fragmentUrl );
			const html = yield res.json();
			const target = document.querySelector(
				'[data-testid="target"]'
			);
			renderHTML( target, html, { position: 'before' } );
			state.isHydrated = 'yes';
		},
		*loadAfter() {
			const { ref } = getElement();
			const res = yield fetch( ref.dataset.fragmentUrl );
			const html = yield res.json();
			const target = document.querySelector(
				'[data-testid="target"]'
			);
			renderHTML( target, html, { position: 'after' } );
			state.isHydrated = 'yes';
		},
		*loadOuter() {
			const { ref } = getElement();
			const res = yield fetch( ref.dataset.fragmentUrl );
			const html = yield res.json();
			const target = document.querySelector(
				'[data-testid="target"]'
			);
			renderHTML( target, html, { position: 'outer' } );
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
