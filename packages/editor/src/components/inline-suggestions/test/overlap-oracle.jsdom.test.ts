/**
 * The shared overlap fixtures, every accept/reject order, through the real
 * operations, checked against the character model in `fixtures/`.
 *
 * A fixture whose phase of the overlap plan has not landed is skipped here
 * (see `fixtures/overlap-phases.ts`); the oracle still checks it on its own.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
	RichTextData,
	registerFormatType,
	unregisterFormatType,
	store as richTextStore,
} from '@wordpress/rich-text';
import { select } from '@wordpress/data';
import {
	registerSuggestionFormat,
	unregisterSuggestionFormats,
	isSuggestionFormat,
} from '../format';
import { rebaseFormatOriginal, resolveInlineSuggestion } from '../resolution';
import { rebaseFormatDelta } from '../format-delta';
import type { FormatDelta } from '../format-delta';
import {
	HTML_TAGS,
	applyDecision,
	buildFixtureState,
	displayed,
	formatDelta,
	formatOriginalHTML,
	label,
	render,
	sampleSequences,
	sequencesFor,
	toContentHTML,
} from './fixtures/overlap-oracle';
import type { OracleState, Step } from './fixtures/overlap-oracle';
import { FIXTURES } from './fixtures/overlaps';
import { randomFixture } from './fixtures/overlap-fuzz';
import { isPhaseLanded } from './fixtures/overlap-phases';

/**
 * Render a value the way the oracle does: text with content formats in
 * nested tags, markers ignored.
 *
 * @param value Rich-text value.
 * @return Rendering.
 */
function renderValue( value: RichTextData ): string {
	const formats = value.formats as any[];
	return render(
		[ ...value.text ].map( ( ch, i ) => ( {
			ch,
			formats: ( formats[ i ] ?? [] )
				.filter( ( f: any ) => ! isSuggestionFormat( f ) )
				.map( ( f: any ) => f.type ),
		} ) )
	);
}

/**
 * Drive one decision sequence through `resolveInlineSuggestion`, keeping each
 * pending formatting change's delta and original current as the real
 * decision hook does,
 * and compare with the oracle after every step.
 *
 * @param start    Starting state.
 * @param sequence Decisions.
 */
function replay( start: OracleState, sequence: Step[] ) {
	let value = RichTextData.fromHTMLString( toContentHTML( start ) );
	expect( renderValue( value ) ).toBe( displayed( start ) );
	let oracle = start;
	const originals = new Map< string, string >();
	const deltas = new Map< string, FormatDelta >();
	for ( const s of start.suggestions ) {
		if ( s.kind === 'format' ) {
			originals.set( s.id, formatOriginalHTML( start, s.id ) );
			deltas.set( s.id, formatDelta( start, s.id ) );
		}
	}
	const outdated = new Set< string >();
	for ( const step of sequence ) {
		const suggestion = oracle.suggestions.find(
			( s ) => s.id === step.id
		)!;
		expect( suggestion.status ).toBe( 'pending' );
		const effect = resolveInlineSuggestion( value, {
			id: step.id,
			suggestionType: suggestion.kind,
			decision: step.decision,
			beforeHTML: originals.get( step.id ),
			formatDeltas: ( id ) => deltas.get( id ),
		} );
		expect( effect.restored ).not.toBe( false );
		value = effect.value;
		for ( const [ id, change ] of effect.affected ) {
			if ( change === 'emptied' ) {
				outdated.add( id );
			}
		}
		for ( const [ id, offsets ] of effect.formatRemovals ) {
			originals.set(
				id,
				rebaseFormatOriginal( originals.get( id )!, offsets )
			);
			deltas.set( id, rebaseFormatDelta( deltas.get( id )!, offsets ) );
		}
		for ( const [ id, revision ] of effect.formatRevisions ) {
			originals.set( id, revision.beforeHTML );
			deltas.set( id, revision.delta );
		}
		oracle = applyDecision( oracle, step );
		expect( renderValue( value ) ).toBe( displayed( oracle ) );
		expect( [ ...outdated ].sort() ).toEqual(
			oracle.suggestions
				.filter( ( s ) => s.status === 'outdated' )
				.map( ( s ) => s.id )
				.sort()
		);
	}
	// Every suggestion is decided or outdated: no marker is left.
	expect(
		( value.formats as any[] ).some( ( stack ) =>
			stack?.some( isSuggestionFormat )
		)
	).toBe( false );
	expect( renderValue( value ) ).toBe( displayed( oracle ) );
}

const registered: string[] = [];

describe( 'overlapping suggestions through the operations', () => {
	beforeAll( () => {
		registerSuggestionFormat();
		for ( const [ type, tagName ] of Object.entries( HTML_TAGS ) ) {
			if (
				! ( select( richTextStore as any ) as any ).getFormatType(
					type
				)
			) {
				registerFormatType( type, {
					title: type,
					tagName,
					className: null,
					edit: () => null,
				} as any );
				registered.push( type );
			}
		}
	} );

	afterAll( () => {
		unregisterSuggestionFormats();
		for ( const type of registered ) {
			unregisterFormatType( type );
		}
	} );

	for ( const fixture of FIXTURES ) {
		describe.skipIf( ! isPhaseLanded( fixture.phase ) )(
			`${ fixture.name } (phase ${ fixture.phase })`,
			() => {
				const state = buildFixtureState( fixture );

				it( 'round-trips its content in canonical order', () => {
					const html = toContentHTML( state );
					expect(
						RichTextData.fromHTMLString( html ).toHTMLString()
					).toBe( html );
				} );

				it.each(
					sequencesFor( state ).sequences.map( ( sequence ) => [
						label( sequence, state ),
						sequence,
					] )
				)( '%s', ( _label, sequence ) => {
					expect.hasAssertions();
					replay( state, sequence as Step[] );
				} );
			}
		);
	}

	describe.each( [
		[ 'A', [ 'add', 'del' ] ],
		[ 'B', [ 'add', 'del', 'format' ] ],
	] as const )( 'property fuzz (phase %s)', ( phase, kinds ) => {
		const seeds = Array.from( { length: 25 }, ( _, i ) => 2000 + i );
		it.skipIf( ! isPhaseLanded( phase ) ).each( seeds )(
			'seed %i',
			( seed ) => {
				const state = buildFixtureState(
					randomFixture( seed, { kinds: [ ...kinds ] } )
				);
				expect.hasAssertions();
				for ( const sequence of sampleSequences( state, 10, seed ) ) {
					replay( state, sequence );
				}
			}
		);
	} );
} );
