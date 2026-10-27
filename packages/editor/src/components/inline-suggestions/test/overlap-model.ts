/**
 * The overlap oracle checked against itself: for every fixture, every order
 * of decisions ends at the text the decisions publish, whatever the order,
 * and a suggestion is only marked outdated once no decision on it can change
 * that text. Pure, so it runs every fixture whether or not its phase landed.
 */
import { describe, expect, it } from 'vitest';
import {
	allSequences,
	applyDecision,
	applySequence,
	buildFixtureState,
	byKey,
	canStillMatter,
	decisionsOf,
	displayed,
	label,
	previewAll,
	published,
	sampleSequences,
	sequencesFor,
	toContentHTML,
} from './fixtures/overlap-oracle';
import type { OracleState, Step } from './fixtures/overlap-oracle';
import { FIXTURES } from './fixtures/overlaps';
import { randomFixture } from './fixtures/overlap-fuzz';

/**
 * Check one complete order: the final text is the published text of the
 * decisions taken, outdated suggestions count either way, and every step
 * only outdates suggestions that can no longer matter.
 *
 * @param start    Starting state.
 * @param sequence Decisions.
 * @return Final state.
 */
function checkOrder( start: OracleState, sequence: Step[] ) {
	let state = start;
	for ( const step of sequence ) {
		const before = state;
		state = applyDecision( state, step );
		for ( const s of state.suggestions ) {
			const was = before.suggestions.find( ( b ) => b.id === s.id )!;
			if ( s.status === 'outdated' && was.status === 'pending' ) {
				expect( canStillMatter( before, s.id ) ).toBe( true );
			}
		}
	}
	expect(
		state.suggestions.filter( ( s ) => s.status === 'pending' )
	).toEqual( [] );
	const decided = decisionsOf( state );
	expect( displayed( state ) ).toBe( published( state, decided ) );
	const outdatedAccepted = { ...decided };
	for ( const s of state.suggestions ) {
		if ( s.status === 'outdated' ) {
			outdatedAccepted[ s.id ] = 'accept';
		}
	}
	expect( published( state, outdatedAccepted ) ).toBe(
		published( state, decided )
	);
	return state;
}

/**
 * Orders that take the same explicit decisions end at the same text with
 * the same suggestions outdated.
 *
 * @param start     Starting state.
 * @param sequences Complete orders.
 */
function checkOrderIndependence( start: OracleState, sequences: Step[][] ) {
	const outcomes = new Map< string, string >();
	for ( const sequence of sequences ) {
		const state = applySequence( start, sequence );
		const key = JSON.stringify(
			[ ...sequence ].sort( ( a, b ) => Number( a.id ) - Number( b.id ) )
		);
		const outcome = JSON.stringify( [
			displayed( state ),
			state.suggestions.map( ( s ) => s.status ),
		] );
		expect( outcomes.get( key ) ?? outcome ).toBe( outcome );
		outcomes.set( key, outcome );
	}
}

describe( 'overlap oracle', () => {
	describe.each( FIXTURES.map( ( f ) => [ f.name, f ] as const ) )(
		'%s',
		( _name, fixture ) => {
			const state = buildFixtureState( fixture );
			const { sequences, exhaustive } = sequencesFor( state );

			it( 'previews match the fixture', () => {
				expect( previewAll( state, 'accept' ) ).toBe(
					fixture.expect[ 'all-accepted' ]
				);
				expect( previewAll( state, 'reject' ) ).toBe(
					fixture.expect[ 'all-rejected' ]
				);
			} );

			it( 'shows every suggestion inline before any decision', () => {
				expect( displayed( state ).replace( /<[^>]+>/g, '' ) ).toBe(
					state.chars.map( ( char ) => char.ch ).join( '' )
				);
			} );

			it.each(
				( fixture.cases ?? [] ).map( ( c ) => [
					JSON.stringify( c.decisions ),
					c,
				] )
			)( 'publishes %s', ( _label, c ) => {
				const decisions = byKey( state, c.decisions );
				for ( const s of state.suggestions ) {
					decisions[ s.id ] ??= 'reject';
				}
				expect( published( state, decisions ) ).toBe( c.published );
			} );

			it( `${
				exhaustive ? 'every' : 'a sample of'
			} order ends at the published text`, () => {
				expect( sequences.length ).toBeGreaterThan( 0 );
				for ( const sequence of sequences ) {
					checkOrder( state, sequence );
				}
				checkOrderIndependence( state, sequences );
			} );

			it( 'serializes markers in canonical order, oldest outermost', () => {
				const html = toContentHTML( state );
				const order = [
					...html.matchAll(
						/data-suggestion-id="(\d+)" data-suggestion-type="(\w+)"/g
					),
				].map( ( m ) => [ m[ 2 ], Number( m[ 1 ] ) ] as const );
				// Between two markers that open in a row, kinds go add,
				// format, del and ids rise within a kind.
				const rank = { add: 0, format: 1, del: 2 } as Record<
					string,
					number
				>;
				const nested = [
					...html.matchAll( /(?:<mark [^>]*>){2,}/g ),
				].map( ( m ) =>
					[
						...m[ 0 ].matchAll(
							/id="(\d+)" data-suggestion-type="(\w+)"/g
						),
					].map( ( i ) => [ rank[ i[ 2 ] ], Number( i[ 1 ] ) ] )
				);
				for ( const run of nested ) {
					for ( let i = 1; i < run.length; i++ ) {
						expect(
							run[ i - 1 ][ 0 ] < run[ i ][ 0 ] ||
								( run[ i - 1 ][ 0 ] === run[ i ][ 0 ] &&
									run[ i - 1 ][ 1 ] < run[ i ][ 1 ] )
						).toBe( true );
					}
				}
				expect( order.length ).toBeGreaterThan( 0 );
				expect( toContentHTML( state ) ).toBe( html );
			} );
		}
	);

	it( 'annezazu has 37 decision orders with five published texts', () => {
		const state = buildFixtureState(
			FIXTURES.find( ( f ) => f.name === 'annezazu' )!
		);
		const sequences = allSequences( state );
		expect( sequences ).toHaveLength( 37 );
		const finals: Record< string, number > = {};
		for ( const sequence of sequences ) {
			const text = displayed( applySequence( state, sequence ) );
			finals[ text ] = ( finals[ text ] ?? 0 ) + 1;
		}
		expect( finals ).toEqual( {
			'Intro.': 13,
			'Intro. Bright <b>red apples</b> fell.': 6,
			'Intro. Bright <b>red </b>.': 6,
			'Intro. Bright red apples fell.': 6,
			'Intro. Bright red .': 6,
		} );
	} );

	it( 'rejecting a formatting change outdates one built on it only if it no longer changes anything', () => {
		const state = buildFixtureState(
			FIXTURES.find( ( f ) => f.name === 'stacked-conflict' )!
		);
		const after = applyDecision( state, { id: '1', decision: 'reject' } );
		// B still adds italic, so it stays pending.
		expect( after.suggestions[ 1 ].status ).toBe( 'pending' );
		const onlyRemoves = buildFixtureState( {
			name: 'only-removes',
			phase: 'B',
			users: {},
			base: 'word',
			suggestions: [
				{
					key: 'A',
					author: 'A',
					kind: 'format',
					range: [ 0, 4 ],
					added: [ 'core/bold' ],
				},
				{
					key: 'B',
					author: 'B',
					kind: 'format',
					range: [ 0, 4 ],
					removed: [ 'core/bold' ],
				},
			],
			expect: { 'all-accepted': 'word', 'all-rejected': 'word' },
		} );
		expect(
			applyDecision( onlyRemoves, { id: '1', decision: 'reject' } )
				.suggestions[ 1 ].status
		).toBe( 'outdated' );
	} );

	it( 'samples orders reproducibly from a seed', () => {
		const state = buildFixtureState(
			FIXTURES.find( ( f ) => f.name === 'four-same-kind' )!
		);
		const first = sampleSequences( state, 10, 42 ).map( ( s ) =>
			label( s, state )
		);
		expect(
			sampleSequences( state, 10, 42 ).map( ( s ) => label( s, state ) )
		).toEqual( first );
	} );

	describe( 'property fuzz', () => {
		const seeds = Array.from( { length: 60 }, ( _, i ) => 1000 + i );
		it.each( seeds )( 'seed %i', ( seed ) => {
			const state = buildFixtureState( randomFixture( seed ) );
			const sequences = sampleSequences( state, 40, seed );
			expect.hasAssertions();
			for ( const sequence of sequences ) {
				checkOrder( state, sequence );
			}
			checkOrderIndependence( state, sequences );
		} );
	} );
} );
