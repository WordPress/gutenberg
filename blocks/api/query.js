/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * Internal dependencies
 */
import { nodeToReact } from '../components/editable/dom-to-react'; // temp

export * from 'hpq';

export function children( selector ) {
	return ( node ) => {
		let match = node;

		if ( selector ) {
			match = node.querySelector( selector );
		}

		if ( match ) {
			return map( match.childNodes || [], nodeToReact );
		}

		return [];
	};
}
