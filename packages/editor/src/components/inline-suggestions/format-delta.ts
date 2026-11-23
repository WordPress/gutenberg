/**
 * Formatting suggestions as deltas, the way Google Docs records them: each
 * suggestion keeps only the formats it added and removed, per character,
 * keyed by its id (`suggestedTextStyleChanges`). Several can sit on the same
 * words, so a reviewer can accept or reject each one alone.
 *
 * A character's displayed formatting is its base plus every pending delta on
 * it, applied in id order. The base is never stored: it is the display with
 * the pending deltas reverted in reverse id order. Each delta is kept
 * effective, describing only what it changes on top of the state below it,
 * so reverting it restores exactly that state. A decision rebuilds the
 * affected characters from the base and re-derives every remaining delta on
 * the new state below it, so the outcome follows id order, never decision
 * order. A delta that no longer changes anything has no effect left to
 * decide.
 *
 * Offsets count the characters that carry the suggestion's marker, in
 * document order, so a delta survives its run being split by other markers,
 * and losing characters only drops their offsets.
 */
import { select } from '@wordpress/data';
import {
	RichTextData,
	create,
	store as richTextStore,
} from '@wordpress/rich-text';
import {
	SUGGESTION_A11Y_FORMAT_NAME,
	compareSuggestionIds,
	isSuggestionFormat,
	suggestionMarkerId,
	suggestionMarkerListsAt,
} from './format';
import { hasDisallowedProtocol } from '../suggestion-mode/operations/url-scheme';

/**
 * A rich-text format as a delta records it: its type and attributes.
 */
export interface FormatDescriptor {
	type: string;
	attributes?: Record< string, string >;
	unregisteredAttributes?: Record< string, string >;
}

/**
 * What one suggestion changes on a run of its characters.
 */
export interface FormatDeltaRun {
	/** Offset among the characters carrying the suggestion's marker. */
	offset: number;
	/** Number of characters. */
	length: number;
	/** Formats the suggestion adds. */
	added: FormatDescriptor[];
	/** Formats the suggestion removes. */
	removed: FormatDescriptor[];
}

export type FormatDelta = FormatDeltaRun[];

/**
 * What one suggestion changes on one character.
 */
export interface FormatDeltaEntry {
	added: FormatDescriptor[];
	removed: FormatDescriptor[];
}

/**
 * The parts of a rich-text record a delta reads.
 */
interface FormatRecord {
	formats: any[];
	text: string;
	replacements?: any[];
}

const EMPTY_ENTRY: FormatDeltaEntry = { added: [], removed: [] };

/**
 * Whether a format is part of the text's formatting, rather than a
 * suggestion marker or the screen-reader role format added on render.
 *
 * @param format Rich-text format.
 * @return True for a content format.
 */
function isContentFormat( format: any ): boolean {
	return (
		!! format &&
		! isSuggestionFormat( format ) &&
		format.type !== SUGGESTION_A11Y_FORMAT_NAME
	);
}

/**
 * Comparison key of a format: type plus sorted attributes.
 *
 * @param format Rich-text format or descriptor.
 * @return Key.
 */
export function formatDescriptorKey( format: any ): string {
	const attributes = format?.attributes ?? {};
	const parts = Object.keys( attributes )
		.sort()
		.map( ( name ) => `${ name }=${ attributes[ name ] }` );
	return `${ format?.type }(${ parts.join( ',' ) })`;
}

function toDescriptor( format: any ): FormatDescriptor {
	const descriptor: FormatDescriptor = { type: format.type };
	if ( format.attributes && Object.keys( format.attributes ).length ) {
		descriptor.attributes = { ...format.attributes };
	}
	if (
		format.unregisteredAttributes &&
		Object.keys( format.unregisteredAttributes ).length
	) {
		descriptor.unregisteredAttributes = {
			...format.unregisteredAttributes,
		};
	}
	return descriptor;
}

/**
 * Whether a stored descriptor may name a format type: a registered content
 * format, never a suggestion marker. An unregistered type would serialize as
 * an element of that name.
 *
 * @param type Format type.
 * @return True when the type may be applied.
 */
function isAllowedFormatType( type: unknown ): type is string {
	return (
		typeof type === 'string' &&
		/^[a-z0-9-]+\/[a-z0-9-]+$/.test( type ) &&
		! type.startsWith( 'core/suggestion-' ) &&
		!! select( richTextStore ).getFormatType( type )
	);
}

/**
 * Keeps the string attributes of a stored descriptor that cannot run script:
 * no event handlers, inline frames or disallowed protocols. Another author
 * wrote the descriptor, and a reviewer's decision writes it into content.
 * Every value is checked for its protocol, since a format type can map any
 * attribute to `href`.
 *
 * @param attributes Descriptor attributes.
 * @return The safe attributes.
 */
function safeAttributes( attributes: unknown ): Record< string, string > {
	if ( ! attributes || typeof attributes !== 'object' ) {
		return {};
	}
	return Object.fromEntries(
		Object.entries( attributes ).filter(
			( entry ): entry is [ string, string ] =>
				typeof entry[ 1 ] === 'string' &&
				/^[a-z][a-z0-9_:.-]*$/i.test( entry[ 0 ] ) &&
				! /^(on|srcdoc$|formaction$)/i.test( entry[ 0 ] ) &&
				! hasDisallowedProtocol( entry[ 1 ] )
		)
	);
}

/**
 * Rebuilds the descriptors of a stored delta run, dropping any that name a
 * type a delta may not apply.
 *
 * @param formats Stored descriptors.
 * @return The safe descriptors.
 */
function sanitizeDescriptors( formats: unknown ): FormatDescriptor[] {
	if ( ! Array.isArray( formats ) ) {
		return [];
	}
	return formats
		.filter( ( format ) => isAllowedFormatType( format?.type ) )
		.map( ( format ) => {
			const descriptor: FormatDescriptor = { type: format.type };
			const attributes = safeAttributes( format.attributes );
			const unregistered = safeAttributes(
				format.unregisteredAttributes
			);
			if ( Object.keys( attributes ).length ) {
				descriptor.attributes = attributes;
			}
			if ( Object.keys( unregistered ).length ) {
				descriptor.unregisteredAttributes = unregistered;
			}
			return descriptor;
		} );
}

/**
 * Validates a delta read from a note, which another author wrote: runs need
 * whole, non-negative offsets and positive lengths and may not overlap, and
 * their formats go through `sanitizeDescriptors`.
 *
 * @param delta Stored delta.
 * @return The sanitized delta, or null when it is not a list.
 */
export function sanitizeFormatDelta( delta: unknown ): FormatDelta | null {
	if ( ! Array.isArray( delta ) ) {
		return null;
	}
	const runs: FormatDelta = [];
	let end = 0;
	const candidates = delta
		.filter(
			( run ) =>
				Number.isSafeInteger( run?.offset ) &&
				Number.isSafeInteger( run?.length ) &&
				run.offset >= 0 &&
				run.length > 0 &&
				Number.isSafeInteger( run.offset + run.length )
		)
		.sort( ( a, b ) => a.offset - b.offset );
	for ( const run of candidates ) {
		if ( run.offset < end ) {
			continue;
		}
		runs.push( {
			offset: run.offset,
			length: run.length,
			added: sanitizeDescriptors( run.added ),
			removed: sanitizeDescriptors( run.removed ),
		} );
		end = run.offset + run.length;
	}
	return runs;
}

function toFormat( descriptor: FormatDescriptor ): any {
	if ( ! isAllowedFormatType( descriptor.type ) ) {
		return null;
	}
	return {
		type: descriptor.type,
		...( descriptor.attributes && {
			attributes: safeAttributes( descriptor.attributes ),
		} ),
		...( descriptor.unregisteredAttributes && {
			unregisteredAttributes: safeAttributes(
				descriptor.unregisteredAttributes
			),
		} ),
	};
}

function isEmptyEntry( entry: FormatDeltaEntry ): boolean {
	return ! entry.added.length && ! entry.removed.length;
}

function entryKey( entry: FormatDeltaEntry ): string {
	return JSON.stringify( [
		entry.added.map( formatDescriptorKey ).sort(),
		entry.removed.map( formatDescriptorKey ).sort(),
	] );
}

/**
 * The content formats of one character's stack.
 *
 * @param stack Per-character format stack.
 * @return Content formats, in stack order.
 */
function contentFormatsOf( stack: any[] | undefined | null ): any[] {
	return ( stack ?? [] ).filter( isContentFormat );
}

/**
 * The difference between two content stacks.
 *
 * @param before Stack before.
 * @param after  Stack after.
 * @return Formats added and removed.
 */
function diffStacks( before: any[], after: any[] ): FormatDeltaEntry {
	const beforeKeys = new Set( before.map( formatDescriptorKey ) );
	const afterKeys = new Set( after.map( formatDescriptorKey ) );
	return {
		added: after
			.filter(
				( format ) => ! beforeKeys.has( formatDescriptorKey( format ) )
			)
			.map( toDescriptor ),
		removed: before
			.filter(
				( format ) => ! afterKeys.has( formatDescriptorKey( format ) )
			)
			.map( toDescriptor ),
	};
}

/**
 * Apply one character's entry to a content stack.
 *
 * @param stack Content formats.
 * @param entry Entry.
 * @return The new content formats.
 */
function applyEntry( stack: any[], entry: FormatDeltaEntry ): any[] {
	if ( isEmptyEntry( entry ) ) {
		return stack;
	}
	const removed = new Set( entry.removed.map( formatDescriptorKey ) );
	const kept = stack.filter(
		( format ) => ! removed.has( formatDescriptorKey( format ) )
	);
	const present = new Set( kept.map( formatDescriptorKey ) );
	return [
		...kept,
		...entry.added
			.filter(
				( format ) => ! present.has( formatDescriptorKey( format ) )
			)
			.map( toFormat )
			.filter( Boolean ),
	];
}

/**
 * Revert one character's entry from a content stack.
 *
 * @param stack Content formats.
 * @param entry Entry.
 * @return The content formats below the entry.
 */
function revertEntry( stack: any[], entry: FormatDeltaEntry ): any[] {
	return applyEntry( stack, { added: entry.removed, removed: entry.added } );
}

/**
 * The part of an entry that changes a given state.
 *
 * @param entry Entry.
 * @param below The state the entry applies to.
 * @return The effective entry.
 */
function effectiveEntry(
	entry: FormatDeltaEntry,
	below: any[]
): FormatDeltaEntry {
	const keys = new Set( below.map( formatDescriptorKey ) );
	return {
		added: entry.added.filter(
			( format ) => ! keys.has( formatDescriptorKey( format ) )
		),
		removed: entry.removed.filter( ( format ) =>
			keys.has( formatDescriptorKey( format ) )
		),
	};
}

/**
 * Compress per-character entries into runs, dropping empty ones.
 *
 * @param entries Entries by offset.
 * @return The delta.
 */
export function compressFormatDelta(
	entries: Array< FormatDeltaEntry | undefined >
): FormatDelta {
	const delta: FormatDelta = [];
	let previousKey: string | null = null;
	entries.forEach( ( entry, offset ) => {
		if ( ! entry || isEmptyEntry( entry ) ) {
			previousKey = null;
			return;
		}
		const key = entryKey( entry );
		const last = delta[ delta.length - 1 ];
		if (
			key === previousKey &&
			last &&
			last.offset + last.length === offset
		) {
			last.length++;
			return;
		}
		delta.push( {
			offset,
			length: 1,
			added: entry.added,
			removed: entry.removed,
		} );
		previousKey = key;
	} );
	return delta;
}

/**
 * Expand a delta into one entry per offset.
 *
 * @param delta  Delta.
 * @param length Number of characters the suggestion covers.
 * @return Entries by offset; an offset the delta does not name is empty.
 */
export function expandFormatDelta(
	delta: FormatDelta | null | undefined,
	length: number
): FormatDeltaEntry[] {
	const entries: FormatDeltaEntry[] = Array.from(
		{ length },
		() => EMPTY_ENTRY
	);
	for ( const run of sanitizeFormatDelta( delta ) ?? [] ) {
		const entry = { added: run.added, removed: run.removed };
		const end = Math.min( run.offset + run.length, length );
		for ( let offset = run.offset; offset < end; offset++ ) {
			entries[ offset ] = entry;
		}
	}
	return entries;
}

/**
 * Whether a delta changes nothing.
 *
 * @param delta Delta.
 * @return True when empty.
 */
export function isEmptyFormatDelta(
	delta: FormatDelta | null | undefined
): boolean {
	return ! ( Array.isArray( delta ) ? delta : [] ).some(
		( run ) =>
			run?.length > 0 && ( run.added?.length || run.removed?.length )
	);
}

/**
 * Drop the offsets of characters that left a suggestion's run, so its delta
 * keeps describing the characters that remain.
 *
 * @param delta   Delta.
 * @param offsets Offsets that were removed.
 * @return The rebased delta.
 */
export function rebaseFormatDelta(
	delta: FormatDelta,
	offsets: number[]
): FormatDelta {
	const runs = sanitizeFormatDelta( delta ) ?? [];
	const gone = [ ...new Set( offsets ) ]
		.filter( ( offset ) => Number.isSafeInteger( offset ) && offset >= 0 )
		.sort( ( a, b ) => a - b );
	if ( ! gone.length ) {
		return runs;
	}
	// How many removed offsets come before an offset.
	const removedBefore = ( offset: number ) => {
		let low = 0;
		let high = gone.length;
		while ( low < high ) {
			const middle = Math.floor( ( low + high ) / 2 );
			if ( gone[ middle ] < offset ) {
				low = middle + 1;
			} else {
				high = middle;
			}
		}
		return low;
	};
	/*
	 * Split each run around the removed offsets and shift what is left, so the
	 * work follows the runs and the removals, never the offsets a stored run
	 * claims.
	 */
	const rebased: FormatDelta = [];
	const push = ( run: FormatDeltaRun, start: number, end: number ) => {
		if ( start >= end || isEmptyEntry( run ) ) {
			return;
		}
		const offset = start - removedBefore( start );
		const last = rebased[ rebased.length - 1 ];
		if (
			last &&
			last.offset + last.length === offset &&
			entryKey( last ) === entryKey( run )
		) {
			last.length += end - start;
			return;
		}
		rebased.push( {
			offset,
			length: end - start,
			added: run.added,
			removed: run.removed,
		} );
	};
	for ( const run of runs ) {
		const end = run.offset + run.length;
		let start = run.offset;
		for (
			let index = removedBefore( start );
			index < gone.length && gone[ index ] < end;
			index++
		) {
			push( run, start, gone[ index ] );
			start = gone[ index ] + 1;
		}
		push( run, start, end );
	}
	return rebased;
}

/**
 * The indices of the characters carrying a format suggestion's marker, in
 * document order.
 *
 * @param record Rich-text record.
 * @param id     Suggestion id.
 * @return Character indices.
 */
export function formatSuggestionIndices(
	record: FormatRecord,
	id: number | string
): number[] {
	const target = String( id );
	const indices: number[] = [];
	for ( let i = 0; i < record.text.length; i++ ) {
		if (
			suggestionMarkerListsAt( record.formats[ i ] ).format.some(
				( marker ) => suggestionMarkerId( marker ) === target
			)
		) {
			indices.push( i );
		}
	}
	return indices;
}

/**
 * The delta between two records over the given characters, which hold the
 * same text in both.
 *
 * @param prev    Record before the change.
 * @param next    Record after the change.
 * @param indices Character indices, in document order.
 * @return The delta, offsets counting `indices`.
 */
export function computeFormatDelta(
	prev: FormatRecord,
	next: FormatRecord,
	indices: number[]
): FormatDelta {
	return compressFormatDelta(
		indices.map( ( index ) =>
			diffStacks(
				contentFormatsOf( prev.formats[ index ] ),
				contentFormatsOf( next.formats[ index ] )
			)
		)
	);
}

/**
 * Derive a formatting suggestion's delta from the original run it recorded,
 * for a suggestion written before deltas were.
 *
 * @param value      Block attribute value carrying the suggestion's marker.
 * @param id         Suggestion id.
 * @param beforeHTML Recorded original run.
 * @return The delta, or null when the original no longer describes the run.
 */
export function formatDeltaFromOriginal(
	value: any,
	id: number | string,
	beforeHTML: string
): FormatDelta | null {
	const record = toRecord( value );
	if ( ! record ) {
		return null;
	}
	const indices = formatSuggestionIndices( record, id );
	const original = create( { html: beforeHTML ?? '' } );
	if (
		original.text !==
		indices.map( ( index ) => record.text[ index ] ).join( '' )
	) {
		return null;
	}
	return compressFormatDelta(
		indices.map( ( index, offset ) =>
			diffStacks(
				contentFormatsOf( original.formats[ offset ] ),
				contentFormatsOf( record.formats[ index ] )
			)
		)
	);
}

function toRecord( value: any ): FormatRecord | null {
	if ( value instanceof RichTextData ) {
		return { formats: value.formats.slice(), text: value.text };
	}
	if ( typeof value === 'string' ) {
		return create( { html: value } );
	}
	if (
		value &&
		typeof value.text === 'string' &&
		Array.isArray( value.formats )
	) {
		return value;
	}
	return null;
}

/**
 * How one formatting suggestion reads after another's decision.
 */
export interface FormatRevision {
	/** The effective delta. */
	delta: FormatDelta;
	/** HTML of the suggestion's run as it would be without it. */
	beforeHTML: string;
	/** HTML of the suggestion's run as displayed. */
	afterHTML: string;
}

export interface FormatDecisionResult {
	/** Per-character stacks after the decision. */
	formats: any[];
	/** Other suggestions whose delta or original changed. */
	revisions: Map< string, FormatRevision >;
	/** Other suggestions left with no effect. */
	emptied: string[];
}

/**
 * Serialize a set of characters with the given content formats, markers
 * left out.
 *
 * @param record  Rich-text record.
 * @param indices Character indices.
 * @param stacks  Content formats per index.
 * @return HTML.
 */
function charactersToHTML(
	record: FormatRecord,
	indices: number[],
	stacks: Map< number, any[] >
): string {
	const formats: any[] = [];
	indices.forEach( ( index, offset ) => {
		const stack = stacks.get( index ) ?? [];
		if ( stack.length ) {
			formats[ offset ] = stack;
		}
	} );
	unifyFormatObjects( formats );
	return new RichTextData( {
		text: indices.map( ( index ) => record.text[ index ] ).join( '' ),
		formats,
		replacements: indices.map(
			( index ) => record.replacements?.[ index ]
		),
	} as any ).toHTMLString();
}

/**
 * Share one object between adjacent characters for the same format, as rich
 * text does, so a run serializes as one element rather than one per
 * character.
 *
 * @param formats Per-character stacks, changed in place.
 */
function unifyFormatObjects( formats: any[] ) {
	let previous: any[] = [];
	for ( let index = 0; index < formats.length; index++ ) {
		const stack = formats[ index ];
		if ( ! Array.isArray( stack ) ) {
			previous = [];
			continue;
		}
		const byKey = new Map(
			previous.map( ( format ) => [
				format.type + formatDescriptorKey( format ),
				format,
			] )
		);
		const unified = stack.map(
			( format ) =>
				byKey.get( format.type + formatDescriptorKey( format ) ) ??
				format
		);
		if ( unified.some( ( format, i ) => format !== stack[ i ] ) ) {
			formats[ index ] = unified;
		}
		previous = formats[ index ];
	}
}

/**
 * Decide one formatting suggestion and rebuild the formatting of every
 * character it shares with other formatting suggestions.
 *
 * Each character is taken back to its base by reverting its pending deltas in
 * reverse id order. Accepting folds the decided delta into the base;
 * rejecting drops it. The remaining deltas are then applied in id order, each
 * reduced to what it still changes on the state below it. A suggestion whose
 * delta changes nothing anywhere is reported as emptied.
 *
 * @param record           Rich-text record.
 * @param options          Options.
 * @param options.id       Suggestion decided.
 * @param options.decision Accept or reject.
 * @param options.deltaOf  The delta of a pending formatting suggestion by id.
 * @return The result, or null when a delta on the way is unknown.
 */
export function decideFormatSuggestion(
	record: FormatRecord,
	{
		id,
		decision,
		deltaOf,
	}: {
		id: number | string;
		decision: 'accept' | 'reject';
		deltaOf: ( id: string ) => FormatDelta | null | undefined;
	}
): FormatDecisionResult | null {
	const target = String( id );

	// Every format suggestion's characters, in document order.
	const positions = new Map< string, number[] >();
	for ( let i = 0; i < record.text.length; i++ ) {
		for ( const marker of suggestionMarkerListsAt( record.formats[ i ] )
			.format ) {
			const markerId = suggestionMarkerId( marker );
			const list = positions.get( markerId ) ?? [];
			if ( list[ list.length - 1 ] !== i ) {
				list.push( i );
			}
			positions.set( markerId, list );
		}
	}
	const decided = positions.get( target ) ?? [];

	// The suggestions linked to the decided one through shared characters,
	// since rebuilding a character needs every delta on it.
	const involved = new Set< string >( [ target ] );
	const queue = [ ...decided ];
	const visited = new Set< number >();
	while ( queue.length ) {
		const index = queue.pop()!;
		if ( visited.has( index ) ) {
			continue;
		}
		visited.add( index );
		for ( const marker of suggestionMarkerListsAt( record.formats[ index ] )
			.format ) {
			const markerId = suggestionMarkerId( marker );
			if ( ! involved.has( markerId ) ) {
				involved.add( markerId );
				queue.push( ...( positions.get( markerId ) ?? [] ) );
			}
		}
	}
	const entries = new Map< string, FormatDeltaEntry[] >();
	for ( const markerId of involved ) {
		const delta = deltaOf( markerId );
		if ( ! delta ) {
			return null;
		}
		entries.set(
			markerId,
			expandFormatDelta( delta, positions.get( markerId )?.length ?? 0 )
		);
	}
	const characters = new Set< number >();
	for ( const markerId of involved ) {
		for ( const index of positions.get( markerId ) ?? [] ) {
			characters.add( index );
		}
	}

	const offsetOf = new Map< string, Map< number, number > >();
	for ( const markerId of involved ) {
		offsetOf.set(
			markerId,
			new Map(
				( positions.get( markerId ) ?? [] ).map( ( index, offset ) => [
					index,
					offset,
				] )
			)
		);
	}

	const formats = record.formats.slice();
	const below = new Map< string, Map< number, any[] > >();
	const display = new Map< string, Map< number, any[] > >();
	const nextEntries = new Map< string, FormatDeltaEntry[] >();
	for ( const markerId of involved ) {
		if ( markerId !== target ) {
			below.set( markerId, new Map() );
			display.set( markerId, new Map() );
			nextEntries.set( markerId, entries.get( markerId )!.slice() );
		}
	}

	for ( const index of [ ...characters ].sort( ( a, b ) => a - b ) ) {
		const stack: any[] = record.formats[ index ] ?? [];
		const pending = suggestionMarkerListsAt( stack )
			.format.map( suggestionMarkerId )
			.sort( compareSuggestionIds );
		const entryAt = ( markerId: string ) =>
			entries.get( markerId )![
				offsetOf.get( markerId )!.get( index )!
			] ?? EMPTY_ENTRY;

		let state = contentFormatsOf( stack );
		for ( const markerId of [ ...pending ].reverse() ) {
			state = revertEntry( state, entryAt( markerId ) );
		}
		/*
		 * An accepted change settles the formats it touches: an older pending
		 * change can no longer decide them, since the newer one applies after
		 * it. Folding it into the base then commutes with the older ones.
		 */
		let settled = new Set< string >();
		if ( decision === 'accept' && pending.includes( target ) ) {
			const decidedEntry = entryAt( target );
			settled = new Set(
				[ ...decidedEntry.added, ...decidedEntry.removed ].map(
					formatDescriptorKey
				)
			);
			state = applyEntry( state, decidedEntry );
		}
		for ( const markerId of pending ) {
			if ( markerId === target ) {
				continue;
			}
			const offset = offsetOf.get( markerId )!.get( index )!;
			below.get( markerId )!.set( index, state );
			let entry = entryAt( markerId );
			if (
				settled.size &&
				compareSuggestionIds( markerId, target ) < 0
			) {
				const open = ( format: FormatDescriptor ) =>
					! settled.has( formatDescriptorKey( format ) );
				entry = {
					added: entry.added.filter( open ),
					removed: entry.removed.filter( open ),
				};
			}
			const effective = effectiveEntry( entry, state );
			nextEntries.get( markerId )![ offset ] = effective;
			state = applyEntry( state, effective );
			display.get( markerId )!.set( index, state );
		}
		const markers = stack.filter( isSuggestionFormat );
		const next = [ ...markers, ...state ];
		if ( next.length ) {
			formats[ index ] = next;
		} else {
			delete formats[ index ];
		}
	}

	unifyFormatObjects( formats );

	const revisions = new Map< string, FormatRevision >();
	const emptied: string[] = [];
	for ( const [ markerId, list ] of nextEntries ) {
		const delta = compressFormatDelta( list );
		if ( isEmptyFormatDelta( delta ) ) {
			emptied.push( markerId );
			continue;
		}
		const indices = positions.get( markerId ) ?? [];
		const changedDelta =
			JSON.stringify( delta ) !==
			JSON.stringify(
				compressFormatDelta( entries.get( markerId ) ?? [] )
			);
		const changedBelow = compareSuggestionIds( target, markerId ) < 0;
		if ( ! changedDelta && ! changedBelow ) {
			continue;
		}
		revisions.set( markerId, {
			delta,
			beforeHTML: charactersToHTML(
				record,
				indices,
				below.get( markerId )!
			),
			afterHTML: charactersToHTML(
				record,
				indices,
				display.get( markerId )!
			),
		} );
	}

	return { formats, revisions, emptied };
}
