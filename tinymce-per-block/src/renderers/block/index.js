/**
 * External dependencies
 */
import { render, createElement } from 'wp-elements';

/**
 * Internal dependencies
 */
import BlockList from './block-list';

// TODO: Consider managing block state in more organized fashion (Redux?). Goal
// is to allow focus index to be preserved between rerender by parent (change).

let focusIndex = null;

function renderToTarget( props, target ) {
	render(
		<BlockList
			{ ...props }
			focusIndex={ focusIndex } />,
		target
	);
}

export default function( nodes, target, onChange ) {
	const props = {
		nodes,
		onChange,
		onFocusIndexChange( index ) {
			focusIndex = index;
			renderToTarget( props, target );
		}
	};

	renderToTarget( props, target );
}
