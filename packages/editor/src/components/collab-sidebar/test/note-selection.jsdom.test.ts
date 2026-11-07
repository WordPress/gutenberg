import { beforeAll, describe, expect, it } from 'vitest';
import { RichTextData, registerFormatType } from '@wordpress/rich-text';
import {
	getNoteAtCaret,
	getCaretChange,
	pickNoteForCaret,
	pickPrimaryNote,
} from '../utils/note-selection';
import type { BlockAttributes, BlockSelection } from '../utils/types';
import { noteFormat } from '../format';
import { NOTE_FORMAT_NAME } from '../constants';

beforeAll( () => {
	registerFormatType( NOTE_FORMAT_NAME, noteFormat );
} );

describe( 'pickPrimaryNote', () => {
	it( 'returns null for an empty list', () => {
		expect( pickPrimaryNote( [] ) ).toBeNull();
	} );

	it( 'returns the first unresolved thread when one exists', () => {
		const threads = [
			{ id: 1, status: 'approved' },
			{ id: 2, status: 'hold' },
			{ id: 3, status: 'hold' },
		];
		expect( pickPrimaryNote( threads ) ).toBe( threads[ 1 ] );
	} );

	it( 'falls back to the first thread when none are unresolved', () => {
		const threads = [
			{ id: 1, status: 'approved' },
			{ id: 2, status: 'approved' },
		];
		expect( pickPrimaryNote( threads ) ).toBe( threads[ 0 ] );
	} );
} );

describe( 'Note selection', () => {
	// "Alpha" is wrapped by note 7 (offsets 0-5), "charlie" by the draft
	// marker (12-19); note 3 is block-level. Parsed once the format exists.
	let attributes: BlockAttributes;

	beforeAll( () => {
		attributes = {
			content: RichTextData.fromHTMLString(
				'<mark class="wp-note" data-id="7">Alpha</mark> bravo <mark class="wp-note" data-id="new">charlie</mark> delta.'
			),
			metadata: { noteId: [ 3, 7 ] },
		};
	} );

	const notes = [
		{ id: 3, status: 'hold', blockClientId: 'b' },
		{ id: 7, status: 'hold', blockClientId: 'b' },
	];
	const several = [
		{ id: 3, status: 'hold', blockClientId: 'b' },
		{ id: 9, status: 'hold', blockClientId: 'b' },
	];
	const caret = ( offset: number, end = offset ) => ( {
		selectionStart: { attributeKey: 'content', offset },
		selectionEnd: { attributeKey: 'content', offset: end },
	} );
	const noCaret = { selectionStart: {}, selectionEnd: {} };
	const pick = (
		{
			selectionStart,
			selectionEnd,
		}: { selectionStart: BlockSelection; selectionEnd: BlockSelection },
		{
			attributes: blockAttributes = attributes,
			...overrides
		}: Partial< Parameters< typeof pickNoteForCaret >[ 0 ] > = {}
	) =>
		pickNoteForCaret( {
			noteAtCaret: getNoteAtCaret(
				blockAttributes,
				selectionStart,
				selectionEnd
			),
			attributes: blockAttributes,
			blockThreads: notes,
			hasDraft: false,
			selectedNoteId: undefined,
			isBlockChange: true,
			...overrides,
		} );

	const at = ( clientId: string, offset: number ) => ( {
		clientId,
		attributeKey: 'content',
		offset,
	} );
	const blockAttributes = {};
	const snapshot = (
		clientIds: string[],
		start: BlockSelection,
		end = start,
		attrs: BlockAttributes = blockAttributes
	) => ( {
		clientIds,
		attributes: clientIds.length === 1 ? attrs : undefined,
		selectionStart: start,
		selectionEnd: end,
	} );

	describe( 'Enters a marker: selects that note', () => {
		it.each( [
			[ 'a note marker', caret( 2 ), {}, 7 ],
			[ 'the draft marker', caret( 14 ), {}, 'new' ],
			[
				'a note marker in the same block',
				caret( 2 ),
				{ isBlockChange: false },
				7,
			],
			[
				'a note marker in a block with a draft',
				caret( 2 ),
				{ hasDraft: true },
				7,
			],
			[
				'a note marker in a string attribute',
				caret( 2 ),
				{
					attributes: {
						content:
							'<mark class="wp-note" data-id="7">Alpha</mark> bravo',
					},
				},
				7,
			],
		] )( '%s', ( _, selection, overrides, expected ) => {
			expect( pick( selection, overrides ) ).toBe( expected );
		} );
	} );

	describe( "Enters another block, or moves an end of a selection across blocks: selects the block's note", () => {
		it.each( [
			[
				'enters another block',
				snapshot( [ 'a' ], at( 'a', 1 ) ),
				snapshot( [ 'b' ], at( 'b', 1 ) ),
			],
			[
				'enters another block as its content changes, as on a split',
				snapshot( [ 'a' ], at( 'a', 1 ), at( 'a', 1 ), {} ),
				snapshot( [ 'b' ], at( 'b', 0 ), at( 'b', 0 ), {} ),
			],
			[
				'extends the selection to another block',
				snapshot( [ 'a' ], at( 'a', 1 ), at( 'a', 3 ) ),
				snapshot( [ 'a', 'b' ], at( 'a', 1 ), at( 'b', 3 ) ),
			],
			[
				'moves an end of a selection across blocks',
				snapshot( [ 'a', 'b' ], at( 'a', 1 ), at( 'b', 3 ) ),
				snapshot( [ 'a', 'b' ], at( 'a', 1 ), at( 'b', 4 ) ),
			],
		] )( 'is a block change: %s', ( _, previous, next ) => {
			expect( getCaretChange( previous, next ) ).toEqual( {
				isBlockChange: true,
			} );
		} );

		it.each( [
			[ 'the block-level note', caret( 8 ), {}, 3 ],
			[
				'the block-level note for a caret not reported yet',
				noCaret,
				{},
				3,
			],
			[ 'the unsent draft', caret( 8 ), { hasDraft: true }, 'new' ],
			[
				'none without a block-level note',
				caret( 8 ),
				{ blockThreads: [ notes[ 1 ] ] },
				undefined,
			],
			[
				'the selected block-level note',
				caret( 8 ),
				{ blockThreads: several, selectedNoteId: 9 },
				9,
			],
			[
				'the primary block-level note',
				caret( 8 ),
				{ blockThreads: several, selectedNoteId: 7 },
				3,
			],
		] )( 'selects %s', ( _, selection, overrides, expected ) => {
			expect( pick( selection, overrides ) ).toBe( expected );
		} );
	} );

	describe( "Leaves the selected note's marker: selects the block's note", () => {
		it.each( [
			[ "a note's marker", 7 ],
			[ 'the draft marker', 'new' ],
		] )( '%s', ( _, selectedNoteId ) => {
			expect(
				pick( caret( 8 ), { isBlockChange: false, selectedNoteId } )
			).toBe( 3 );
		} );
	} );

	describe( 'Anything else: keeps the selection', () => {
		const point = at( 'a', 1 );
		it.each( [
			[
				'typing',
				snapshot( [ 'a' ], at( 'a', 1 ), at( 'a', 1 ), {} ),
				snapshot( [ 'a' ], at( 'a', 2 ), at( 'a', 2 ), {} ),
			],
			[
				'a store change that keeps the selection',
				snapshot( [ 'a' ], point ),
				snapshot( [ 'a' ], point ),
			],
		] )( 'is no caret move: %s', ( _, previous, next ) => {
			expect( getCaretChange( previous, next ) ).toBeNull();
		} );

		it.each( [
			[
				'moving in plain text',
				snapshot( [ 'a' ], at( 'a', 1 ) ),
				snapshot( [ 'a' ], at( 'a', 2 ) ),
			],
			[
				'the store replacing the ends of a selection across blocks without moving them',
				snapshot( [ 'a', 'b' ], at( 'a', 1 ), at( 'b', 3 ) ),
				snapshot( [ 'a', 'b' ], at( 'a', 1 ), at( 'b', 3 ) ),
			],
		] )( 'is no block change: %s', ( _, previous, next ) => {
			expect( getCaretChange( previous, next ) ).toEqual( {
				isBlockChange: false,
			} );
		} );

		it.each( [
			[ 'moving in plain text, none selected', caret( 8 ), undefined ],
			[
				'moving in plain text, a block-level note selected',
				caret( 8 ),
				3,
			],
			[ 'a caret not reported yet', noCaret, 7 ],
		] )( '%s', ( _, selection, selectedNoteId ) => {
			expect(
				pick( selection, { isBlockChange: false, selectedNoteId } )
			).toBe( selectedNoteId );
		} );
	} );
} );
