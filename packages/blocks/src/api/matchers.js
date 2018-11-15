/**
 * External dependencies
 */
export { attr, prop, text, query } from 'hpq';

/**
 * Internal dependencies
 */
export { matcher as node } from './node';
export { matcher as children } from './children';

export function html( selector, multilineTag ) {
	return ( domNode ) => {
		let match = domNode;

		if ( selector ) {
			match = domNode.querySelector( selector );
		}

		if ( ! match ) {
			return '';
		}

		if ( multilineTag ) {
			let value = '';
			const length = match.children.length;

			for ( let index = 0; index < length; index++ ) {
				const child = match.children[ index ];

				if ( child.nodeName.toLowerCase() !== multilineTag ) {
					continue;
				}

				value += child.outerHTML;
			}

			return value;
		}

		return match.innerHTML;
	};
}
