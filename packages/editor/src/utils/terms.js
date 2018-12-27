/**
 * External dependencies
 */
import { groupBy } from 'lodash';

/**
 * Returns terms in a tree form.
 *
 * @param {Array} flatTerms  Array of terms in flat format.
 *
 * @return {Array} Array of terms in tree format.
 */
export function buildTermsTree( flatTerms ) {
	const flatTermsWithParent = flatTerms.map( ( term ) => {
		return {
			parent: 0,
			...term,
		};
	} );
	const termsByParent = groupBy( flatTermsWithParent, 'parent' );
	const fillWithChildren = ( terms ) => {
		return terms.map( ( term ) => {
			const children = termsByParent[ term.id ];
			return {
				...term,
				children: children && children.length ?
					fillWithChildren( children ) :
					[],
			};
		} );
	};

	return fillWithChildren( termsByParent[ '0' ] || [] );
}
