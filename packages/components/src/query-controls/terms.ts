/**
 * External dependencies
 */
import { groupBy } from 'lodash';

/**
 * Internal dependencies
 */
import type { Term, TermsWithChildren } from './types';

/**
 * Returns terms in a tree form.
 *
 * @param flatTerms Array of terms in flat format.
 *
 * @return Array of terms in tree format.
 */
export function buildTermsTree(
	flatTerms: readonly Term[]
): TermsWithChildren {
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
	const fillWithChildren = ( terms: Term[] ): TermsWithChildren => {
		return terms.map( ( term ) => {
			const children = termsByParent[ term.id ];
			return {
				...term,
				children:
					children && children.length
						? fillWithChildren( children )
						: [],
			};
		} );
	};

	return fillWithChildren( termsByParent[ '0' ] || [] );
}
