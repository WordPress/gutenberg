/**
 * What a decision on one inline suggestion does to the others.
 *
 * Resolution follows one rule, with no parent/child graph to keep:
 * accepting a deletion or rejecting an addition removes characters, and every
 * other pending suggestion that loses characters shrinks, or is emptied when
 * it loses all of them. Rejecting someone's addition therefore empties the
 * deletions and formatting changes nested in it, accepting it leaves them
 * pending, and accepting a deletion inside it shrinks the addition.
 *
 * Nothing here touches notes: the caller turns an emptied suggestion into an
 * outdated note (or trashes its own), and writes rebased originals for the
 * formatting changes that shrank.
 */
import {
	RichTextData,
	create,
	remove,
	toHTMLString,
} from '@wordpress/rich-text';
import {
	SUGGESTION_ID_ATTRIBUTE,
	SUGGESTION_TYPE_FORMAT,
	suggestionKindOf,
	suggestionMarkersIn,
} from './format';
import type { SuggestionMarkerKind } from './format';
import { toRichTextRecord } from './rich-text-record';
import {
	formatOriginalAligns,
	acceptInlineAddition,
	acceptInlineDeletion,
	acceptInlineFormat,
	rejectInlineAddition,
	rejectInlineDeletion,
	rejectInlineFormat,
	suggestionMarkerRuns,
} from './operations';

export type InlineSuggestionType = 'add' | 'del' | 'format';

export interface ResolutionEffect {
	/** The value after the decision. */
	value: any;
	/** Ranges of the previous value whose characters the decision removed. */
	removed: Array< [ number, number ] >;
	/** Other suggestions that lost characters, in order of appearance. */
	affected: Map< string, 'shrunk' | 'emptied' >;
	/**
	 * For each formatting change that lost characters, their offsets within
	 * its run, for `rebaseFormatOriginal`.
	 */
	formatRemovals: Map< string, number[] >;
	/**
	 * For a rejected formatting change, whether its original could be
	 * restored; false means only the marker was dropped.
	 */
	restored?: boolean;
}

/**
 * The marker kind a decision removes the characters of, if any.
 *
 * @param suggestionType Inline suggestion type.
 * @param decision       The decision.
 * @return Kind whose characters go, or null when none do.
 */
function removedKind(
	suggestionType: InlineSuggestionType,
	decision: 'accept' | 'reject'
): SuggestionMarkerKind | null {
	if ( decision === 'accept' ) {
		return suggestionType === 'del' ? 'del' : null;
	}
	return suggestionType === 'add' ? 'add' : null;
}

/**
 * Apply a decision on one inline suggestion and report what it did to the
 * others.
 *
 * @param value                  Block attribute value.
 * @param options                Options.
 * @param options.id             Suggestion (note) id.
 * @param options.suggestionType Inline suggestion type from the payload.
 * @param options.decision       Accept or reject.
 * @param options.beforeHTML     Recorded original, for rejecting a format.
 * @return The effect.
 */
export function resolveInlineSuggestion(
	value: any,
	{
		id,
		suggestionType,
		decision,
		beforeHTML,
	}: {
		id: number | string;
		suggestionType: InlineSuggestionType;
		decision: 'accept' | 'reject';
		beforeHTML?: string;
	}
): ResolutionEffect {
	const target = String( id );
	const kind = removedKind( suggestionType, decision );
	const removed = kind ? suggestionMarkerRuns( value, id, kind ) : [];

	let next;
	let restored: boolean | undefined;
	if ( decision === 'accept' ) {
		next = {
			add: acceptInlineAddition,
			del: acceptInlineDeletion,
			format: acceptInlineFormat,
		}[ suggestionType ]( value, id );
	} else if ( suggestionType === SUGGESTION_TYPE_FORMAT ) {
		restored = formatOriginalAligns( value, id, beforeHTML ?? '' );
		next = rejectInlineFormat( value, id, beforeHTML ?? '' );
	} else {
		next = {
			add: rejectInlineAddition,
			del: rejectInlineDeletion,
		}[ suggestionType ]( value, id );
	}

	const affected = new Map< string, 'shrunk' | 'emptied' >();
	const formatRemovals = new Map< string, number[] >();
	const record = toRichTextRecord( value );
	if ( record && removed.length ) {
		const isRemoved = ( index: number ) =>
			removed.some( ( [ start, end ] ) => index >= start && index < end );
		const total = new Map< string, number >();
		const lost = new Map< string, number >();
		const formatPosition = new Map< string, number >();
		for ( let i = 0; i < record.text.length; i++ ) {
			const gone = isRemoved( i );
			for ( const marker of suggestionMarkersIn( record.formats[ i ] ) ) {
				const markerId = String(
					marker.attributes?.[ SUGGESTION_ID_ATTRIBUTE ]
				);
				if ( markerId === target ) {
					continue;
				}
				total.set( markerId, ( total.get( markerId ) ?? 0 ) + 1 );
				const isFormat =
					suggestionKindOf( marker ) === SUGGESTION_TYPE_FORMAT;
				const position = formatPosition.get( markerId ) ?? 0;
				if ( isFormat ) {
					formatPosition.set( markerId, position + 1 );
				}
				if ( ! gone ) {
					continue;
				}
				lost.set( markerId, ( lost.get( markerId ) ?? 0 ) + 1 );
				if ( ! affected.has( markerId ) ) {
					affected.set( markerId, 'shrunk' );
				}
				if ( isFormat ) {
					formatRemovals.set( markerId, [
						...( formatRemovals.get( markerId ) ?? [] ),
						position,
					] );
				}
			}
		}
		for ( const markerId of affected.keys() ) {
			if ( lost.get( markerId ) === total.get( markerId ) ) {
				affected.set( markerId, 'emptied' );
				formatRemovals.delete( markerId );
			}
		}
	}

	return {
		value: next,
		removed,
		affected,
		formatRemovals,
		...( restored !== undefined && { restored } ),
	};
}

/**
 * Remove characters from a formatting change's recorded original, so it keeps
 * describing its run after characters left the run (an accepted deletion
 * inside it, a rejected addition around part of it).
 *
 * @param beforeHTML Recorded original run.
 * @param offsets    Offsets within the run that were removed.
 * @return The rebased original.
 */
export function rebaseFormatOriginal(
	beforeHTML: string,
	offsets: number[]
): string {
	if ( ! offsets.length ) {
		return beforeHTML;
	}
	let record: any = create( { html: beforeHTML } );
	for ( const offset of [ ...offsets ].sort( ( a, b ) => b - a ) ) {
		record = remove( record, offset, offset + 1 );
	}
	return toHTMLString( { value: record } );
}

/**
 * The suggestions a decision would empty, without applying it. Used to warn a
 * reviewer before they reject an addition that others suggested changes in.
 *
 * @param value   Block attribute value.
 * @param options Same as `resolveInlineSuggestion`.
 * @return Ids of the suggestions that would be emptied.
 */
export function suggestionsEmptiedBy(
	value: any,
	options: Parameters< typeof resolveInlineSuggestion >[ 1 ]
): string[] {
	if ( ! ( value instanceof RichTextData ) && typeof value !== 'string' ) {
		return [];
	}
	return [ ...resolveInlineSuggestion( value, options ).affected ]
		.filter( ( [ , change ] ) => change === 'emptied' )
		.map( ( [ markerId ] ) => markerId );
}

export { formatOriginalAligns };
