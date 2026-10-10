/**
 * A character model of overlapping suggestions, independent of rich text, to
 * check the real operations against.
 *
 * Every character records which suggestion (if any) of each kind covers it,
 * and for a pending formatting change, the character's formatting before the
 * change. Resolution follows one rule: accepting a deletion or rejecting an
 * addition removes characters; any other pending suggestion left with no
 * characters is outdated.
 */

export type Kind = 'add' | 'del' | 'format';
export type Decision = 'accept' | 'reject';

export interface OracleChar {
	ch: string;
	bold: boolean;
	add?: string;
	del?: string;
	format?: string;
	/** Bold before the pending formatting change on this character. */
	formatOriginalBold?: boolean;
}

export interface OracleSuggestion {
	id: string;
	kind: Kind;
	status: 'pending' | 'applied' | 'rejected' | 'outdated';
}

export interface OracleState {
	chars: OracleChar[];
	suggestions: OracleSuggestion[];
}

export interface Step {
	id: string;
	decision: Decision;
}

const clone = ( state: OracleState ): OracleState => ( {
	chars: state.chars.map( ( char ) => ( { ...char } ) ),
	suggestions: state.suggestions.map( ( s ) => ( { ...s } ) ),
} );

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
	const { kind } = suggestion;
	const removes =
		( kind === 'add' && step.decision === 'reject' ) ||
		( kind === 'del' && step.decision === 'accept' );
	if ( removes ) {
		next.chars = next.chars.filter( ( char ) => char[ kind ] !== step.id );
	} else {
		for ( const char of next.chars ) {
			if ( char[ kind ] !== step.id ) {
				continue;
			}
			if ( kind === 'format' && step.decision === 'reject' ) {
				char.bold = !! char.formatOriginalBold;
			}
			delete char[ kind ];
			if ( kind === 'format' ) {
				delete char.formatOriginalBold;
			}
		}
	}
	suggestion.status = step.decision === 'accept' ? 'applied' : 'rejected';
	for ( const other of next.suggestions ) {
		if (
			other.status === 'pending' &&
			! next.chars.some( ( char ) => char[ other.kind ] === other.id )
		) {
			other.status = 'outdated';
		}
	}
	return next;
}

/**
 * Every complete decision sequence: each pending suggestion accepted or
 * rejected, in every order, with outdated suggestions dropping out.
 *
 * @param state Starting state.
 * @return Sequences of steps.
 */
export function allSequences( state: OracleState ): Step[][] {
	const pending = state.suggestions.filter( ( s ) => s.status === 'pending' );
	if ( ! pending.length ) {
		return [ [] ];
	}
	const sequences: Step[][] = [];
	for ( const suggestion of pending ) {
		for ( const decision of [ 'accept', 'reject' ] as Decision[] ) {
			const step = { id: suggestion.id, decision };
			for ( const rest of allSequences( applyDecision( state, step ) ) ) {
				sequences.push( [ step, ...rest ] );
			}
		}
	}
	return sequences;
}

/**
 * The published rendering of a fully decided state, as text with the bold
 * runs wrapped in `<b>`.
 *
 * @param state Decided state.
 * @return Rendering.
 */
export function render( state: OracleState ): string {
	let out = '';
	let bold = false;
	for ( const char of state.chars ) {
		if ( char.bold !== bold ) {
			out += char.bold ? '<b>' : '</b>';
			bold = char.bold;
		}
		out += char.ch;
	}
	return out + ( bold ? '</b>' : '' );
}

/**
 * Build a state from text segments.
 *
 * @param segments    Segments with the markers covering them.
 * @param suggestions The suggestions, all pending.
 * @return State.
 */
export function buildState(
	segments: Array< Omit< OracleChar, 'ch' > & { text: string } >,
	suggestions: Array< { id: string; kind: Kind } >
): OracleState {
	const chars: OracleChar[] = [];
	for ( const { text, ...rest } of segments ) {
		for ( const ch of text ) {
			chars.push( { ch, ...rest } );
		}
	}
	return {
		chars,
		suggestions: suggestions.map( ( s ) => ( {
			...s,
			status: 'pending',
		} ) ),
	};
}

/**
 * annezazu's example (#73411): original "Intro."; A (id 1) adds " Bright red
 * apples fell."; B (id 2) bolds "red apples" inside it; C (id 3) deletes
 * "apples fell" inside it, including the bolded "apples".
 */
export const ANNEZAZU = buildState(
	[
		{ text: 'Intro.', bold: false },
		{ text: ' Bright ', bold: false, add: '1' },
		{
			text: 'red ',
			bold: true,
			add: '1',
			format: '2',
			formatOriginalBold: false,
		},
		{
			text: 'apples',
			bold: true,
			add: '1',
			format: '2',
			formatOriginalBold: false,
			del: '3',
		},
		{ text: ' fell', bold: false, add: '1', del: '3' },
		{ text: '.', bold: false, add: '1' },
	],
	[
		{ id: '1', kind: 'add' },
		{ id: '2', kind: 'format' },
		{ id: '3', kind: 'del' },
	]
);

/**
 * Variant 2: C's deletion covers all of "red apples" and " fell", so
 * accepting it outdates B.
 */
export const ANNEZAZU_V2 = buildState(
	[
		{ text: 'Intro.', bold: false },
		{ text: ' Bright ', bold: false, add: '1' },
		{
			text: 'red apples',
			bold: true,
			add: '1',
			format: '2',
			formatOriginalBold: false,
			del: '3',
		},
		{ text: ' fell', bold: false, add: '1', del: '3' },
		{ text: '.', bold: false, add: '1' },
	],
	[
		{ id: '1', kind: 'add' },
		{ id: '2', kind: 'format' },
		{ id: '3', kind: 'del' },
	]
);

/**
 * Variant 3: C's deletion spans "ro." of the original and " Bright" of A's
 * addition, so rejecting A shrinks C instead of outdating it.
 */
export const ANNEZAZU_V3 = buildState(
	[
		{ text: 'Int', bold: false },
		{ text: 'ro.', bold: false, del: '3' },
		{ text: ' Bright', bold: false, add: '1', del: '3' },
		{ text: ' ', bold: false, add: '1' },
		{
			text: 'red apples',
			bold: true,
			add: '1',
			format: '2',
			formatOriginalBold: false,
		},
		{ text: ' fell.', bold: false, add: '1' },
	],
	[
		{ id: '1', kind: 'add' },
		{ id: '2', kind: 'format' },
		{ id: '3', kind: 'del' },
	]
);

const markOpen = ( kind: Kind, id: string ) =>
	`<mark data-suggestion-id="${ id }" data-suggestion-type="${ kind }" data-author="${ id }" class="wp-suggestion-${ kind }">`;

/**
 * Serialize a state as block content, in canonical marker order (add, then
 * format, then del, then bold), the way the editor writes it.
 *
 * @param state State.
 * @return HTML.
 */
export function toContentHTML( state: OracleState ): string {
	let out = '';
	let open: string[] = [];
	const layersOf = ( char: OracleChar ) => [
		...( char.add ? [ `add:${ char.add }` ] : [] ),
		...( char.format ? [ `format:${ char.format }` ] : [] ),
		...( char.del ? [ `del:${ char.del }` ] : [] ),
		...( char.bold ? [ 'bold' ] : [] ),
	];
	const close = ( layer: string ) =>
		layer === 'bold' ? '</strong>' : '</mark>';
	const opener = ( layer: string ) => {
		if ( layer === 'bold' ) {
			return '<strong>';
		}
		const [ kind, id ] = layer.split( ':' );
		return markOpen( kind as Kind, id );
	};
	for ( const char of state.chars ) {
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
			out += close( open[ i ] );
		}
		for ( let i = common; i < layers.length; i++ ) {
			out += opener( layers[ i ] );
		}
		open = layers;
		out += char.ch;
	}
	for ( let i = open.length - 1; i >= 0; i-- ) {
		out += close( open[ i ] );
	}
	return out;
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
	return render( {
		chars: state.chars
			.filter( ( char ) => char.format === id )
			.map( ( char ) => ( {
				ch: char.ch,
				bold: !! char.formatOriginalBold,
			} ) ),
		suggestions: [],
	} ).replace( /<(\/?)b>/g, '<$1strong>' );
}
