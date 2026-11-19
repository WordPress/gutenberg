/**
 * Context lines for a suggestion that overlaps others: it sits inside
 * someone's addition, its addition holds others' suggestions, or it is only
 * partly inside someone's addition. For a pending addition that holds others'
 * suggestions, a consequence line says what rejecting it does to them.
 */
import { __, _n, sprintf } from '@wordpress/i18n';
import type { SuggestionRelations } from '../inline-suggestions';

/**
 * The context lines for a suggestion, in display order.
 *
 * @param args              Arguments.
 * @param args.relations    From `suggestionRelations`.
 * @param args.emptiedCount How many suggestions rejecting this one empties.
 * @param args.nameOf       Display name of a note's author, by note id.
 * @param args.isResolved   Whether this suggestion has been decided.
 * @return Lines of text.
 */
export function suggestionContextLines( {
	relations,
	emptiedCount,
	nameOf,
	isResolved = false,
}: {
	relations: SuggestionRelations;
	emptiedCount: number;
	nameOf: ( noteId: string ) => string | undefined;
	isResolved?: boolean;
} ): string[] {
	const lines: string[] = [];
	if ( relations.parent ) {
		const name = nameOf( relations.parent.id );
		lines.push(
			name
				? sprintf(
						/* translators: %s: name of the person who suggested the addition. */
						__( 'Inside a suggested addition by %s' ),
						name
					)
				: __( 'Inside another suggested addition' )
		);
	}
	for ( const outer of relations.partlyIn ) {
		const name = nameOf( outer.id );
		lines.push(
			name
				? sprintf(
						/* translators: %s: name of the person who suggested the addition. */
						__( 'Partly inside a suggested addition by %s' ),
						name
					)
				: __( 'Partly inside another suggested addition' )
		);
	}
	const count = relations.children.length;
	if ( count ) {
		lines.push(
			sprintf(
				/* translators: %d: number of suggestions. */
				_n(
					'Includes %d suggestion from others',
					'Includes %d suggestions from others',
					count
				),
				count
			)
		);
	}
	if ( ! isResolved && emptiedCount ) {
		lines.push(
			sprintf(
				/* translators: %d: number of suggestions. */
				_n(
					'Rejecting also makes %d suggestion outdated.',
					'Rejecting also makes %d suggestions outdated.',
					emptiedCount
				),
				emptiedCount
			)
		);
	}
	return lines;
}
