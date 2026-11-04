/**
 * A character model of overlapping suggestions, independent of rich text, to
 * check the real operations against.
 *
 * It follows the Google Docs model: every character carries lists of
 * suggestion ids per kind (`ins`, `del`, `fmt`), and every formatting
 * suggestion records a delta per character: only the formats it added or
 * removed. One rule decides the published text: a character is published if
 * every insertion id on it is accepted and no deletion id on it is accepted;
 * its formatting is the base plus every accepted delta, in id order.
 *
 * A pending suggestion is outdated once no decision on it can change the
 * published text, whatever happens to the others still pending.
 */

export type Kind = 'add' | 'del' | 'format';
export type Decision = 'accept' | 'reject';
export type Status = 'pending' | 'applied' | 'rejected' | 'outdated';

export interface FormatDelta {
	added: string[];
	removed: string[];
}

export interface OracleChar {
	ch: string;
	/** Formatting before any suggestion. */
	base: string[];
	/** Insertion ids, ascending. */
	ins: string[];
	/** Deletion ids, ascending. */
	del: string[];
	/** Formatting suggestion ids, ascending. */
	fmt: string[];
	/** What each formatting suggestion changed on this character. */
	deltas: Record< string, FormatDelta >;
}

export interface OracleSuggestion {
	id: string;
	key: string;
	author: string;
	kind: Kind;
	status: Status;
}

export interface OracleState {
	chars: OracleChar[];
	suggestions: OracleSuggestion[];
}

export interface Step {
	id: string;
	decision: Decision;
}

/**
 * The phase of the overlap plan that makes a fixture pass through the real
 * operations: `current` already does, `A` needs same-kind nesting, `B`
 * formatting deltas.
 */
export type Phase = 'current' | 'A' | 'B';

export interface FixtureSuggestion {
	key: string;
	author: string;
	kind: Kind;
	/** Addition: the text typed. */
	text?: string;
	/** Addition: the caret offset in the displayed text. */
	at?: number;
	/** Addition: formatting of the typed text. */
	formats?: string[];
	/** Deletion or formatting: `[ start, end )` of the displayed text. */
	range?: [ number, number ];
	/** Formatting: formats added and removed. */
	added?: string[];
	removed?: string[];
	/** Addition: keys of the additions it must nest inside. */
	inside?: string[];
}

export interface Fixture {
	name: string;
	description?: string;
	phase: Phase;
	users: Record< string, string >;
	base: string;
	baseFormats?: Array< { range: [ number, number ]; formats: string[] } >;
	suggestions: FixtureSuggestion[];
	expect: { 'all-accepted': string; 'all-rejected': string };
	cases?: Array< {
		decisions: Record< string, Decision >;
		published: string;
	} >;
	docs?: Record< string, unknown >;
}

const byId = ( a: string, b: string ) => Number( a ) - Number( b );

const clone = ( state: OracleState ): OracleState => ( {
	chars: state.chars,
	suggestions: state.suggestions.map( ( s ) => ( { ...s } ) ),
} );

/**
 * Formats in the order they nest, outermost first.
 */
const FORMAT_ORDER = [ 'core/bold', 'core/italic' ];

const formatRank = ( type: string ) => {
	const index = FORMAT_ORDER.indexOf( type );
	return index === -1 ? FORMAT_ORDER.length : index;
};

/**
 * Sort formats into nesting order.
 *
 * @param formats Format types.
 * @return Sorted copy.
 */
export function sortFormats( formats: Iterable< string > ): string[] {
	return [ ...new Set( formats ) ].sort(
		( a, b ) => formatRank( a ) - formatRank( b ) || a.localeCompare( b )
	);
}

function applyDelta( formats: Set< string >, delta?: FormatDelta ) {
	if ( ! delta ) {
		return;
	}
	for ( const type of delta.removed ) {
		formats.delete( type );
	}
	for ( const type of delta.added ) {
		formats.add( type );
	}
}

/**
 * The formatting of a character with the given formatting suggestions
 * applied, in id order.
 *
 * @param char    Character.
 * @param applies Whether a formatting suggestion applies.
 * @return Format types, in nesting order.
 */
function formatsOf(
	char: OracleChar,
	applies: ( id: string ) => boolean
): string[] {
	const formats = new Set( char.base );
	for ( const id of char.fmt ) {
		if ( applies( id ) ) {
			applyDelta( formats, char.deltas[ id ] );
		}
	}
	return sortFormats( formats );
}

const SHORT_TAGS: Record< string, string > = {
	'core/bold': 'b',
	'core/italic': 'i',
};

export const HTML_TAGS: Record< string, string > = {
	'core/bold': 'strong',
	'core/italic': 'em',
};

/**
 * Render characters as text with formatting runs in nested tags.
 *
 * @param chars  Characters with their formats, in nesting order.
 * @param tagFor Tag name for a format type.
 * @return Rendering.
 */
function renderWith(
	chars: Array< { ch: string; formats: string[] } >,
	tagFor: ( type: string ) => string
): string {
	let out = '';
	let open: string[] = [];
	for ( const { ch, formats } of chars ) {
		let common = 0;
		while (
			common < open.length &&
			common < formats.length &&
			open[ common ] === formats[ common ]
		) {
			common++;
		}
		for ( let i = open.length - 1; i >= common; i-- ) {
			out += `</${ tagFor( open[ i ] ) }>`;
		}
		for ( let i = common; i < formats.length; i++ ) {
			out += `<${ tagFor( formats[ i ] ) }>`;
		}
		open = formats;
		out += ch;
	}
	for ( let i = open.length - 1; i >= 0; i-- ) {
		out += `</${ tagFor( open[ i ] ) }>`;
	}
	return out;
}

/**
 * The compact rendering every comparison uses: text, with bold in `<b>` and
 * italic in `<i>`.
 *
 * @param chars Characters with their formats.
 * @return Rendering.
 */
export function render(
	chars: Array< { ch: string; formats: string[] } >
): string {
	return renderWith(
		chars.map( ( { ch, formats } ) => ( {
			ch,
			formats: sortFormats( formats ),
		} ) ),
		( type ) => SHORT_TAGS[ type ] ?? `span data-format="${ type }"`
	).replace( /<\/span data-format="[^"]*">/g, '</span>' );
}

/**
 * The same characters as block content HTML, without markers.
 *
 * @param chars Characters with their formats.
 * @return HTML.
 */
export function renderHTML(
	chars: Array< { ch: string; formats: string[] } >
): string {
	return renderWith(
		chars.map( ( { ch, formats } ) => ( {
			ch,
			formats: sortFormats( formats ),
		} ) ),
		( type ) => HTML_TAGS[ type ] ?? 'span'
	);
}

const statusOf = ( state: OracleState, id: string ) =>
	state.suggestions.find( ( s ) => s.id === id )!.status;

/**
 * The published characters for a decision on every suggestion.
 *
 * @param state      State (only its characters are read).
 * @param assignment Decision by suggestion id.
 * @return Published characters with their formats.
 */
export function publishedChars(
	state: OracleState,
	assignment: Record< string, Decision >
) {
	return state.chars
		.filter(
			( char ) =>
				char.ins.every( ( id ) => assignment[ id ] === 'accept' ) &&
				! char.del.some( ( id ) => assignment[ id ] === 'accept' )
		)
		.map( ( char ) => ( {
			ch: char.ch,
			formats: formatsOf( char, ( id ) => assignment[ id ] === 'accept' ),
		} ) );
}

/**
 * The published rendering for a decision on every suggestion.
 *
 * @param state      State.
 * @param assignment Decision by suggestion id.
 * @return Rendering.
 */
export function published(
	state: OracleState,
	assignment: Record< string, Decision >
): string {
	return render( publishedChars( state, assignment ) );
}

/**
 * The characters the editor shows: pending suggestions show inline, decided
 * ones have taken effect, and an outdated one changes nothing.
 *
 * @param state State.
 * @return Displayed characters with their formats.
 */
export function displayedChars( state: OracleState ) {
	const status = ( id: string ) => statusOf( state, id );
	return state.chars
		.filter(
			( char ) =>
				! char.ins.some( ( id ) => status( id ) === 'rejected' ) &&
				! char.del.some( ( id ) => status( id ) === 'applied' )
		)
		.map( ( char ) => ( {
			ch: char.ch,
			formats: formatsOf( char, ( id ) =>
				[ 'pending', 'applied' ].includes( status( id ) )
			),
		} ) );
}

/**
 * The rendering of what the editor shows. Once every suggestion is decided,
 * it is the published text.
 *
 * @param state State.
 * @return Rendering.
 */
export function displayed( state: OracleState ): string {
	return render( displayedChars( state ) );
}

/**
 * The decisions taken so far, with an outdated suggestion counted as
 * rejected (either reading publishes the same text).
 *
 * @param state State.
 * @return Decision by id, for decided and outdated suggestions.
 */
export function decisionsOf( state: OracleState ) {
	const decided: Record< string, Decision > = {};
	for ( const s of state.suggestions ) {
		if ( s.status === 'applied' ) {
			decided[ s.id ] = 'accept';
		} else if ( s.status === 'rejected' || s.status === 'outdated' ) {
			decided[ s.id ] = 'reject';
		}
	}
	return decided;
}

/**
 * Every assignment of a decision to each of the given ids.
 *
 * @param ids Suggestion ids.
 * @return Assignments.
 */
function assignments( ids: string[] ): Array< Record< string, Decision > > {
	let all: Array< Record< string, Decision > > = [ {} ];
	for ( const id of ids ) {
		all = all.flatMap( ( a ) => [
			{ ...a, [ id ]: 'accept' as Decision },
			{ ...a, [ id ]: 'reject' as Decision },
		] );
	}
	return all;
}

/**
 * Whether a decision on a pending suggestion can still change the published
 * text, for some decision on each of the other pending suggestions.
 *
 * @param state State.
 * @param id    Pending suggestion id.
 * @return Whether it still matters.
 */
export function canStillMatter( state: OracleState, id: string ): boolean {
	const decided = decisionsOf( state );
	const others = state.suggestions
		.filter( ( s ) => s.status === 'pending' && s.id !== id )
		.map( ( s ) => s.id );
	return assignments( others ).some( ( rest ) => {
		const base = { ...decided, ...rest };
		return (
			published( state, { ...base, [ id ]: 'accept' } ) !==
			published( state, { ...base, [ id ]: 'reject' } )
		);
	} );
}

function markOutdated( state: OracleState ) {
	for ( const s of state.suggestions ) {
		if ( s.status === 'pending' && ! canStillMatter( state, s.id ) ) {
			s.status = 'outdated';
		}
	}
}

/**
 * Apply one decision to a state, returning the next state.
 *
 * @param state Current state.
 * @param step  Decision to apply.
 * @return Next state.
 */
export function applyDecision( state: OracleState, step: Step ): OracleState {
	const next = clone( state );
	const suggestion = next.suggestions.find( ( s ) => s.id === step.id )!;
	if ( suggestion.status !== 'pending' ) {
		throw new Error( `Suggestion ${ step.id } is ${ suggestion.status }` );
	}
	suggestion.status = step.decision === 'accept' ? 'applied' : 'rejected';
	markOutdated( next );
	return next;
}

/**
 * Apply a sequence of decisions.
 *
 * @param state    Starting state.
 * @param sequence Decisions.
 * @return Final state.
 */
export function applySequence( state: OracleState, sequence: Step[] ) {
	return sequence.reduce( applyDecision, state );
}

const pendingIds = ( state: OracleState ) =>
	state.suggestions
		.filter( ( s ) => s.status === 'pending' )
		.map( ( s ) => s.id );

/**
 * Every complete decision sequence: each pending suggestion accepted or
 * rejected, in every order, with outdated suggestions dropping out.
 *
 * @param state Starting state.
 * @return Sequences of steps.
 */
export function allSequences( state: OracleState ): Step[][] {
	const pending = pendingIds( state );
	if ( ! pending.length ) {
		return [ [] ];
	}
	const sequences: Step[][] = [];
	for ( const id of pending ) {
		for ( const decision of [ 'accept', 'reject' ] as Decision[] ) {
			const step = { id, decision };
			for ( const rest of allSequences( applyDecision( state, step ) ) ) {
				sequences.push( [ step, ...rest ] );
			}
		}
	}
	return sequences;
}

/**
 * A seeded pseudo-random generator (a linear congruential generator), so a
 * sampled order or a fuzzed fixture can be replayed from its seed.
 *
 * @param seed Seed.
 * @return Function returning a float in `[0, 1)`.
 */
export function lcg( seed: number ): () => number {
	const modulus = 4294967296;
	let s = Math.abs( Math.floor( seed ) ) % modulus || 1;
	return () => {
		s =
			( ( ( Math.imul( s, 1664525 ) + 1013904223 ) % modulus ) +
				modulus ) %
			modulus;
		return s / modulus;
	};
}

/**
 * Random complete decision sequences.
 *
 * @param state Starting state.
 * @param count How many.
 * @param seed  Seed.
 * @return Sequences, without duplicates.
 */
export function sampleSequences(
	state: OracleState,
	count: number,
	seed: number
): Step[][] {
	const random = lcg( seed );
	const seen = new Set< string >();
	const sequences: Step[][] = [];
	for ( let attempt = 0; attempt < count * 10; attempt++ ) {
		if ( sequences.length >= count ) {
			break;
		}
		let current = state;
		const sequence: Step[] = [];
		let pending = pendingIds( current );
		while ( pending.length ) {
			const step: Step = {
				id: pending[ Math.floor( random() * pending.length ) ],
				decision: random() < 0.5 ? 'accept' : 'reject',
			};
			sequence.push( step );
			current = applyDecision( current, step );
			pending = pendingIds( current );
		}
		const key = label( sequence, current );
		if ( ! seen.has( key ) ) {
			seen.add( key );
			sequences.push( sequence );
		}
	}
	return sequences;
}

/**
 * Exhaustive orders for small states, a seeded sample otherwise.
 *
 * @param state Starting state.
 * @param seed  Seed for the sample.
 * @return Sequences and whether they are every order.
 */
export function sequencesFor( state: OracleState, seed = 1 ) {
	if ( state.suggestions.length <= 4 ) {
		return { sequences: allSequences( state ), exhaustive: true };
	}
	return {
		sequences: sampleSequences( state, 200, seed ),
		exhaustive: false,
	};
}

/**
 * A short label for a sequence, `+A -B` style, by suggestion key.
 *
 * @param sequence Decisions.
 * @param state    Any state of the fixture, for the keys.
 * @return Label.
 */
export function label( sequence: Step[], state: OracleState ): string {
	const keyOf = ( id: string ) =>
		state.suggestions.find( ( s ) => s.id === id )!.key;
	return sequence
		.map(
			( { id, decision } ) =>
				`${ decision === 'accept' ? '+' : '-' }${ keyOf( id ) }`
		)
		.join( ' ' );
}

/**
 * Build the state a fixture describes by replaying its suggestions in order,
 * each against the text displayed at that point. A suggestion's id is its
 * position, from 1, so ids grow with creation as note ids do.
 *
 * - An addition nests in every addition that holds the characters on both
 *   sides of its caret, and in no deletion: text typed in someone's struck
 *   text is a separate addition.
 * - A formatting suggestion records only the changes it makes to each
 *   character as displayed.
 *
 * @param fixture Fixture.
 * @return State, every suggestion pending.
 */
export function buildFixtureState( fixture: Fixture ): OracleState {
	let chars: OracleChar[] = [ ...fixture.base ].map( ( ch ) => ( {
		ch,
		base: [],
		ins: [],
		del: [],
		fmt: [],
		deltas: {},
	} ) );
	for ( const {
		range: [ start, end ],
		formats,
	} of fixture.baseFormats ?? [] ) {
		for ( let i = start; i < end; i++ ) {
			chars[ i ].base = sortFormats( [ ...chars[ i ].base, ...formats ] );
		}
	}
	const keys = new Map< string, string >();
	const suggestions: OracleSuggestion[] = [];
	fixture.suggestions.forEach( ( s, index ) => {
		const id = String( index + 1 );
		keys.set( s.key, id );
		suggestions.push( {
			id,
			key: s.key,
			author: s.author,
			kind: s.kind,
			status: 'pending',
		} );
		const fail = ( message: string ) => {
			throw new Error( `${ fixture.name } ${ s.key }: ${ message }` );
		};
		if ( s.kind === 'add' ) {
			const at = s.at ?? fail( 'an addition needs `at`' );
			if ( ! s.text || at < 0 || at > chars.length ) {
				fail( 'bad addition' );
			}
			const before = chars[ at - 1 ]?.ins ?? [];
			const after = chars[ at ]?.ins ?? [];
			const ins = [
				...before.filter( ( other ) => after.includes( other ) ),
				id,
			].sort( byId );
			for ( const key of s.inside ?? [] ) {
				if ( ! ins.includes( keys.get( key )! ) ) {
					fail( `does not nest inside ${ key }` );
				}
			}
			const typed = [ ...s.text! ].map( ( ch ) => ( {
				ch,
				base: sortFormats( s.formats ?? [] ),
				ins,
				del: [],
				fmt: [],
				deltas: {},
			} ) );
			chars = [ ...chars.slice( 0, at ), ...typed, ...chars.slice( at ) ];
			return;
		}
		const [ start, end ] = s.range ?? fail( 'needs `range`' );
		if ( start < 0 || end > chars.length || start >= end ) {
			fail( 'bad range' );
		}
		for ( let i = start; i < end; i++ ) {
			const char = { ...chars[ i ] };
			if ( s.kind === 'del' ) {
				char.del = [ ...char.del, id ].sort( byId );
			} else {
				const shown = formatsOf( char, () => true );
				char.fmt = [ ...char.fmt, id ].sort( byId );
				char.deltas = {
					...char.deltas,
					[ id ]: {
						added: ( s.added ?? [] ).filter(
							( type ) => ! shown.includes( type )
						),
						removed: ( s.removed ?? [] ).filter( ( type ) =>
							shown.includes( type )
						),
					},
				};
			}
			chars[ i ] = char;
		}
	} );
	return { chars, suggestions };
}

/**
 * The id of a fixture suggestion by key.
 *
 * @param state State.
 * @param key   Fixture key.
 * @return Id.
 */
export function idOf( state: OracleState, key: string ): string {
	return state.suggestions.find( ( s ) => s.key === key )!.id;
}

/**
 * Translate a decision map by fixture key into one by id.
 *
 * @param state     State.
 * @param decisions Decision by key.
 * @return Decision by id.
 */
export function byKey(
	state: OracleState,
	decisions: Record< string, Decision >
): Record< string, Decision > {
	return Object.fromEntries(
		Object.entries( decisions ).map( ( [ key, decision ] ) => [
			idOf( state, key ),
			decision,
		] )
	);
}

/**
 * Every suggestion accepted, or every one rejected: Google Docs' two preview
 * modes.
 *
 * @param state    State.
 * @param decision The decision for all.
 * @return Rendering.
 */
export function previewAll( state: OracleState, decision: Decision ) {
	return published(
		state,
		Object.fromEntries(
			state.suggestions.map( ( s ) => [ s.id, decision ] )
		)
	);
}

export interface MarkerOptions {
	/** Note id for a suggestion id; the suggestion id by default. */
	noteId?: ( id: string ) => string;
	/** Author attribute for a suggestion id; the suggestion id by default. */
	authorOf?: ( id: string ) => string;
}

/**
 * Serialize a state as block content, in canonical marker order: additions,
 * then formatting changes, then deletions, each kind oldest (lowest id)
 * outermost, then content formats. Only pending suggestions keep markers.
 *
 * @param state            State, as displayed.
 * @param options          Note ids and authors to write.
 * @param options.noteId   Note id for a suggestion id.
 * @param options.authorOf Author attribute for a suggestion id.
 * @return HTML.
 */
export function toContentHTML(
	state: OracleState,
	{ noteId = ( id ) => id, authorOf = ( id ) => id }: MarkerOptions = {}
): string {
	const status = ( id: string ) => statusOf( state, id );
	const pending = ( ids: string[] ) =>
		ids.filter( ( id ) => status( id ) === 'pending' );
	const chars = state.chars.filter(
		( char ) =>
			! char.ins.some( ( id ) => status( id ) === 'rejected' ) &&
			! char.del.some( ( id ) => status( id ) === 'applied' )
	);
	const layersOf = ( char: OracleChar ) => [
		...pending( char.ins ).map( ( id ) => `add:${ id }` ),
		...pending( char.fmt ).map( ( id ) => `format:${ id }` ),
		...pending( char.del ).map( ( id ) => `del:${ id }` ),
		...formatsOf( char, ( id ) =>
			[ 'pending', 'applied' ].includes( status( id ) )
		),
	];
	const opener = ( layer: string ) => {
		const [ kind, id ] = layer.split( ':' );
		if (
			id === undefined ||
			! [ 'add', 'del', 'format' ].includes( kind )
		) {
			return `<${ HTML_TAGS[ layer ] ?? 'span' }>`;
		}
		return `<mark data-suggestion-id="${ noteId(
			id
		) }" data-suggestion-type="${ kind }" data-author="${ authorOf(
			id
		) }" class="wp-suggestion-${ kind }">`;
	};
	const closer = ( layer: string ) =>
		/^(add|del|format):/.test( layer )
			? '</mark>'
			: `</${ HTML_TAGS[ layer ] ?? 'span' }>`;
	let out = '';
	let open: string[] = [];
	for ( const char of chars ) {
		const layers = layersOf( char );
		let common = 0;
		while (
			common < open.length &&
			common < layers.length &&
			open[ common ] === layers[ common ]
		) {
			common++;
		}
		for ( let i = open.length - 1; i >= common; i-- ) {
			out += closer( open[ i ] );
		}
		for ( let i = common; i < layers.length; i++ ) {
			out += opener( layers[ i ] );
		}
		open = layers;
		out += char.ch;
	}
	for ( let i = open.length - 1; i >= 0; i-- ) {
		out += closer( open[ i ] );
	}
	return out;
}

/**
 * A formatting suggestion's run before and after its change, as displayed
 * when it was made: the payload's `beforeHTML` and `afterHTML`.
 *
 * @param state State.
 * @param id    Formatting suggestion id.
 * @return Both runs, without markers.
 */
export function formatRunHTML( state: OracleState, id: string ) {
	const run = state.chars.filter( ( char ) => char.fmt.includes( id ) );
	const lower = ( other: string ) =>
		byId( other, id ) < 0 &&
		[ 'pending', 'applied' ].includes( statusOf( state, other ) );
	return {
		beforeHTML: renderHTML(
			run.map( ( char ) => ( {
				ch: char.ch,
				formats: formatsOf( char, lower ),
			} ) )
		),
		afterHTML: renderHTML(
			run.map( ( char ) => ( {
				ch: char.ch,
				formats: formatsOf(
					char,
					( other ) => other === id || lower( other )
				),
			} ) )
		),
	};
}

/**
 * The recorded original of a formatting change: its run as it was before the
 * change, without markers.
 *
 * @param state State.
 * @param id    Format suggestion id.
 * @return HTML of the original run.
 */
export function formatOriginalHTML( state: OracleState, id: string ): string {
	return formatRunHTML( state, id ).beforeHTML;
}

export interface DeltaRun {
	offset: number;
	length: number;
	added: Array< { type: string } >;
	removed: Array< { type: string } >;
}

/**
 * A formatting suggestion's delta in the payload shape of plan section 3.2:
 * runs of equal changes, offsets counted within the suggestion's characters.
 *
 * @param state State.
 * @param id    Formatting suggestion id.
 * @return Delta runs.
 */
export function formatDelta( state: OracleState, id: string ): DeltaRun[] {
	const runs: DeltaRun[] = [];
	const run = state.chars.filter( ( char ) => char.fmt.includes( id ) );
	run.forEach( ( char, offset ) => {
		const { added, removed } = char.deltas[ id ];
		const entry = {
			added: added.map( ( type ) => ( { type } ) ),
			removed: removed.map( ( type ) => ( { type } ) ),
		};
		const last = runs[ runs.length - 1 ];
		if (
			last &&
			JSON.stringify( [ last.added, last.removed ] ) ===
				JSON.stringify( [ entry.added, entry.removed ] )
		) {
			last.length++;
		} else {
			runs.push( { offset, length: 1, ...entry } );
		}
	} );
	return runs;
}

/**
 * The note payload a suggestion's author saves.
 *
 * @param state State.
 * @param id    Suggestion id.
 * @return The `inline-suggestion` operation.
 */
export function suggestionOperation( state: OracleState, id: string ) {
	const { kind } = state.suggestions.find( ( s ) => s.id === id )!;
	return {
		type: 'inline-suggestion',
		attribute: 'content',
		suggestionType: kind,
		...( kind === 'format' && {
			...formatRunHTML( state, id ),
			delta: formatDelta( state, id ),
		} ),
	};
}
