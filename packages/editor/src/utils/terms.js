import { decodeEntities } from '@wordpress/html-entities';

/**
 * Returns terms in a tree form.
 *
 * @param {Array} flatTerms Array of terms in flat format.
 *
 * @return {Array} Array of terms in tree format.
 */
export function buildTermsTree( flatTerms ) {
	const flatTermsWithParentAndChildren = flatTerms.map( ( term ) => {
		return {
			children: [],
			parent: undefined,
			...term,
		};
	} );

	// All terms should have a `parent` because we're about to index them by it.
	if (
		flatTermsWithParentAndChildren.some(
			( { parent } ) => parent === undefined
		)
	) {
		return flatTermsWithParentAndChildren;
	}

	const termsById = Object.create( null );
	for ( const term of flatTermsWithParentAndChildren ) {
		// The tree owns `children`, so drop whatever the input carried.
		term.children = [];
		termsById[ term.id ] = term;
	}

	// Terms whose parent is missing are unreachable, so they are dropped.
	const tree = [];
	for ( const term of flatTermsWithParentAndChildren ) {
		const parent = termsById[ term.parent ];
		if ( parent ) {
			parent.children.push( term );
		} else if ( `${ term.parent }` === '0' ) {
			tree.push( term );
		}
	}

	return tree;
}

export const unescapeString = ( arg ) => {
	return decodeEntities( arg );
};

/**
 * Returns a term object with name unescaped.
 *
 * @param {Object} term The term object to unescape.
 *
 * @return {Object} Term object with name property unescaped.
 */
export const unescapeTerm = ( term ) => {
	return {
		...term,
		name: unescapeString( term.name ),
	};
};

/**
 * Returns an array of term objects with names unescaped.
 * The unescape of each term is performed using the unescapeTerm function.
 *
 * @param {Object[]} terms Array of term objects to unescape.
 *
 * @return {Object[]} Array of term objects unescaped.
 */
export const unescapeTerms = ( terms ) => {
	return ( terms ?? [] ).map( unescapeTerm );
};
