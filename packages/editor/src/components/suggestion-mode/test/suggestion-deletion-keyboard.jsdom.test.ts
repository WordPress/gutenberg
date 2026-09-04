import { describe, expect, it, vi } from 'vitest';
import { RichTextData } from '@wordpress/rich-text';
import { SUGGESTION_FORMAT_NAME } from '../../inline-suggestions';
import {
	collapsedDeleteDisposition,
	collapsedDeleteTarget,
	isContiguousDeleteRun,
	sliceValueToHTML,
} from '../suggestion-deletion-keyboard';

// The editor store pulls in `@wordpress/viewport`, which reads
// `window.matchMedia` while loading.
vi.hoisted( () => {
	globalThis.wpVitest.mockMatchMedia();
} );

describe( 'sliceValueToHTML', () => {
	it( 'serializes a plain slice', () => {
		expect( sliceValueToHTML( 'Hello world', 6, 11 ) ).toBe( 'world' );
	} );

	it( 'keeps inline formatting inside the slice', () => {
		const value = RichTextData.fromHTMLString(
			'Hello <strong>bold</strong> world'
		);
		// "bold world" spans the formatted run and trailing text.
		expect( sliceValueToHTML( value, 6, 16 ) ).toBe(
			'<strong>bold</strong> world'
		);
	} );

	it( 'clips formatting that extends past the slice', () => {
		const value = RichTextData.fromHTMLString(
			'a <em>emphasized run</em> z'
		);
		// Slice covers only part of the <em> run: the emphasis survives on
		// the covered part.
		expect( sliceValueToHTML( value, 2, 7 ) ).toBe( '<em>empha</em>' );
	} );

	it( 'keeps link formatting and attributes', () => {
		const value = RichTextData.fromHTMLString(
			'go <a href="https://w.org">here</a> now'
		);
		expect( sliceValueToHTML( value, 3, 7 ) ).toBe(
			'<a href="https://w.org">here</a>'
		);
	} );

	it( 'returns an empty string for non-string-like values', () => {
		expect( sliceValueToHTML( undefined, 0, 2 ) ).toBe( '' );
		expect( sliceValueToHTML( null, 0, 2 ) ).toBe( '' );
		expect( sliceValueToHTML( 42, 0, 2 ) ).toBe( '' );
	} );
} );

describe( 'isContiguousDeleteRun', () => {
	const run = {
		clientId: 'a',
		attributeKey: 'content',
		id: 7,
		start: 2,
		end: 3,
		caret: 2,
		dir: 'forward',
	};
	const at = ( overrides?: any ) => ( {
		clientId: 'a',
		attributeKey: 'content',
		isBackward: false,
		pos: 2,
		...overrides,
	} );

	it( 'continues a run whose caret has not moved', () => {
		expect( isContiguousDeleteRun( run, at() ) ).toBe( true );
	} );

	it( 'does not continue without a run', () => {
		expect( isContiguousDeleteRun( null, at() ) ).toBe( false );
	} );

	it( 'does not continue before the note id resolves', () => {
		expect( isContiguousDeleteRun( { ...run, id: null }, at() ) ).toBe(
			false
		);
	} );

	it( 'does not continue in the opposite direction', () => {
		expect( isContiguousDeleteRun( run, at( { isBackward: true } ) ) ).toBe(
			false
		);
	} );

	it( 'does not continue after the caret moves', () => {
		expect( isContiguousDeleteRun( run, at( { pos: 5 } ) ) ).toBe( false );
	} );

	it( 'does not continue in another block or attribute', () => {
		expect( isContiguousDeleteRun( run, at( { clientId: 'b' } ) ) ).toBe(
			false
		);
		expect(
			isContiguousDeleteRun( run, at( { attributeKey: 'citation' } ) )
		).toBe( false );
	} );
} );

describe( 'collapsedDeleteTarget', () => {
	it( 'anchors a new run on the grapheme next to the caret', () => {
		expect( collapsedDeleteTarget( 'abcdef', 3, false ) ).toEqual( {
			start: 3,
			end: 4,
		} );
		expect( collapsedDeleteTarget( 'abcdef', 3, true ) ).toEqual( {
			start: 2,
			end: 3,
		} );
	} );

	it( 'grows a forward run from the run end, not the parked caret', () => {
		// The caret stays at 0 across the whole run, so reading the target
		// from `pos` would re-target "a" on every repeat.
		const run = { start: 0, end: 1, caret: 0 };
		expect( collapsedDeleteTarget( 'abcdef', 0, false, run ) ).toEqual( {
			start: 1,
			end: 2,
		} );
		run.end = 2;
		expect( collapsedDeleteTarget( 'abcdef', 0, false, run ) ).toEqual( {
			start: 2,
			end: 3,
		} );
	} );

	it( 'grows a backward run from the run start', () => {
		const run = { start: 4, end: 6, caret: 4 };
		expect( collapsedDeleteTarget( 'abcdef', 4, true, run ) ).toEqual( {
			start: 3,
			end: 4,
		} );
	} );

	it( 'returns null at the value edges', () => {
		expect( collapsedDeleteTarget( 'abcdef', 0, true ) ).toBeNull();
		expect( collapsedDeleteTarget( 'abcdef', 6, false ) ).toBeNull();
		// A forward run that has reached the end of the value.
		expect(
			collapsedDeleteTarget( 'abcdef', 0, false, {
				start: 0,
				end: 6,
				caret: 0,
			} )
		).toBeNull();
	} );

	it( 'steps over a whole emoji grapheme in both directions', () => {
		const text = 'a👨‍👩‍👧b';
		const family = text.slice( 1, text.length - 1 );
		const forward = collapsedDeleteTarget( text, 1, false )!;
		expect( text.slice( forward.start, forward.end ) ).toBe( family );
		// And when growing a run that has already marked the leading "a".
		const grown = collapsedDeleteTarget( text, 0, false, {
			start: 0,
			end: 1,
			caret: 0,
		} )!;
		expect( text.slice( grown.start, grown.end ) ).toBe( family );
	} );
} );

describe( 'collapsedDeleteDisposition', () => {
	const marker = [ { type: SUGGESTION_FORMAT_NAME } ];
	// "abcdef" whose leading "ab" already carries a marker.
	const marked = [
		marker,
		marker,
		undefined,
		undefined,
		undefined,
		undefined,
	];
	const unmarked = new Array( 6 ).fill( undefined );
	const forwardRun = ( end: number ) => ( {
		clientId: 'a',
		attributeKey: 'content',
		id: 7,
		start: 0,
		end,
		caret: 0,
		dir: 'forward',
	} );
	const decide = ( overrides?: any ) =>
		collapsedDeleteDisposition( {
			text: 'abcdef',
			formats: unmarked,
			pos: 3,
			isBackward: false,
			run: null,
			...overrides,
		} );

	it( 'marks a grapheme that carries no marker', () => {
		expect( decide() ).toBe( 'mark' );
		expect( decide( { isBackward: true } ) ).toBe( 'mark' );
	} );

	it( 'grows a run past its own marker rather than refusing it', () => {
		// The caret is parked inside the marker the run opened; the target
		// comes from the run's far edge, which is still free text.
		expect(
			decide( { formats: marked, pos: 0, run: forwardRun( 2 ) } )
		).toBe( 'mark' );
	} );

	it( 'refuses a keystroke aimed into an existing marker', () => {
		// No run in progress: an arrow key is all it takes to park the caret
		// inside a marker an earlier run left behind. Falling through would
		// have the browser remove text that is only proposed for removal.
		expect( decide( { formats: marked, pos: 1 } ) ).toBe( 'refuse' );
		expect( decide( { formats: marked, pos: 2, isBackward: true } ) ).toBe(
			'refuse'
		);
	} );

	it( 'refuses a forward run that has reached the end of the value', () => {
		expect(
			decide( {
				text: 'ab',
				formats: marked,
				pos: 0,
				run: forwardRun( 2 ),
			} )
		).toBe( 'refuse' );
	} );

	it( 'leaves a block edge with no run to the default path', () => {
		// Native block merges still have to happen.
		expect( decide( { pos: 6 } ) ).toBe( 'default' );
		expect( decide( { pos: 0, isBackward: true } ) ).toBe( 'default' );
	} );

	it( 'leaves a backward run at offset 0 to the default path', () => {
		// Backspace there merges with the previous block; it does not reach
		// into the marker.
		expect(
			decide( {
				formats: marked,
				pos: 0,
				isBackward: true,
				run: { ...forwardRun( 2 ), dir: 'backward' },
			} )
		).toBe( 'default' );
	} );
} );
