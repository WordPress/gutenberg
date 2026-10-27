/**
 * Context lines for a suggestion that overlaps others: it sits inside other
 * people's additions, its addition holds others' suggestions, it is only
 * partly inside someone's addition, someone else also suggested deleting
 * the same text, or it changes formatting someone else already suggested. For a pending addition that holds others' suggestions, a
 * consequence line says what rejecting it does to them.
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
	const parentNames = relations.parents.map( ( { id } ) => nameOf( id ) );
	if ( parentNames.length === 1 ) {
		lines.push(
			parentNames[ 0 ]
				? sprintf(
						/* translators: %s: name of the person who suggested the addition. */
						__( 'Inside a suggested addition by %s' ),
						parentNames[ 0 ]
					)
				: __( 'Inside another suggested addition' )
		);
	} else if ( parentNames.length > 1 ) {
		lines.push(
			parentNames.every( Boolean )
				? sprintf(
						/* translators: %s: comma-separated names of the people who suggested the additions. */
						__( 'Inside suggested additions by %s' ),
						parentNames.join( ', ' )
					)
				: sprintf(
						/* translators: %d: number of suggested additions. */
						__( 'Inside %d other suggested additions' ),
						parentNames.length
					)
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
	for ( const other of relations.alsoDeleting ) {
		const name = nameOf( other.id );
		lines.push(
			name
				? sprintf(
						/* translators: %s: name of the person who also suggested deleting the text. */
						__( '%s also suggested deleting this text' ),
						name
					)
				: __( 'Someone else also suggested deleting this text' )
		);
	}
	for ( const other of relations.builtOn ) {
		const name = nameOf( other.id );
		lines.push(
			name
				? sprintf(
						/* translators: %s: name of the person who suggested the earlier formatting change. */
						__( 'Built on a suggested formatting change by %s' ),
						name
					)
				: __( 'Built on another suggested formatting change' )
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

/**
 * The context lines for a block suggestion that shares its block with other
 * authors' suggestions: who else suggested what, and, for a suggested block,
 * that rejecting it outdates what others suggested on it.
 *
 * @param args            Arguments.
 * @param args.markers    The block's markers, outermost first.
 * @param args.noteId     This suggestion's note id.
 * @param args.nameOf     Display name of a note's author, by note id.
 * @param args.isResolved Whether this suggestion has been decided.
 * @return Lines of text.
 */
export function blockSuggestionContextLines( {
	markers,
	noteId,
	nameOf,
	isResolved = false,
}: {
	markers: Array< { type: string; commentId?: number | string } >;
	noteId: string;
	nameOf: ( noteId: string ) => string | undefined;
	isResolved?: boolean;
} ): string[] {
	const own = markers.find(
		( marker ) => String( marker.commentId ) === String( noteId )
	);
	if ( ! own || markers.length < 2 ) {
		return [];
	}
	const lines: string[] = [];
	for ( const marker of markers ) {
		if ( marker === own ) {
			continue;
		}
		const name =
			marker.commentId !== undefined
				? nameOf( String( marker.commentId ) )
				: undefined;
		switch ( marker.type ) {
			case 'pending-insert':
				lines.push(
					name
						? sprintf(
								/* translators: %s: name of the person who suggested the block. */
								__( '%s suggested adding this block' ),
								name
							)
						: __( 'Someone else suggested adding this block' )
				);
				break;
			case 'pending-remove':
				lines.push(
					name
						? sprintf(
								/* translators: %s: name of the person who suggested removing the block. */
								__( '%s also suggested removing this block' ),
								name
							)
						: __(
								'Someone else also suggested removing this block'
							)
				);
				break;
			case 'pending-move':
				lines.push(
					name
						? sprintf(
								/* translators: %s: name of the person who suggested moving the block. */
								__( '%s also suggested moving this block' ),
								name
							)
						: __( 'Someone else also suggested moving this block' )
				);
				break;
			default:
				lines.push(
					name
						? sprintf(
								/* translators: %s: name of the person who suggested the changes. */
								__( '%s also suggested changes to this block' ),
								name
							)
						: __(
								'Someone else also suggested changes to this block'
							)
				);
		}
	}
	if ( ! isResolved && own.type === 'pending-insert' ) {
		const count = markers.length - 1;
		lines.push(
			sprintf(
				/* translators: %d: number of suggestions. */
				_n(
					'Rejecting also makes %d suggestion outdated.',
					'Rejecting also makes %d suggestions outdated.',
					count
				),
				count
			)
		);
	}
	return lines;
}
