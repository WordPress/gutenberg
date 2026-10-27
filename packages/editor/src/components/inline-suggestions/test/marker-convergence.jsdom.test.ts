/**
 * Real-time collaboration: peers make overlapping suggestions and decide
 * different ones at the same time, their HTML strings merge character by
 * character, and each peer runs the marker guard on the merged value. The
 * peers must settle on one canonical value without trading corrections, and
 * what that value publishes must be what the suggestions mean.
 *
 * Seeded: a failure prints its seed. `OVERLAP_CONVERGENCE_RUNS=10000` runs
 * more interleavings, `OVERLAP_CONVERGENCE_SEED=<n>` replays one, and
 * `OVERLAP_CONVERGENCE_REPORT=1` / `OVERLAP_CONVERGENCE_TRACE=1` print the
 * outcome counts and each round.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RichTextData, create, toHTMLString } from '@wordpress/rich-text';
import {
	addSuggestionMarker,
	registerSuggestionFormat,
	suggestionMarkerId,
	suggestionMarkerListsAt,
	unregisterSuggestionFormats,
} from '../format';
import {
	buildSuggestionMarkerAttributes,
	insertInlineAddition,
} from '../operations';
import { resolveInlineSuggestion } from '../resolution';
import {
	guardSyncedValue,
	isCanonicalSuggestionStack,
} from '../marker-integrity';
import {
	diffMarkup,
	diffStrings,
	mergeStrings,
} from './fixtures/html-string-merge';
import type { StringEdit } from './fixtures/html-string-merge';
import { lcg, published as oraclePublished } from './fixtures/overlap-oracle';
import type { Decision, OracleState } from './fixtures/overlap-oracle';

type Diff = ( a: string, b: string ) => StringEdit;
type Kind = 'add' | 'del' | 'format';
type Lists = { add: string[]; del: string[]; format: string[] };
const KINDS: Kind[] = [ 'add', 'del', 'format' ];

const RUNS = Number( process.env.OVERLAP_CONVERGENCE_RUNS ) || 60;
const ONLY_SEED = Number( process.env.OVERLAP_CONVERGENCE_SEED ) || 0;
const MAX_ROUNDS = 8;
// Room for a long local run; the default run takes well under a second.
const TIMEOUT = Math.max( 5000, RUNS * 3 );

const marker = ( kind: Kind, id: number, authorId: number ) => ( {
	type: `core/suggestion-${ kind }`,
	attributes: buildSuggestionMarkerAttributes( { id, type: kind, authorId } ),
} );

const html = ( record: any ) => toHTMLString( { value: record } );

/**
 * Marker ids per character, keyed by the character itself: every text
 * character is unique.
 *
 * @param record Rich-text record.
 * @return Lists by character.
 */
function membership( record: any ): Map< string, Lists > {
	const chars = new Map< string, Lists >();
	[ ...record.text ].forEach( ( ch: string, index: number ) => {
		const lists = suggestionMarkerListsAt( record.formats[ index ] );
		chars.set( ch, {
			add: lists.add.map( suggestionMarkerId ).sort(),
			del: lists.del.map( suggestionMarkerId ).sort(),
			format: lists.format.map( suggestionMarkerId ).sort(),
		} );
	} );
	return chars;
}

/**
 * The published text for a decision on every suggestion, by the oracle.
 *
 * @param text     Characters in order.
 * @param chars    Membership per character.
 * @param accepted Accepted ids; every other id is rejected.
 * @return Published text.
 */
function published(
	text: string[],
	chars: Map< string, Lists >,
	accepted: Set< string >
): string {
	const state: OracleState = {
		chars: text.map( ( ch ) => ( {
			ch,
			base: [],
			ins: chars.get( ch )!.add,
			del: chars.get( ch )!.del,
			fmt: chars.get( ch )!.format,
			deltas: {},
		} ) ),
		suggestions: [],
	};
	const ids = new Set(
		[ ...chars.values() ].flatMap( ( l ) => [
			...l.add,
			...l.del,
			...l.format,
		] )
	);
	const assignment: Record< string, Decision > = {};
	ids.forEach( ( id ) => {
		assignment[ id ] = accepted.has( id ) ? 'accept' : 'reject';
	} );
	return oraclePublished( state, assignment );
}

interface Outcome {
	seed: number;
	rounds: number;
	quiesced: boolean;
	canonical: boolean;
	leaked: boolean;
	final: string;
	/** Characters whose membership differs from what the peers meant. */
	drift: string[];
	viewsMatch: boolean;
}

/**
 * One interleaving: a base value, 2 or 3 peers each making 1 to 3 changes
 * concurrently, merge, then guard rounds until no peer writes.
 *
 * @param seed     Seed.
 * @param diff     How a peer's change is turned into an edit of the string.
 * @param disjoint Whether each peer keeps to its own stretch of the text.
 * @return What happened.
 */
function runInterleaving(
	seed: number,
	diff: Diff,
	disjoint = false
): Outcome {
	const random = lcg( seed );
	const pick = ( n: number ) => Math.floor( random() * n );
	let nextChar = 0x4e00;
	const fresh = ( n: number ) =>
		Array.from( { length: n }, () =>
			String.fromCharCode( nextChar++ )
		).join( '' );

	// Peer `p` is user `p + 1`; a base suggestion can be by a user who is
	// not online.
	const peerCount = 2 + pick( 2 );

	// Base: unique characters, up to two pending suggestions.
	let base: any = create( {
		text: fresh( disjoint ? 5 * peerCount + pick( 4 ) : 6 + pick( 7 ) ),
	} );
	const baseText = base.text;
	// In disjoint runs peer `p` keeps inside the base characters
	// `[ lo, hi )` of its stretch, one character in from either end.
	const stretch = Math.floor( baseText.length / peerCount );
	const bounds = ( peer: number ) => [
		peer * stretch + 1,
		( peer + 1 ) * stretch - 1,
	];
	const owner = new Map< string, number >();
	const kinds = new Map< string, Kind >();
	const baseCount = pick( 3 );
	for ( let i = 1; i <= baseCount; i++ ) {
		const kind = KINDS[ pick( 3 ) ];
		const [ lo, hi ] = disjoint
			? bounds( i % peerCount )
			: [ 0, base.text.length ];
		owner.set( String( i ), i % peerCount );
		const start = lo + pick( hi - lo );
		const end = Math.min( hi, start + 1 + pick( 4 ) );
		base = addSuggestionMarker(
			base,
			marker( kind, i, 1 + pick( peerCount + 1 ) ),
			start,
			end
		);
		kinds.set( String( i ), kind );
	}
	const baseHTML = html( base );
	const baseChars = membership( base );

	const claimed = new Set< string >();
	const decided = new Set< string >();
	const locals: any[] = [];
	for ( let peer = 0; peer < peerCount; peer++ ) {
		let value: any = RichTextData.fromHTMLString( baseHTML );
		const ops = 1 + pick( 3 );
		for ( let op = 0; op < ops; op++ ) {
			const id = 100 * ( peer + 1 ) + op;
			const roll = random();
			let lo = 0;
			let hi = value.text.length;
			if ( disjoint ) {
				// The stretch in the current value: after the character before
				// it, up to the character after it.
				const [ first, last ] = bounds( peer );
				lo = value.text.indexOf( baseText[ first - 1 ] ) + 1;
				hi = value.text.indexOf( baseText[ last ] );
			}
			const length = hi - lo;
			const decidable = [ ...kinds.keys() ].filter(
				( candidate ) =>
					Number( candidate ) < 100 &&
					kinds.get( candidate ) !== 'format' &&
					! claimed.has( candidate ) &&
					( ! disjoint || owner.get( candidate ) === peer ) &&
					value
						.toHTMLString()
						.includes( `data-suggestion-id="${ candidate }"` )
			);
			if ( roll < 0.25 && decidable.length ) {
				const target = decidable[ pick( decidable.length ) ];
				claimed.add( target );
				decided.add( target );
				value = resolveInlineSuggestion( value, {
					id: target,
					suggestionType: kinds.get( target )!,
					decision: random() < 0.5 ? 'accept' : 'reject',
				} ).value;
			} else if ( roll < 0.6 || ! length ) {
				value = insertInlineAddition( value, {
					text: fresh( 1 + pick( 2 ) ),
					attributes: marker( 'add', id, peer + 1 ).attributes,
					start: lo + pick( length + 1 ),
				} );
				kinds.set( String( id ), 'add' );
			} else {
				// A deletion, or a formatting change (its marker only: what
				// it changes lives on its note).
				const kind: Kind = roll < 0.85 ? 'del' : 'format';
				const start = lo + pick( length );
				const end = Math.min( hi, start + 1 + pick( 4 ) );
				value = new RichTextData(
					addSuggestionMarker(
						create( { html: value.toHTMLString() } ),
						marker( kind, id, peer + 1 ),
						start,
						end
					) as any
				);
				kinds.set( String( id ), kind );
			}
		}
		locals.push( create( { html: value.toHTMLString() } ) );
	}

	// What the peers meant: the base, minus what any decision removed, plus
	// what any peer added.
	const intended = new Map< string, Lists >();
	const removedChars = new Set< string >();
	const peerChars = locals.map( membership );
	for ( const [ ch, lists ] of baseChars ) {
		if ( peerChars.some( ( chars ) => ! chars.has( ch ) ) ) {
			removedChars.add( ch );
			continue;
		}
		const next: Lists = { add: [], del: [], format: [] };
		for ( const kind of KINDS ) {
			const kept = lists[ kind ].filter( ( id ) =>
				peerChars.every( ( chars ) =>
					chars.get( ch )![ kind ].includes( id )
				)
			);
			const added = peerChars.flatMap( ( chars ) =>
				chars
					.get( ch )!
					[ kind ].filter( ( id ) => ! lists[ kind ].includes( id ) )
			);
			next[ kind ] = [ ...new Set( [ ...kept, ...added ] ) ].sort();
		}
		intended.set( ch, next );
	}
	peerChars.forEach( ( chars ) => {
		for ( const [ ch, lists ] of chars ) {
			if ( ! baseChars.has( ch ) ) {
				intended.set( ch, lists );
			}
		}
	} );
	// A peer's addition inside text another peer's decision removed goes too.
	const rejected = new Set< string >();

	const pending = new Set(
		[ ...kinds.keys() ].filter( ( id ) => ! decided.has( id ) )
	);
	const options = {
		isPending: ( id: string ) => pending.has( id ),
		isForeign: ( id: string ) => ! kinds.has( id ),
	};
	const peerOptions = locals.map( ( _, peer ) => ( {
		...options,
		userId: String( peer + 1 ),
	} ) );

	// Merge, then guard rounds.
	let shared = baseHTML;
	let writes: Array< string | null > = locals.map( ( local ) =>
		html( local )
	);
	let prevs = locals;
	let rounds = 0;
	let quiesced = false;
	while ( rounds < MAX_ROUNDS ) {
		const merged = mergeStrings(
			shared,
			writes.map( ( write ) =>
				write === null || write === shared
					? null
					: diff( shared, write )
			)
		);
		shared = merged;
		rounds++;
		const next = create( { html: merged } );
		// A correction that serializes to the shared string changes nothing
		// in it, so it never reaches the other peers.
		const corrections = prevs.map( ( prev, peer ) => {
			const correction = guardSyncedValue(
				prev,
				next,
				peerOptions[ peer ]
			);
			return correction && html( correction ) !== merged
				? correction
				: null;
		} );
		if ( process.env.OVERLAP_CONVERGENCE_TRACE ) {
			process.stderr.write(
				`TRACE ${ rounds } ${ merged }\n` +
					corrections
						.map(
							( c, p ) =>
								`  peer ${ p }: ${ c ? html( c ) : '-' }`
						)
						.join( '\n' ) +
					'\n'
			);
		}
		if ( corrections.every( ( correction ) => ! correction ) ) {
			quiesced = true;
			break;
		}
		writes = corrections.map( ( correction ) =>
			correction ? html( correction ) : null
		);
		prevs = corrections.map( ( correction ) => correction ?? next );
	}

	const final = create( { html: shared } );
	const finalChars = membership( final );
	const finalText = [ ...final.text ] as string[];
	const leaked = finalText.some(
		( ch ) => ch.charCodeAt( 0 ) < 0x4e00 || ch.charCodeAt( 0 ) >= nextChar
	);
	const drift = finalText.filter( ( ch ) => {
		const want = intended.get( ch );
		const got = finalChars.get( ch )!;
		return (
			! want ||
			want.add.join() !== got.add.join() ||
			want.del.join() !== got.del.join() ||
			want.format.join() !== got.format.join()
		);
	} );
	const intendedText = [ ...intended.keys() ]
		.filter( ( ch ) => ! removedChars.has( ch ) && ! rejected.has( ch ) )
		.sort( ( a, b ) => {
			const ia = finalText.indexOf( a );
			const ib = finalText.indexOf( b );
			return ia - ib;
		} );
	const views = [ new Set< string >(), new Set( pending ) ];
	const viewsMatch =
		! drift.length &&
		intendedText.length === finalText.length &&
		views.every(
			( accepted ) =>
				published( finalText, finalChars, accepted ) ===
				published( intendedText, intended, accepted )
		);
	return {
		seed,
		rounds,
		quiesced,
		canonical:
			isCanonicalSuggestionStack( final.formats ) &&
			! guardSyncedValue( final, final, options ),
		leaked,
		final: shared,
		drift,
		viewsMatch,
	};
}

describe( 'marker convergence under real-time collaboration', () => {
	beforeAll( () => {
		registerSuggestionFormat();
	} );

	afterAll( () => {
		unregisterSuggestionFormats();
	} );

	const seeds = ONLY_SEED
		? [ ONLY_SEED ]
		: Array.from( { length: RUNS }, ( _, i ) => i + 1 );

	const summarize = ( outcomes: Outcome[] ) => {
		const seedsWhere = ( test: ( o: Outcome ) => boolean ) =>
			outcomes.filter( test ).map( ( o ) => o.seed );
		const summary = {
			runs: outcomes.length,
			notQuiesced: seedsWhere( ( o ) => ! o.quiesced ),
			notCanonical: seedsWhere( ( o ) => ! o.canonical ),
			leaked: seedsWhere( ( o ) => o.leaked ),
			drifted: seedsWhere( ( o ) => o.drift.length > 0 ),
			viewsDiffer: seedsWhere( ( o ) => ! o.viewsMatch ),
			maxRounds: Math.max( ...outcomes.map( ( o ) => o.rounds ) ),
		};
		if ( process.env.OVERLAP_CONVERGENCE_REPORT ) {
			process.stderr.write( JSON.stringify( summary ) + '\n' );
			const leaked = outcomes.find( ( o ) => o.leaked );
			if ( leaked ) {
				process.stderr.write(
					'LEAK ' + JSON.stringify( leaked ) + '\n'
				);
			}
			if ( ONLY_SEED ) {
				process.stderr.write( JSON.stringify( outcomes[ 0 ] ) + '\n' );
			}
		}
		return summary;
	};

	it.each( [
		[ 'a character diff, as the sync layer computes today', diffStrings ],
		[ 'a diff that keeps tags whole', diffMarkup ],
	] )(
		'settles overlapping concurrent suggestions without trading corrections, with %s',
		( _, diff ) => {
			const summary = summarize(
				seeds.map( ( seed ) => runInterleaving( seed, diff ) )
			);
			/*
			 * Only quiescence is guaranteed here. A character merge of HTML can
			 * garble markup (an attribute or a tag cut short), and text one peer
			 * inserts inside a range another peer wraps at the same time joins
			 * that range, so what the merged value means can differ from what the
			 * peers meant; the guard cannot recover intent the merge lost. A
			 * correction whose elected writer is not online waits for them.
			 */
			expect( summary ).toMatchObject( { notQuiesced: [] } );
			expect( summary.maxRounds ).toBeLessThanOrEqual( 3 );
		},
		TIMEOUT
	);

	it(
		'publishes what the peers meant when their changes do not touch',
		() => {
			const summary = summarize(
				seeds.map( ( seed ) =>
					runInterleaving( seed, diffStrings, true )
				)
			);
			expect( summary ).toMatchObject( {
				notQuiesced: [],
				notCanonical: [],
				leaked: [],
				viewsDiffer: [],
			} );
		},
		TIMEOUT
	);

	/*
	 * With a character diff this garbles: the diff aligns the first wrapped
	 * letter with the same letter inside each new tag ("data-suggEstion"),
	 * so the peers' tags interleave. Tags kept whole merge cleanly.
	 */
	it(
		'nests concurrent deletions of the same words once, in canonical order, when tags stay whole',
		() => {
			const failures: string[] = [];
			for ( const seed of seeds ) {
				const random = lcg( seed );
				const pick = ( n: number ) => Math.floor( random() * n );
				const text = 'the quick brown fox'.slice( 0, 8 + pick( 12 ) );
				const start = pick( text.length - 2 );
				const end = start + 1 + pick( text.length - start - 1 );
				const peerCount = 2 + pick( 2 );
				// Ids in a random order, so the merge nests them out of order.
				const ids = [ 31, 32, 33 ]
					.slice( 0, peerCount )
					.sort( () => random() - 0.5 );
				const baseHTML = html( create( { text } ) );
				const locals = ids.map( ( id, peer ) =>
					addSuggestionMarker(
						create( { text } ),
						marker( 'del', id, peer + 1 ),
						start,
						end
					)
				);
				let shared = mergeStrings(
					baseHTML,
					locals.map( ( local ) =>
						diffMarkup( baseHTML, html( local ) )
					)
				);
				const options = ( peer: number ) => ( {
					isPending: () => true,
					isForeign: () => false,
					userId: String( peer + 1 ),
				} );
				let rounds = 1;
				for ( ; rounds <= MAX_ROUNDS; rounds++ ) {
					const next = create( { html: shared } );
					const writes = locals.map( ( local, peer ) =>
						guardSyncedValue(
							rounds === 1 ? local : next,
							next,
							options( peer )
						)
					);
					if ( writes.every( ( write ) => ! write ) ) {
						break;
					}
					shared = mergeStrings(
						shared,
						writes.map( ( write ) =>
							write ? diffMarkup( shared, html( write ) ) : null
						)
					);
				}
				const final = create( { html: shared } );
				const deletions = [ ...final.text ].map( ( _, index ) =>
					suggestionMarkerListsAt( final.formats[ index ] )
						.del.map( suggestionMarkerId )
						.sort()
						.join()
				);
				const expected = [ ...text ].map( ( _, index ) =>
					index >= start && index < end
						? ids.map( String ).sort().join()
						: ''
				);
				if (
					rounds > 2 ||
					final.text !== text ||
					! isCanonicalSuggestionStack( final.formats ) ||
					deletions.join( '|' ) !== expected.join( '|' )
				) {
					failures.push( `seed ${ seed }: ${ shared }` );
				}
			}
			expect( failures ).toEqual( [] );
		},
		TIMEOUT
	);
} );
