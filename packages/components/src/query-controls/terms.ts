/**
 * Internal dependencies
 */
import type {
	Author,
	Category,
	TermWithParentAndChildren,
	TermsByParent,
} from './types';

const ensureParents = (
	terms: TermWithParentAndChildren[]
): terms is ( TermWithParentAndChildren & { parent: number } )[] => {
	return terms.every( ( term ) => term.parent !== null );
};
/**
 * Returns terms in a tree form.
 *
 * @param flatTerms Array of terms in flat format.
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

	if ( ! ensureParents( flatTermsWithParentAndChildren ) ) {
		return flatTermsWithParentAndChildren;
	}

	const termsByParent = flatTermsWithParentAndChildren.reduce(
		( acc: TermsByParent, term ) => {
			const parent = term.parent.toString();
			if ( ! acc[ parent ] ) {
				acc[ parent ] = [];
			}
			acc[ parent ].push( term );
			return acc;
		},
		{}
	);

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
