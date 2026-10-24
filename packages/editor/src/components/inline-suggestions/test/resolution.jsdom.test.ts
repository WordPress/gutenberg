/**
 * Resolving one suggestion when others nest in it or around it: per-kind
 * accept and reject, what the decision does to the other suggestions, and the
 * per-character restore that rejects a formatting change.
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
	findSuggestionText,
} from '../format';
import {
	acceptInlineAddition,
	acceptInlineDeletion,
	acceptInlineFormat,
	rejectInlineAddition,
	rejectInlineDeletion,
	rejectInlineFormat,
} from '../operations';
import {
	formatOriginalAligns,
	rebaseFormatOriginal,
	resolveInlineSuggestion,
} from '../resolution';

const BOLD = 'test/resolution-bold';

const mark = (
	kind: 'add' | 'del' | 'format',
	id: number,
	inner: string,
	author = 1
) =>
	`<mark data-suggestion-id="${ id }" data-suggestion-type="${ kind }" data-author="${ author }" class="wp-suggestion-${ kind }">${ inner }</mark>`;

const rtd = ( html: string ) => RichTextData.fromHTMLString( html );

/*
 * annezazu's example: A (id 1) adds " Bright red apples fell.", B (id 2)
 * bolds "red apples" inside it, C (id 3) deletes "apples fell", including
 * the bolded "apples". Canonical nesting: add, then format, then del.
 */
const annezazu = () =>
	rtd(
		`Intro.${ mark(
			'add',
			1,
			` Bright ${ mark(
				'format',
				2,
				`<strong>red </strong>${ mark(
					'del',
					3,
					'<strong>apples</strong>',
					3
				) }`,
				2
			) }${ mark( 'del', 3, ' fell', 3 ) }.`
		) }`
	);

describe( 'resolving nested suggestions', () => {
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

	describe( 'per-kind accept and reject', () => {
		it( 'accepting the parent addition leaves its children pending', () => {
			const next = acceptInlineAddition( annezazu(), 1 );
			expect( findSuggestionText( next, 1 ) ).toBe( '' );
			expect( findSuggestionText( next, 2 ) ).toBe( 'red apples' );
			expect( findSuggestionText( next, 3 ) ).toBe( 'apples fell' );
			expect( next.text ).toBe( 'Intro. Bright red apples fell.' );
		} );

		it( 'rejecting the parent addition removes its children with it', () => {
			const next = rejectInlineAddition( annezazu(), 1 );
			expect( next.toHTMLString() ).toBe( 'Intro.' );
		} );

		it( 'accepting a nested deletion shrinks the parent', () => {
			const next = acceptInlineDeletion( annezazu(), 3 );
			expect( findSuggestionText( next, 1 ) ).toBe( ' Bright red .' );
			expect( findSuggestionText( next, 2 ) ).toBe( 'red ' );
		} );

		it( 'rejecting a nested deletion keeps every other marker', () => {
			const next = rejectInlineDeletion( annezazu(), 3 );
			expect( findSuggestionText( next, 1 ) ).toBe(
				' Bright red apples fell.'
			);
			expect( findSuggestionText( next, 2 ) ).toBe( 'red apples' );
			expect( findSuggestionText( next, 3 ) ).toBe( '' );
		} );

		it( 'accepting a nested formatting change keeps the parent and the deletion', () => {
			const next = acceptInlineFormat( annezazu(), 2 );
			expect( findSuggestionText( next, 2 ) ).toBe( '' );
			expect( findSuggestionText( next, 1 ) ).toBe(
				' Bright red apples fell.'
			);
			expect( findSuggestionText( next, 3 ) ).toBe( 'apples fell' );
			expect( next.toHTMLString() ).toContain( '<strong>red </strong>' );
		} );
	} );

	describe( 'rejectInlineFormat', () => {
		it( 'restores the original per character and keeps the enclosing markers', () => {
			const next = rejectInlineFormat( annezazu(), 2, 'red apples' );
			expect( next.toHTMLString() ).not.toContain( '<strong>' );
			expect( findSuggestionText( next, 2 ) ).toBe( '' );
			// The parent's proposed text stays proposed.
			expect( findSuggestionText( next, 1 ) ).toBe(
				' Bright red apples fell.'
			);
			expect( findSuggestionText( next, 3 ) ).toBe( 'apples fell' );
		} );

		it( 'restores original formatting that the proposal removed', () => {
			const value = rtd( `a${ mark( 'format', 4, 'bc' ) }d` );
			const next = rejectInlineFormat( value, 4, '<strong>bc</strong>' );
			expect( next.toHTMLString() ).toBe( 'a<strong>bc</strong>d' );
		} );

		it( 'drops only the marker when the original no longer matches the run', () => {
			const value = rtd(
				`a${ mark( 'format', 4, '<strong>bcd</strong>' ) }e`
			);
			expect( formatOriginalAligns( value, 4, 'bc' ) ).toBe( false );
			const next = rejectInlineFormat( value, 4, 'bc' );
			expect( next.text ).toBe( 'abcde' );
			expect( findSuggestionText( next, 4 ) ).toBe( '' );
		} );
	} );

	describe( 'resolveInlineSuggestion', () => {
		it( 'reports every child of a rejected parent as emptied', () => {
			const effect = resolveInlineSuggestion( annezazu(), {
				id: 1,
				suggestionType: 'add',
				decision: 'reject',
			} );
			expect( effect.value.toHTMLString() ).toBe( 'Intro.' );
			expect( effect.removed ).toEqual( [ [ 6, 30 ] ] );
			expect( [ ...effect.affected ] ).toEqual( [
				[ '2', 'emptied' ],
				[ '3', 'emptied' ],
			] );
		} );

		it( 'reports a parent shrunk by an accepted nested deletion, and where its child lost text', () => {
			const effect = resolveInlineSuggestion( annezazu(), {
				id: 3,
				suggestionType: 'del',
				decision: 'accept',
			} );
			expect( [ ...effect.affected ] ).toEqual( [
				[ '1', 'shrunk' ],
				[ '2', 'shrunk' ],
			] );
			// "red apples": offsets 4-9 ("apples") left the format run.
			expect( effect.formatRemovals.get( '2' ) ).toEqual( [
				4, 5, 6, 7, 8, 9,
			] );
		} );

		it( 'reports nothing for a decision that keeps every character', () => {
			for ( const [ id, suggestionType, decision ] of [
				[ 1, 'add', 'accept' ],
				[ 3, 'del', 'reject' ],
				[ 2, 'format', 'accept' ],
			] as const ) {
				const effect = resolveInlineSuggestion( annezazu(), {
					id,
					suggestionType,
					decision,
				} );
				expect( effect.removed ).toEqual( [] );
				expect( effect.affected.size ).toBe( 0 );
			}
		} );

		it( 'restores a rejected formatting change from its original', () => {
			const effect = resolveInlineSuggestion( annezazu(), {
				id: 2,
				suggestionType: 'format',
				decision: 'reject',
				beforeHTML: 'red apples',
			} );
			expect( effect.restored ).toBe( true );
			expect( effect.value.toHTMLString() ).not.toContain( '<strong>' );
		} );

		it( 'shrinks a deletion that spans plain text and a rejected addition', () => {
			const value = rtd(
				`a${ mark( 'del', 5, 'bc', 3 ) }${ mark(
					'add',
					6,
					`${ mark( 'del', 5, 'XY', 3 ) }Z`,
					2
				) }d`
			);
			const effect = resolveInlineSuggestion( value, {
				id: 6,
				suggestionType: 'add',
				decision: 'reject',
			} );
			expect( [ ...effect.affected ] ).toEqual( [ [ '5', 'shrunk' ] ] );
			expect( findSuggestionText( effect.value, 5 ) ).toBe( 'bc' );
		} );
	} );

	describe( 'rebaseFormatOriginal', () => {
		it( 'removes the given offsets from the recorded original', () => {
			expect(
				rebaseFormatOriginal(
					'red <em>apples</em>',
					[ 4, 5, 6, 7, 8, 9 ]
				)
			).toBe( 'red ' );
			expect( rebaseFormatOriginal( '<em>abc</em>', [ 1 ] ) ).toBe(
				'<em>ac</em>'
			);
		} );

		it( 'returns the original unchanged without offsets', () => {
			expect( rebaseFormatOriginal( '<em>abc</em>', [] ) ).toBe(
				'<em>abc</em>'
			);
		} );
	} );
} );
