/**
 * WordPress dependencies
 */
import { store, getContext, renderHTML } from '@wordpress/interactivity';

/*
 * Each item lives in its own container slot. "Shrink" and "grow" re-render
 * ONE slot with fresh markup — the other slot must stay untouched. This is
 * the tree-first equivalent of the old `renderElement()` overlapping
 * re-renders: a splice targets a single container and never disturbs its
 * siblings.
 */
const ITEM_A =
	'<button data-testid="item-a" data-wp-text="context.count" data-wp-on--click="actions.increment">0</button>';
const ITEM_B =
	'<button data-testid="item-b" data-wp-text="context.count" data-wp-on--click="actions.increment">0</button>';

store( 'test/render-html-array', {
	actions: {
		increment() {
			const context = getContext();
			context.count += 1;
		},
		loadTwo() {
			renderHTML( '[data-testid="slot-a"]', ITEM_A );
			renderHTML( '[data-testid="slot-b"]', ITEM_B );
		},
		shrink() {
			// Re-render with a subset: fresh markup in slot A only. The
			// sibling slot B must stay in the DOM, untouched.
			renderHTML( '[data-testid="slot-a"]', ITEM_A, {
				position: 'inner',
			} );
		},
		loadOne() {
			renderHTML( '[data-testid="slot-a"]', ITEM_A );
		},
		grow() {
			// Grow to [item-a, item-b]: slot B gets its item. It must be
			// hydrated exactly once — not duplicated.
			renderHTML( '[data-testid="slot-b"]', ITEM_B );
		},
	},
} );
