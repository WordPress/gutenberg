/**
 * External dependencies
 */
import { groupBy } from 'lodash';

/**
 * Internal dependencies
 */
import type {
	Author,
	Category,
	TermWithParentAndChildren,
	TermsByParent,
} from './types';

/**
 * Returns terms in a tree form.
 *
 * @param  flatTerms Array of terms in flat format.
 *
 * @return Terms in tree format.
 */
export function buildTermsTree( flatTerms: readonly ( Author | Category )[] ) {
	const flatTermsWithParentAndChildren: TermWithParentAndChildren[] =
		flatTerms.map( ( term ) => {
			return {
				children: [],
				parent: null,
				...term,
				id: String( term.id ),
			};
		} );

	const termsByParent: TermsByParent = groupBy(
		flatTermsWithParentAndChildren,
		'parent'
	);
	if ( termsByParent.null && termsByParent.null.length ) {
		return flatTermsWithParentAndChildren;
	}
	const fillWithChildren = (
		terms: TermWithParentAndChildren[]
	): TermWithParentAndChildren[] => {
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
