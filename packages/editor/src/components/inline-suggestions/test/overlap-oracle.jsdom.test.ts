/**
 * annezazu's example (#73411), every accept/reject order, through the real
 * operations, checked against the character model in `fixtures/`.
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
import {
	ANNEZAZU,
	ANNEZAZU_V2,
	ANNEZAZU_V3,
	allSequences,
	applyDecision,
	formatOriginalHTML,
	publishedText,
	toContentHTML,
} from './fixtures/overlap-oracle';
import type { OracleState, Step } from './fixtures/overlap-oracle';

const BOLD = 'test/oracle-bold';

/**
 * Render a value the way the oracle does: text with bold runs in `<b>`.
 *
 * @param value Rich-text value.
 * @return Rendering.
 */
function renderValue( value: RichTextData ): string {
	let out = '';
	let bold = false;
	const formats = value.formats as any[];
	for ( let i = 0; i < value.text.length; i++ ) {
		const isBold = !! formats[ i ]?.some( ( f: any ) => f.type === BOLD );
		if ( isBold !== bold ) {
			out += isBold ? '<b>' : '</b>';
			bold = isBold;
		}
		out += value.text[ i ];
	}
	return out + ( bold ? '</b>' : '' );
}

/**
 * Drive one decision sequence through `resolveInlineSuggestion`, keeping each
 * pending formatting change's original rebased as the real decision hook does,
 * and compare with the oracle after every step.
 *
 * @param start    Starting state.
 * @param sequence Decisions.
 */
function replay( start: OracleState, sequence: Step[] ) {
	let value = RichTextData.fromHTMLString( toContentHTML( start ) );
	let oracle = start;
	const originals = new Map< string, string >();
	for ( const s of start.suggestions ) {
		if ( s.kind === 'format' ) {
			originals.set( s.id, formatOriginalHTML( start, s.id ) );
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
		}
		oracle = applyDecision( oracle, step );
		expect( renderValue( value ) ).toBe(
			publishedText( {
				...oracle,
				// Pending markers do not change text or formatting.
				chars: oracle.chars,
			} )
		);
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
	return { published: renderValue( value ), oracle };
}

const label = ( sequence: Step[] ) =>
	sequence
		.map(
			( { id, decision } ) =>
				`${ decision === 'accept' ? '+' : '-' }${
					{ 1: 'a', 2: 'b', 3: 'c' }[ id ]
				}`
		)
		.join( ' ' );

describe( 'overlapping suggestions oracle', () => {
	beforeAll( () => {
		registerSuggestionFormat();
		if (
			! ( select( richTextStore as any ) as any ).getFormatType( BOLD )
		) {
			registerFormatType( BOLD, {
				title: 'Bold',
				tagName: 'strong',
				className: null,
				edit: () => null,
			} as any );
		}
	} );

	afterAll( () => {
		unregisterSuggestionFormats();
		unregisterFormatType( BOLD );
	} );

	it( 'has 37 decision sequences with five published texts', () => {
		const sequences = allSequences( ANNEZAZU );
		expect( sequences ).toHaveLength( 37 );
		const finals = new Map< string, number >();
		for ( const sequence of sequences ) {
			let state = ANNEZAZU;
			for ( const step of sequence ) {
				state = applyDecision( state, step );
			}
			const published = publishedText( state );
			finals.set( published, ( finals.get( published ) ?? 0 ) + 1 );
		}
		expect( Object.fromEntries( finals ) ).toEqual( {
			'Intro.': 13,
			'Intro. Bright <b>red apples</b> fell.': 6,
			'Intro. Bright <b>red </b>.': 6,
			'Intro. Bright red apples fell.': 6,
			'Intro. Bright red .': 6,
		} );
	} );

	it( 'serializes the example in canonical marker order', () => {
		const html = toContentHTML( ANNEZAZU );
		const value = RichTextData.fromHTMLString( html );
		expect( value.toHTMLString() ).toBe( html );
	} );

	describe( 'annezazu', () => {
		it.each(
			allSequences( ANNEZAZU ).map( ( sequence ) => [
				label( sequence ),
				sequence,
			] )
		)( '%s', ( _label, sequence ) => {
			const { published, oracle } = replay(
				ANNEZAZU,
				sequence as Step[]
			);
			expect( published ).toBe( publishedText( oracle ) );
		} );
	} );

	describe( 'variant: the deletion covers all of the bolded words', () => {
		it.each(
			allSequences( ANNEZAZU_V2 ).map( ( sequence ) => [
				label( sequence ),
				sequence,
			] )
		)( '%s', ( _label, sequence ) => {
			const { published, oracle } = replay(
				ANNEZAZU_V2,
				sequence as Step[]
			);
			expect( published ).toBe( publishedText( oracle ) );
		} );

		it( 'accepting the deletion outdates the formatting change', () => {
			const state = applyDecision( ANNEZAZU_V2, {
				id: '3',
				decision: 'accept',
			} );
			expect(
				state.suggestions.find( ( s ) => s.id === '2' )!.status
			).toBe( 'outdated' );
		} );
	} );

	describe( 'variant: the deletion spans original text and the addition', () => {
		it.each(
			allSequences( ANNEZAZU_V3 ).map( ( sequence ) => [
				label( sequence ),
				sequence,
			] )
		)( '%s', ( _label, sequence ) => {
			const { published, oracle } = replay(
				ANNEZAZU_V3,
				sequence as Step[]
			);
			expect( published ).toBe( publishedText( oracle ) );
		} );

		it( 'rejecting the addition shrinks the deletion instead', () => {
			const state = applyDecision( ANNEZAZU_V3, {
				id: '1',
				decision: 'reject',
			} );
			expect(
				state.suggestions.find( ( s ) => s.id === '3' )!.status
			).toBe( 'pending' );
			expect( publishedText( state ) ).toBe( 'Intro.' );
		} );
	} );
} );
