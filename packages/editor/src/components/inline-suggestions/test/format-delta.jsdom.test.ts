/**
 * Formatting suggestions as per-id deltas: stacked changes on the same words,
 * a change straddling an addition, and decisions in every order.
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
} from '../format';
import {
	computeFormatDelta,
	formatDeltaFromOriginal,
	formatSuggestionIndices,
	isEmptyFormatDelta,
	rebaseFormatDelta,
} from '../format-delta';
import type { FormatDelta } from '../format-delta';
import { resolveInlineSuggestion } from '../resolution';

const BOLD = 'test/delta-bold';
const ITALIC = 'test/delta-italic';

const mark = (
	kind: 'add' | 'del' | 'format',
	id: number,
	inner: string,
	author = 1
) =>
	`<mark data-suggestion-id="${ id }" data-suggestion-type="${ kind }" data-author="${ author }" class="wp-suggestion-${ kind }">${ inner }</mark>`;

const rtd = ( html: string ) => RichTextData.fromHTMLString( html );

const bold = { type: BOLD };
const italic = { type: ITALIC };

function deltasOf( map: Record< string, FormatDelta > ) {
	return ( id: string ) => map[ id ];
}

/*
 * "word", plain. A (id 1) bolds it; B (id 2), seeing bold, removes bold and
 * adds italic. Displayed: italic.
 */
function stackedConflict() {
	return {
		value: rtd( mark( 'format', 1, mark( 'format', 2, '<em>word</em>' ) ) ),
		deltas: {
			'1': [ { offset: 0, length: 4, added: [ bold ], removed: [] } ],
			'2': [
				{
					offset: 0,
					length: 4,
					added: [ italic ],
					removed: [ bold ],
				},
			],
		} as Record< string, FormatDelta >,
	};
}

function decide(
	value: any,
	deltas: Record< string, FormatDelta >,
	id: number,
	decision: 'accept' | 'reject'
) {
	return resolveInlineSuggestion( value, {
		id,
		suggestionType: 'format',
		decision,
		formatDeltas: deltasOf( deltas ),
	} );
}

describe( 'formatting deltas', () => {
	beforeAll( () => {
		registerSuggestionFormat();
		const formatTypes = ( select( richTextStore as any ) as any )
			.getFormatTypes()
			.map( ( type: any ) => type.name );
		if ( ! formatTypes.includes( BOLD ) ) {
			registerFormatType( BOLD, {
				title: 'Bold',
				tagName: 'strong',
				className: null,
				edit: () => null,
			} as any );
		}
		if ( ! formatTypes.includes( ITALIC ) ) {
			registerFormatType( ITALIC, {
				title: 'Italic',
				tagName: 'em',
				className: null,
				edit: () => null,
			} as any );
		}
	} );

	afterAll( () => {
		unregisterSuggestionFormats();
		unregisterFormatType( BOLD );
		unregisterFormatType( ITALIC );
	} );

	describe( 'computing a delta', () => {
		it( 'records only the formats that changed, per character', () => {
			const prev = rtd( 'a<strong>bc</strong>d' );
			const next = rtd( 'a<strong><em>b</em>c</strong>d' );
			expect( computeFormatDelta( prev, next, [ 1, 2 ] ) ).toEqual( [
				{ offset: 0, length: 1, added: [ italic ], removed: [] },
			] );
		} );

		it( 'derives a delta from a recorded original', () => {
			const value = rtd(
				`a${ mark( 'format', 4, '<strong>bc</strong>' ) }d`
			);
			expect( formatDeltaFromOriginal( value, 4, 'bc' ) ).toEqual( [
				{ offset: 0, length: 2, added: [ bold ], removed: [] },
			] );
			expect( formatDeltaFromOriginal( value, 4, 'bcd' ) ).toBeNull();
		} );

		it( 'drops the offsets of characters that left the run', () => {
			const delta: FormatDelta = [
				{ offset: 0, length: 2, added: [ bold ], removed: [] },
				{ offset: 2, length: 2, added: [ italic ], removed: [] },
			];
			expect( rebaseFormatDelta( delta, [ 1, 2 ] ) ).toEqual( [
				{ offset: 0, length: 1, added: [ bold ], removed: [] },
				{ offset: 1, length: 1, added: [ italic ], removed: [] },
			] );
		} );

		it( 'counts the characters of a split run in document order', () => {
			const value = rtd(
				`${ mark( 'format', 5, 'ab' ) }${ mark(
					'add',
					3,
					mark( 'format', 5, 'cd' )
				) }`
			);
			expect( formatSuggestionIndices( value, 5 ) ).toEqual( [
				0, 1, 2, 3,
			] );
		} );
	} );

	describe( 'stacked formatting changes with a conflict', () => {
		const html = ( value: any ) => value.toHTMLString();

		it( 'reject A: B keeps adding italic, its removal of bold is void', () => {
			const { value, deltas } = stackedConflict();
			const effect = decide( value, deltas, 1, 'reject' );
			expect( html( effect.value ) ).toBe(
				mark( 'format', 2, '<em>word</em>' )
			);
			expect( effect.formatRevisions.get( '2' )?.delta ).toEqual( [
				{ offset: 0, length: 4, added: [ italic ], removed: [] },
			] );
			expect( effect.formatRevisions.get( '2' )?.beforeHTML ).toBe(
				'word'
			);
			expect( effect.affected.size ).toBe( 0 );
		} );

		it( 'accept A, then accept B: italic, not bold', () => {
			const { value, deltas } = stackedConflict();
			const first = decide( value, deltas, 1, 'accept' );
			expect( first.formatRevisions.get( '2' )?.beforeHTML ).toBe(
				'<strong>word</strong>'
			);
			const second = decide(
				first.value,
				{ '2': first.formatRevisions.get( '2' )!.delta },
				2,
				'accept'
			);
			expect( html( second.value ) ).toBe( '<em>word</em>' );
		} );

		it( 'accept B, then reject A: italic, not bold', () => {
			const { value, deltas } = stackedConflict();
			const first = decide( value, deltas, 2, 'accept' );
			const second = decide(
				first.value,
				{
					'1':
						first.formatRevisions.get( '1' )?.delta ??
						deltas[ '1' ],
				},
				1,
				'reject'
			);
			expect( html( second.value ) ).toBe( '<em>word</em>' );
		} );

		it( 'reject B: A shows again', () => {
			const { value, deltas } = stackedConflict();
			const effect = decide( value, deltas, 2, 'reject' );
			expect( html( effect.value ) ).toBe(
				mark( 'format', 1, '<strong>word</strong>' )
			);
		} );

		it( 'outdates a change with no effect left', () => {
			// B only removed A's bold: rejecting A leaves B nothing to do.
			const value = rtd(
				mark( 'format', 1, mark( 'format', 2, 'word' ) )
			);
			const deltas = {
				'1': [ { offset: 0, length: 4, added: [ bold ], removed: [] } ],
				'2': [ { offset: 0, length: 4, added: [], removed: [ bold ] } ],
			};
			const effect = decide( value, deltas, 1, 'reject' );
			expect( effect.affected.get( '2' ) ).toBe( 'emptied' );
			expect( html( effect.value ) ).toBe( 'word' );
		} );

		it( 'ends at the same text in every order', () => {
			const outcomes = new Set< string >();
			const orders: Array< Array< [ number, 'accept' | 'reject' ] > > = [
				[
					[ 1, 'accept' ],
					[ 2, 'accept' ],
				],
				[
					[ 2, 'accept' ],
					[ 1, 'accept' ],
				],
			];
			for ( const order of orders ) {
				let { value, deltas } = stackedConflict();
				deltas = { ...deltas };
				for ( const [ id, decision ] of order ) {
					const effect = decide( value, deltas, id, decision );
					value = effect.value;
					for ( const [
						other,
						revision,
					] of effect.formatRevisions ) {
						deltas[ other ] = revision.delta;
					}
				}
				outcomes.add( html( value ) );
			}
			expect( [ ...outcomes ] ).toEqual( [ '<em>word</em>' ] );
		} );
	} );

	describe( 'a formatting change straddling an addition', () => {
		// B (id 5) bolds "abcd" where "cd" is A's (id 3) addition.
		const straddle = () =>
			rtd(
				`${ mark( 'format', 5, '<strong>ab</strong>' ) }${ mark(
					'add',
					3,
					mark( 'format', 5, '<strong>cd</strong>' )
				) }e`
			);
		const deltas = {
			'5': [ { offset: 0, length: 4, added: [ bold ], removed: [] } ],
		};

		it( 'rejecting the addition shrinks the change to the outside part', () => {
			const effect = resolveInlineSuggestion( straddle(), {
				id: 3,
				suggestionType: 'add',
				decision: 'reject',
			} );
			expect( effect.formatRemovals.get( '5' ) ).toEqual( [ 2, 3 ] );
			const rebased = rebaseFormatDelta(
				deltas[ '5' ],
				effect.formatRemovals.get( '5' )!
			);
			expect( rebased ).toEqual( [
				{ offset: 0, length: 2, added: [ bold ], removed: [] },
			] );
			const rejected = decide(
				effect.value,
				{ '5': rebased },
				5,
				'reject'
			);
			expect( rejected.value.toHTMLString() ).toBe( 'abe' );
		} );

		it( 'rejecting the change keeps the addition', () => {
			const effect = decide( straddle(), deltas, 5, 'reject' );
			expect( effect.value.toHTMLString() ).toBe(
				`ab${ mark( 'add', 3, 'cd' ) }e`
			);
		} );
	} );

	it( 'falls back to the recorded original when a delta is unknown', () => {
		const value = rtd(
			`a${ mark( 'format', 4, '<strong>bc</strong>' ) }d`
		);
		const effect = resolveInlineSuggestion( value, {
			id: 4,
			suggestionType: 'format',
			decision: 'reject',
			beforeHTML: 'bc',
			formatDeltas: () => undefined,
		} );
		expect( effect.value.toHTMLString() ).toBe( 'abcd' );
		expect( isEmptyFormatDelta( [] ) ).toBe( true );
	} );
	it( 'drops event handlers from a delta when restoring formats', () => {
		const value = rtd( `a${ mark( 'format', 6, 'bc' ) }d` );
		const effect = decide(
			value,
			{
				'6': [
					{
						offset: 0,
						length: 2,
						added: [],
						removed: [
							{
								type: BOLD,
								unregisteredAttributes: {
									onclick: 'alert(1)',
									'data-x': 'y',
								},
							},
						],
					},
				],
			},
			6,
			'reject'
		);
		expect( effect.value.toHTMLString() ).toBe(
			'a<strong data-x="y">bc</strong>d'
		);
	} );
} );
