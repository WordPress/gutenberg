/**
 * Accepting a terms suggestion that names terms which do not exist yet.
 *
 * Suggesting never writes to a taxonomy: a new term rides on the terms
 * proposal as `{ name, parent? }`. Accepting creates it, as the reviewer and
 * through the normal term REST permissions, then assigns it. A term created
 * by someone else since the suggestion was made is reused rather than
 * duplicated.
 */
import { store as coreStore } from '@wordpress/core-data';
import type { SuggestionOperation } from './operations';

/** A term a suggestion proposes, which does not exist yet. */
export interface ProposedNewTerm {
	name: string;
	parent?: number;
}

/**
 * Whether a terms operation value entry is a proposed new term.
 *
 * @param item An entry of a terms operation's value.
 * @return Whether it names a new term.
 */
export function isProposedNewTerm( item: unknown ): item is ProposedNewTerm {
	return (
		!! item &&
		typeof item === 'object' &&
		typeof ( item as ProposedNewTerm ).name === 'string'
	);
}

/**
 * Create the new terms post-level operations propose, and return the
 * operations with each new term replaced by its id. Operations without new
 * terms come back as they are. Rejects with the REST error when a term
 * cannot be created (the reviewer may not create terms in the taxonomy), in
 * which case nothing is assigned.
 *
 * @param registry The data registry.
 * @param postOps  Post-level operations.
 * @return The operations, holding term ids only.
 */
export async function createProposedTerms(
	registry: any,
	postOps: SuggestionOperation[]
): Promise< SuggestionOperation[] > {
	if (
		! postOps.some(
			( op ) =>
				Array.isArray( op.after ) && op.after.some( isProposedNewTerm )
		)
	) {
		return postOps;
	}
	const taxonomies: any[] =
		( await registry
			.resolveSelect( coreStore )
			.getTaxonomies( { per_page: -1 } ) ) ?? [];
	const { saveEntityRecord } = registry.dispatch( coreStore );

	const resolved: SuggestionOperation[] = [];
	for ( const op of postOps ) {
		if (
			! Array.isArray( op.after ) ||
			! op.after.some( isProposedNewTerm )
		) {
			resolved.push( op );
			continue;
		}
		const taxonomy = taxonomies.find(
			( item ) => item.rest_base === op.attribute
		);
		if ( ! taxonomy ) {
			throw new Error( 'Unknown taxonomy.' );
		}
		const after: number[] = [];
		for ( const item of op.after ) {
			if ( ! isProposedNewTerm( item ) ) {
				after.push( item );
				continue;
			}
			let id: number;
			try {
				const term = await saveEntityRecord(
					'taxonomy',
					taxonomy.slug,
					{
						name: item.name,
						...( item.parent ? { parent: item.parent } : {} ),
					},
					{ throwOnError: true }
				);
				id = term.id;
			} catch ( error: any ) {
				// Someone created it meanwhile: assign that one.
				if ( error?.code !== 'term_exists' || ! error.data?.term_id ) {
					throw error;
				}
				id = Number( error.data.term_id );
			}
			if ( ! after.includes( id ) ) {
				after.push( id );
			}
		}
		resolved.push( { ...op, after } );
	}
	return resolved;
}
