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
	const flatTermsWithParentAndChildren = flatTerms.map( ( term ) => {
		return {
			children: [],
			parent: null,
			...term,
		};
	} );

	const termsByParent = groupBy( flatTermsWithParentAndChildren, 'parent' );
	if ( termsByParent.null && termsByParent.null.length ) {
		return flatTermsWithParentAndChildren;
	}
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
