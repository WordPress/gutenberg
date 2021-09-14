/**
 * External dependencies
 */
export { attr, prop, text, query } from 'hpq';

/**
 * Internal dependencies
 */
export { matcher as node } from './node';
export { matcher as children } from './children';

function replaceInnerHTMLEntities( innerHTML ) {
	const entityRegEx = /&(amp|lt|gt);/g;

	// This subset of chars are returned as HTML entities from Element.innerHTML
	const lookUp = {
		amp: '&',
		lt: '<',
		gt: '>',
	};

	// Replace entity with text equivalent.
	return innerHTML.replace( entityRegEx, ( match, p1 ) => lookUp[ p1 ] );
}

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

		return replaceInnerHTMLEntities( match.innerHTML );
	};
}
