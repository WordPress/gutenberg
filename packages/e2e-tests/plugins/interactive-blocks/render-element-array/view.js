/**
 * WordPress dependencies
 */
import { store, getContext, renderElement } from '@wordpress/interactivity';

/*
 * The elements rendered so far. Kept in module scope so the "shrink" and
 * "grow" actions can re-call `renderElement()` with a set that overlaps the
 * previous call — the exact scenario that must not corrupt the DOM.
 */
const rendered = [];

const makeButton = ( id ) => {
	const button = document.createElement( 'button' );
	button.setAttribute( 'data-testid', id );
	button.setAttribute( 'data-wp-text', 'context.count' );
	button.setAttribute( 'data-wp-on--click', 'actions.increment' );
	return button;
};

const getTarget = () =>
	document.querySelector( '[data-testid="array-target"]' );

store( 'test/render-element-array', {
	actions: {
		increment() {
			const context = getContext();
			context.count += 1;
		},
		loadTwo() {
			const a = makeButton( 'item-a' );
			const b = makeButton( 'item-b' );
			getTarget().append( a, b );
			rendered.length = 0;
			rendered.push( a, b );
			renderElement( rendered );
		},
		shrink() {
			// Re-render with a subset: only the first element of the previous
			// call. The other sibling must stay in the DOM, untouched.
			renderElement( [ rendered[ 0 ] ] );
		},
		loadOne() {
			const a = makeButton( 'item-a' );
			getTarget().append( a );
			rendered.length = 0;
			rendered.push( a );
			renderElement( rendered );
		},
		grow() {
			// Re-render with a superset: the same first element plus a new
			// second element. The new element must be hydrated in place, not
			// duplicated next to the raw element.
			const b = makeButton( 'item-b' );
			getTarget().append( b );
			rendered.push( b );
			renderElement( rendered );
		},
	},
} );
