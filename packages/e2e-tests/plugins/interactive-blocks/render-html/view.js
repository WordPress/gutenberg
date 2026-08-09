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

const { state } = store( 'test/render-html', {
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
		 * where a navigation must clean up that node's listeners.
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
		/*
		 * Splices a counter button into a container INSIDE the nested island
		 * (loaded via `load-nested`). Lives in the OUTER store because the
		 * triggering button is part of the outer island's markup — but the
		 * spliced content resolves the NESTED island's namespace/store.
		 */
		renderIntoNested() {
			const content = document.querySelector(
				'[data-testid="nested-container"]'
			);
			if ( content ) {
				renderHTML(
					content,
					'<button data-testid="nested-btn" data-wp-on--click="actions.inc" data-wp-text="state.count">0</button>'
				);
			}
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

/*
 * The NESTED island's own store. The nested island fragment carries
 * `data-wp-interactive="test/render-html/nested"`, so its directives
 * (including content spliced into a container inside it) resolve here.
 */
const { state: nestedState } = store( 'test/render-html/nested', {
	state: { count: 0, initCount: 0 },
	callbacks: {
		initOnce() {
			nestedState.initCount += 1;
		},
	},
	actions: {
		inc() {
			nestedState.count += 1;
		},
	},
} );
