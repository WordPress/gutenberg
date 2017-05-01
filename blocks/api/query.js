/**
 * External dependencies
 */
import { nodeListToReact } from 'dom-react';

export * from 'hpq';

export function children( selector ) {
	return ( node ) => {
		let match = node;

		if ( selector ) {
			match = node.querySelector( selector );
		}

		if ( match ) {
			return nodeListToReact( match.childNodes || [], wp.element.createElement );
		}

		return [];
	};
}
