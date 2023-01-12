/**
 * External dependencies
 */
import { groupBy } from 'lodash';

/**
 * Internal dependencies
 */
import type { Entity, TermsWithChildren } from './types';

/**
 * Returns terms in a tree form.
 *
 * @param  flatTerms Array of terms in flat format.
 *
 * @return Terms in tree format.
 */
export function buildTermsTree( flatTerms?: readonly Entity[] ) {
	const flatTermsWithParentAndChildren = flatTerms?.map( ( term ) => {
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
	const fillWithChildren = ( terms: Entity[] ): TermsWithChildren => {
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
