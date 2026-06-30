/**
 * WordPress dependencies
 */
import {
	RichTextData,
	create,
	applyFormat,
	registerFormatType,
	unregisterFormatType,
	store as richTextStore,
} from '@wordpress/rich-text';
import { select } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	findNoteRange,
	findNoteInBlock,
	applyNoteFormat,
	removeNoteFormat,
	getNoteIdsFromMetadata,
	addNoteIdToMetadata,
	removeNoteIdFromMetadata,
	calculateNotePositions,
	pickPrimaryNote,
	BLOCK_LEVEL_NOTE_START,
	getInlineMarkerStart,
} from '../utils';

function makeRect( top ) {
	return { top };
}

describe( 'getNoteIdsFromMetadata', () => {
	it( 'returns empty array for null metadata', () => {
		expect( getNoteIdsFromMetadata( null ) ).toEqual( [] );
	} );

	it( 'returns empty array for undefined metadata', () => {
		expect( getNoteIdsFromMetadata( undefined ) ).toEqual( [] );
	} );

	it( 'returns empty array for metadata without noteId', () => {
		expect( getNoteIdsFromMetadata( {} ) ).toEqual( [] );
		expect( getNoteIdsFromMetadata( { name: 'test' } ) ).toEqual( [] );
	} );

	it( 'returns empty array for noteId of 0', () => {
		expect( getNoteIdsFromMetadata( { noteId: 0 } ) ).toEqual( [] );
	} );

	it( 'returns empty array for noteId of empty string', () => {
		expect( getNoteIdsFromMetadata( { noteId: '' } ) ).toEqual( [] );
	} );

	it( 'returns empty array for noteId of false', () => {
		expect( getNoteIdsFromMetadata( { noteId: false } ) ).toEqual( [] );
	} );

	it( 'returns array from scalar noteId (legacy format)', () => {
		expect( getNoteIdsFromMetadata( { noteId: 42 } ) ).toEqual( [ 42 ] );
	} );

	it( 'coerces a string-typed legacy noteId to a number', () => {
		expect( getNoteIdsFromMetadata( { noteId: '42' } ) ).toEqual( [ 42 ] );
	} );

	it( 'drops non-numeric and non-positive ids', () => {
		expect(
			getNoteIdsFromMetadata( { noteId: [ 1, 'abc', -3, 2 ] } )
		).toEqual( [ 1, 2 ] );
	} );

	it( 'returns array from array noteId', () => {
		expect( getNoteIdsFromMetadata( { noteId: [ 1, 2, 3 ] } ) ).toEqual( [
			1, 2, 3,
		] );
	} );

	it( 'filters out falsy values from array', () => {
		expect(
			getNoteIdsFromMetadata( { noteId: [ 1, null, 2, undefined, 3 ] } )
		).toEqual( [ 1, 2, 3 ] );
	} );

	it( 'filters out zero and empty string from array', () => {
		expect(
			getNoteIdsFromMetadata( { noteId: [ 0, '', 1, false, 2 ] } )
		).toEqual( [ 1, 2 ] );
	} );

	it( 'returns empty array when all array values are falsy', () => {
		expect(
			getNoteIdsFromMetadata( { noteId: [ null, undefined, 0, '' ] } )
		).toEqual( [] );
	} );

	it( 'deduplicates repeated ids while preserving first occurrence order', () => {
		expect( getNoteIdsFromMetadata( { noteId: [ 1, 1, 1 ] } ) ).toEqual( [
			1,
		] );
		expect(
			getNoteIdsFromMetadata( { noteId: [ 1, 2, 1, 3, 2 ] } )
		).toEqual( [ 1, 2, 3 ] );
	} );

	it( 'deduplicates across numeric and string-typed duplicates', () => {
		expect(
			getNoteIdsFromMetadata( { noteId: [ 1, '1', 2, '2' ] } )
		).toEqual( [ 1, 2 ] );
	} );
} );

describe( 'addNoteIdToMetadata', () => {
	it( 'creates array for first note on empty metadata', () => {
		const result = addNoteIdToMetadata( {}, 42 );
		expect( result.noteId ).toEqual( [ 42 ] );
	} );

	it( 'creates array for first note on null metadata', () => {
		const result = addNoteIdToMetadata( null, 42 );
		expect( result.noteId ).toEqual( [ 42 ] );
	} );

	it( 'creates array for first note on undefined metadata', () => {
		const result = addNoteIdToMetadata( undefined, 42 );
		expect( result.noteId ).toEqual( [ 42 ] );
	} );

	it( 'converts scalar noteId to array and appends new id', () => {
		const result = addNoteIdToMetadata( { noteId: 1 }, 2 );
		expect( result.noteId ).toEqual( [ 1, 2 ] );
	} );

	it( 'appends to existing array', () => {
		const result = addNoteIdToMetadata( { noteId: [ 1, 2 ] }, 3 );
		expect( result.noteId ).toEqual( [ 1, 2, 3 ] );
	} );

	it( 'prevents duplicates', () => {
		const result = addNoteIdToMetadata( { noteId: [ 1, 2 ] }, 1 );
		expect( result ).toEqual( { noteId: [ 1, 2 ] } );
	} );

	it( 'preserves other metadata properties', () => {
		const result = addNoteIdToMetadata( { noteId: 1, name: 'test' }, 2 );
		expect( result ).toEqual( { noteId: [ 1, 2 ], name: 'test' } );
	} );

	it( 'returns original metadata object when duplicate is added', () => {
		const metadata = { noteId: [ 1, 2 ] };
		const result = addNoteIdToMetadata( metadata, 1 );
		expect( result ).toBe( metadata );
	} );

	it( 'handles adding to metadata with other properties but no noteId', () => {
		const result = addNoteIdToMetadata( { name: 'test' }, 5 );
		expect( result ).toEqual( { name: 'test', noteId: [ 5 ] } );
	} );

	it( 'dedupes a numeric id against a string-typed legacy id', () => {
		const metadata = { noteId: '5' };
		const result = addNoteIdToMetadata( metadata, 5 );
		expect( result ).toBe( metadata );
	} );

	it( 'dedupes a string id against a numeric id already in the array', () => {
		const result = addNoteIdToMetadata( { noteId: [ 1, 2 ] }, '2' );
		expect( result ).toEqual( { noteId: [ 1, 2 ] } );
	} );
} );

describe( 'removeNoteIdFromMetadata', () => {
	it( 'removes noteId from array', () => {
		const result = removeNoteIdFromMetadata( { noteId: [ 1, 2, 3 ] }, 2 );
		expect( result.noteId ).toEqual( [ 1, 3 ] );
	} );

	it( 'returns undefined noteId when array becomes empty', () => {
		const result = removeNoteIdFromMetadata( { noteId: [ 1 ] }, 1 );
		expect( result.noteId ).toBeUndefined();
	} );

	it( 'handles removing from scalar noteId (legacy format)', () => {
		const result = removeNoteIdFromMetadata( { noteId: 42 }, 42 );
		expect( result.noteId ).toBeUndefined();
	} );

	it( 'handles removing non-existent id', () => {
		const result = removeNoteIdFromMetadata( { noteId: [ 1, 2 ] }, 99 );
		expect( result.noteId ).toEqual( [ 1, 2 ] );
	} );

	it( 'handles empty metadata', () => {
		const result = removeNoteIdFromMetadata( {}, 1 );
		expect( result.noteId ).toBeUndefined();
	} );

	it( 'preserves other metadata properties', () => {
		const result = removeNoteIdFromMetadata(
			{ noteId: [ 1, 2 ], name: 'test' },
			1
		);
		expect( result ).toEqual( { noteId: [ 2 ], name: 'test' } );
	} );

	it( 'handles null metadata', () => {
		const result = removeNoteIdFromMetadata( null, 1 );
		expect( result.noteId ).toBeUndefined();
	} );

	it( 'handles undefined metadata', () => {
		const result = removeNoteIdFromMetadata( undefined, 1 );
		expect( result.noteId ).toBeUndefined();
	} );

	it( 'removes last note and cleans up noteId to undefined', () => {
		const result = removeNoteIdFromMetadata(
			{ noteId: [ 42 ], name: 'test' },
			42
		);
		expect( result ).toEqual( { name: 'test', noteId: undefined } );
	} );

	it( 'removes a numeric id when stored as a string-typed legacy scalar', () => {
		const result = removeNoteIdFromMetadata( { noteId: '42' }, 42 );
		expect( result.noteId ).toBeUndefined();
	} );

	it( 'removes a string id when stored as a number in the array', () => {
		const result = removeNoteIdFromMetadata( { noteId: [ 1, 2, 3 ] }, '2' );
		expect( result.noteId ).toEqual( [ 1, 3 ] );
	} );
} );

describe( 'note id order preservation', () => {
	// The collab sidebar relies on insertion order: the first id in the
	// metadata array is treated as the first (block-aligned) note, with
	// subsequent notes stacking below. These tests pin that contract.
	// See https://github.com/WordPress/gutenberg/issues/75145#issuecomment-4361104794

	it( 'preserves insertion order across multiple sequential adds', () => {
		let metadata = {};
		metadata = addNoteIdToMetadata( metadata, 5 );
		metadata = addNoteIdToMetadata( metadata, 3 );
		metadata = addNoteIdToMetadata( metadata, 7 );
		metadata = addNoteIdToMetadata( metadata, 1 );
		expect( metadata.noteId ).toEqual( [ 5, 3, 7, 1 ] );
	} );

	it( 'does not sort or reorder ids when adding', () => {
		// A naive implementation might sort numerically; this confirms it
		// preserves the order the user added notes in.
		const result = addNoteIdToMetadata( { noteId: [ 10, 2, 30 ] }, 4 );
		expect( result.noteId ).toEqual( [ 10, 2, 30, 4 ] );
	} );

	it( 'keeps the first id first after appending more notes', () => {
		let metadata = addNoteIdToMetadata( {}, 42 );
		metadata = addNoteIdToMetadata( metadata, 99 );
		metadata = addNoteIdToMetadata( metadata, 7 );
		const ids = getNoteIdsFromMetadata( metadata );
		expect( ids[ 0 ] ).toBe( 42 );
	} );

	it( 'preserves order of remaining ids after removing one from the middle', () => {
		const result = removeNoteIdFromMetadata(
			{ noteId: [ 1, 2, 3, 4, 5 ] },
			3
		);
		expect( result.noteId ).toEqual( [ 1, 2, 4, 5 ] );
	} );

	it( 'preserves remaining ids in order after removing the first id', () => {
		const result = removeNoteIdFromMetadata(
			{ noteId: [ 1, 2, 3, 4 ] },
			1
		);
		expect( result.noteId ).toEqual( [ 2, 3, 4 ] );
	} );

	it( 'preserves remaining ids in order after removing the last id', () => {
		const result = removeNoteIdFromMetadata(
			{ noteId: [ 1, 2, 3, 4 ] },
			4
		);
		expect( result.noteId ).toEqual( [ 1, 2, 3 ] );
	} );

	it( 'preserves order across an interleaved sequence of adds and removes', () => {
		let metadata = {};
		metadata = addNoteIdToMetadata( metadata, 10 );
		metadata = addNoteIdToMetadata( metadata, 20 );
		metadata = addNoteIdToMetadata( metadata, 30 );
		metadata = removeNoteIdFromMetadata( metadata, 20 );
		metadata = addNoteIdToMetadata( metadata, 40 );
		expect( metadata.noteId ).toEqual( [ 10, 30, 40 ] );
	} );

	it( 'preserves array order through a getNoteIdsFromMetadata round-trip', () => {
		const ids = [ 9, 4, 7, 2, 11 ];
		expect( getNoteIdsFromMetadata( { noteId: ids } ) ).toEqual( ids );
	} );

	it( 'keeps the legacy scalar id as the first id when migrating to an array', () => {
		// When a legacy single-note post gains a second note, the original
		// note must remain the block-aligned (first) note.
		const result = addNoteIdToMetadata( { noteId: 42 }, 99 );
		expect( result.noteId ).toEqual( [ 42, 99 ] );
		expect( result.noteId[ 0 ] ).toBe( 42 );
	} );
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

describe( 'calculateNotePositions', () => {
	it( 'returns empty positions when the anchor thread has no blockRect', () => {
		const { positions } = calculateNotePositions( {
			threads: [ { id: 1 } ],
			selectedNoteId: undefined,
			blockRects: {},
			heights: {},
			scrollTop: 0,
		} );
		expect( positions ).toEqual( {} );
	} );

	it( 'falls back to the first thread as anchor when none is selected', () => {
		const threads = [ { id: 1 }, { id: 2 }, { id: 3 } ];
		const blockRects = {
			1: makeRect( 100 ),
			2: makeRect( 300 ),
			3: makeRect( 500 ),
		};
		const heights = { 1: 50, 2: 50, 3: 50 };

		const { positions } = calculateNotePositions( {
			threads,
			selectedNoteId: undefined,
			blockRects,
			heights,
			scrollTop: 0,
		} );

		// 1: 100 - 16 = 84
		// 2: 300 - 16 = 284
		// 3: 500 - 16 = 484
		expect( positions ).toEqual( { 1: 84, 2: 284, 3: 484 } );
	} );

	it( 'pushes an overlapping thread above the anchor upward', () => {
		const threads = [ { id: 1 }, { id: 2 } ];
		const blockRects = {
			1: makeRect( 150 ),
			2: makeRect( 180 ),
		};
		const heights = { 1: 60, 2: 50 };

		const { positions } = calculateNotePositions( {
			threads,
			selectedNoteId: 2,
			blockRects,
			heights,
			scrollTop: 0,
		} );

		// 2 (anchor): 180 - 16 = 164
		// 1 (upward):  164 - 60 - 20 = 84
		expect( positions ).toEqual( { 1: 84, 2: 164 } );
	} );

	it( 'cascades downward offsets through consecutive overlapping threads', () => {
		const threads = [ { id: 1 }, { id: 2 }, { id: 3 } ];
		const blockRects = {
			1: makeRect( 100 ),
			2: makeRect( 110 ),
			3: makeRect( 120 ),
		};
		const heights = { 1: 80, 2: 80, 3: 80 };

		const { positions } = calculateNotePositions( {
			threads,
			selectedNoteId: 1,
			blockRects,
			heights,
			scrollTop: 0,
		} );

		// 1 (anchor):    100 - 16 = 84
		// 2 (downward):   84 + 80 + 20 = 184
		// 3 (downward):  184 + 80 + 20 = 284
		expect( positions ).toEqual( { 1: 84, 2: 184, 3: 284 } );
	} );

	it( 'omits threads that have no blockRect', () => {
		const threads = [ { id: 1 }, { id: 2 }, { id: 3 } ];
		const blockRects = {
			1: makeRect( 100 ),
			3: makeRect( 500 ),
		};
		const heights = { 1: 50, 3: 50 };

		const { positions } = calculateNotePositions( {
			threads,
			selectedNoteId: 1,
			blockRects,
			heights,
			scrollTop: 0,
		} );

		// 1: 100 - 16 = 84
		// 3: 500 - 16 = 484
		expect( positions ).toEqual( { 1: 84, 3: 484 } );
	} );

	it( 'allows upward cascade to produce negative positions', () => {
		const threads = [ { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 } ];
		const blockRects = {
			1: makeRect( 150 ),
			2: makeRect( 200 ),
			3: makeRect( 250 ),
			4: makeRect( 300 ),
		};
		const heights = { 1: 90, 2: 90, 3: 90, 4: 230 };

		const { positions } = calculateNotePositions( {
			threads,
			selectedNoteId: 4,
			blockRects,
			heights,
			scrollTop: 0,
		} );

		// 4 (anchor):  300 - 16 = 284
		// 3 (upward):  284 - 90 - 20 = 174
		// 2 (upward):  174 - 90 - 20 = 64
		// 1 (upward):   64 - 90 - 20 = -46
		expect( positions ).toEqual( { 1: -46, 2: 64, 3: 174, 4: 284 } );
	} );

	it( 'adds scrollTop to the final positions', () => {
		const threads = [ { id: 1 }, { id: 2 } ];
		const blockRects = {
			1: makeRect( 100 ),
			2: makeRect( 300 ),
		};
		const heights = { 1: 50, 2: 50 };

		const { positions } = calculateNotePositions( {
			threads,
			selectedNoteId: 1,
			blockRects,
			heights,
			scrollTop: 500,
		} );

		// 1: 100 + 500 - 16 = 584
		// 2: 300 + 500 - 16 = 784
		expect( positions ).toEqual( { 1: 584, 2: 784 } );
	} );

	it( 'stacks two threads that share a block with the first as anchor', () => {
		const threads = [ { id: 1 }, { id: 2 } ];
		const blockRects = {
			1: makeRect( 200 ),
			2: makeRect( 200 ),
		};
		const heights = { 1: 50, 2: 50 };

		const { positions } = calculateNotePositions( {
			threads,
			selectedNoteId: 1,
			blockRects,
			heights,
			scrollTop: 0,
		} );

		// 1 (anchor):    200 - 16 = 184
		// 2 (downward):  (184 + 50) - 200 + 20 = 54 → 200 + 54 = 254
		expect( positions ).toEqual( { 1: 184, 2: 254 } );
	} );

	it( 'stacks two threads that share a block with the second as anchor', () => {
		const threads = [ { id: 1 }, { id: 2 } ];
		const blockRects = {
			1: makeRect( 200 ),
			2: makeRect( 200 ),
		};
		const heights = { 1: 50, 2: 50 };

		const { positions } = calculateNotePositions( {
			threads,
			selectedNoteId: 2,
			blockRects,
			heights,
			scrollTop: 0,
		} );

		// 2 (anchor):  200 - 16 = 184
		// 1 (upward):  184 - 200 - 50 - 20 = -86 → 200 + (-86) = 114
		expect( positions ).toEqual( { 1: 114, 2: 184 } );
	} );

	it( 'stacks three threads sharing a block with middle as anchor', () => {
		const threads = [ { id: 1 }, { id: 2 }, { id: 3 } ];
		const blockRects = {
			1: makeRect( 200 ),
			2: makeRect( 200 ),
			3: makeRect( 200 ),
		};
		const heights = { 1: 50, 2: 50, 3: 50 };

		const { positions } = calculateNotePositions( {
			threads,
			selectedNoteId: 2,
			blockRects,
			heights,
			scrollTop: 0,
		} );

		// 2 (anchor):    200 - 16 = 184
		// 3 (downward):  (184 + 50) - 200 + 20 = 54 → 254
		// 1 (upward):    184 - 200 - 50 - 20 = -86 → 114
		expect( positions ).toEqual( { 1: 114, 2: 184, 3: 254 } );
	} );
} );

describe( 'findNoteRange', () => {
	const FORMAT_NAME = 'core/note';

	const isRegistered = () =>
		!! select( richTextStore ).getFormatType( FORMAT_NAME );

	beforeAll( () => {
		if ( ! isRegistered() ) {
			registerFormatType( FORMAT_NAME, {
				title: 'Note',
				tagName: 'span',
				className: 'wp-note',
				attributes: { 'data-id': 'data-id' },
				edit: () => null,
			} );
		}
	} );

	afterAll( () => {
		if ( isRegistered() ) {
			unregisterFormatType( FORMAT_NAME );
		}
	} );

	it( 'returns null for null/undefined input', () => {
		expect( findNoteRange( null, 7 ) ).toBeNull();
		expect( findNoteRange( undefined, 7 ) ).toBeNull();
	} );

	it( 'returns null when no marker is present', () => {
		const value = RichTextData.fromHTMLString( 'hello world' );
		expect( findNoteRange( value, 7 ) ).toBeNull();
	} );

	it( 'returns range for a marker matching the note id (RichTextData)', () => {
		const value = RichTextData.fromHTMLString(
			'hello <span class="wp-note" data-id="7">marked</span> world'
		);
		expect( findNoteRange( value, 7 ) ).toEqual( {
			start: 6,
			end: 12,
		} );
	} );

	it( 'returns range for a marker matching the note id (string)', () => {
		const html =
			'hello <span class="wp-note" data-id="7">marked</span> world';
		expect( findNoteRange( html, 7 ) ).toEqual( { start: 6, end: 12 } );
	} );

	it( 'returns null when the marker id does not match', () => {
		const value = RichTextData.fromHTMLString(
			'<span class="wp-note" data-id="3">x</span>'
		);
		expect( findNoteRange( value, 7 ) ).toBeNull();
	} );

	it( 'coerces ids to strings so numeric vs string ids match', () => {
		const value = RichTextData.fromHTMLString(
			'<span class="wp-note" data-id="7">x</span>'
		);
		expect( findNoteRange( value, '7' ) ).toEqual( { start: 0, end: 1 } );
	} );

	it( 'returns null when noteId itself is null/undefined', () => {
		const value = RichTextData.fromHTMLString(
			'<span class="wp-note" data-id="7">x</span>'
		);
		expect( findNoteRange( value, null ) ).toBeNull();
		expect( findNoteRange( value, undefined ) ).toBeNull();
	} );
} );

describe( 'findNoteInBlock', () => {
	const FORMAT_NAME = 'core/note';

	const isRegistered = () =>
		!! select( richTextStore ).getFormatType( FORMAT_NAME );

	beforeAll( () => {
		if ( ! isRegistered() ) {
			registerFormatType( FORMAT_NAME, {
				title: 'Note',
				tagName: 'span',
				className: 'wp-note',
				attributes: { 'data-id': 'data-id' },
				edit: () => null,
			} );
		}
	} );

	afterAll( () => {
		if ( isRegistered() ) {
			unregisterFormatType( FORMAT_NAME );
		}
	} );

	it( 'returns null when attributes are null/undefined', () => {
		expect( findNoteInBlock( null, 7 ) ).toBeNull();
		expect( findNoteInBlock( undefined, 7 ) ).toBeNull();
	} );

	it( 'returns null when no attribute carries a matching marker', () => {
		const attributes = {
			content: RichTextData.fromHTMLString( 'hello world' ),
			align: 'left',
		};
		expect( findNoteInBlock( attributes, 7 ) ).toBeNull();
	} );

	it( 'returns the attribute key and range of the matching marker', () => {
		const attributes = {
			content: RichTextData.fromHTMLString(
				'hello <span class="wp-note" data-id="7">marked</span> world'
			),
		};
		expect( findNoteInBlock( attributes, 7 ) ).toEqual( {
			attributeKey: 'content',
			start: 6,
			end: 12,
		} );
	} );

	it( 'discovers the marker in a non-primary rich-text attribute', () => {
		const attributes = {
			content: RichTextData.fromHTMLString( 'no marker here' ),
			caption: RichTextData.fromHTMLString(
				'<span class="wp-note" data-id="9">cap</span>'
			),
		};
		expect( findNoteInBlock( attributes, 9 ) ).toEqual( {
			attributeKey: 'caption',
			start: 0,
			end: 3,
		} );
	} );

	it( 'ignores non-rich-text attribute values without throwing', () => {
		const attributes = {
			level: 2,
			anchor: '',
			content: RichTextData.fromHTMLString(
				'<span class="wp-note" data-id="3">x</span>'
			),
		};
		expect( findNoteInBlock( attributes, 3 ) ).toEqual( {
			attributeKey: 'content',
			start: 0,
			end: 1,
		} );
	} );

	it( 'coerces ids to strings so numeric vs string ids match', () => {
		const attributes = {
			content: RichTextData.fromHTMLString(
				'<span class="wp-note" data-id="7">x</span>'
			),
		};
		expect( findNoteInBlock( attributes, '7' ) ).toEqual( {
			attributeKey: 'content',
			start: 0,
			end: 1,
		} );
	} );
} );

describe( 'applyNoteFormat', () => {
	const FORMAT_NAME = 'core/note';

	const isRegistered = () =>
		!! select( richTextStore ).getFormatType( FORMAT_NAME );

	beforeAll( () => {
		if ( ! isRegistered() ) {
			registerFormatType( FORMAT_NAME, {
				title: 'Note',
				tagName: 'mark',
				className: 'wp-note',
				attributes: { 'data-id': 'data-id' },
				edit: () => null,
			} );
		}
		if ( ! select( richTextStore ).getFormatType( 'core/bold' ) ) {
			registerFormatType( 'core/bold', {
				title: 'Bold',
				tagName: 'strong',
				className: null,
				edit: () => null,
			} );
		}
	} );

	afterAll( () => {
		if ( isRegistered() ) {
			unregisterFormatType( FORMAT_NAME );
		}
		if ( select( richTextStore ).getFormatType( 'core/bold' ) ) {
			unregisterFormatType( 'core/bold' );
		}
	} );

	const note = ( id ) => ( {
		type: FORMAT_NAME,
		attributes: { 'data-id': String( id ) },
	} );

	// Apply a sequence of [ id, start, end ] notes, then round-trip through HTML
	// to a normalised value (matching how wrapInlineNote stores the result).
	const applyAll = ( html, ops ) => {
		let record = create( { html } );
		for ( const [ id, start, end ] of ops ) {
			record = applyNoteFormat( record, note( id ), start, end );
		}
		return RichTextData.fromHTMLString(
			new RichTextData( record ).toHTMLString()
		);
	};

	it( 'adds a single marker over plain text', () => {
		const value = applyAll( 'the quick brown fox', [ [ 7, 4, 9 ] ] );
		expect( value.toHTMLString() ).toBe(
			'the <mark data-id="7" class="wp-note">quick</mark> brown fox'
		);
	} );

	it( 'nests a contained note inside its parent (outer applied first)', () => {
		const value = applyAll( 'the quick brown fox jumps over', [
			[ 2, 0, 29 ],
			[ 1, 16, 22 ],
		] );
		expect( value.toHTMLString() ).toBe(
			'<mark data-id="2" class="wp-note">the quick brown <mark data-id="1" class="wp-note">fox ju</mark>mps ove</mark>r'
		);
	} );

	it( 'nests the same regardless of application order (inner applied first)', () => {
		const value = applyAll( 'the quick brown fox jumps over', [
			[ 1, 16, 22 ],
			[ 2, 0, 29 ],
		] );
		expect( value.toHTMLString() ).toBe(
			'<mark data-id="2" class="wp-note">the quick brown <mark data-id="1" class="wp-note">fox ju</mark>mps ove</mark>r'
		);
	} );

	it( 'keeps both notes when a larger note covers an existing one (no clobber)', () => {
		const value = applyAll( 'the quick brown fox jumps over', [
			[ 1, 16, 22 ],
			[ 2, 0, 29 ],
		] );
		expect( findNoteRange( value, 1 ) ).toEqual( { start: 16, end: 22 } );
		expect( findNoteRange( value, 2 ) ).toEqual( { start: 0, end: 29 } );
	} );

	it( 'preserves both full ranges across a partial (crossing) overlap', () => {
		const value = applyAll( 'the quick brown fox jumps over', [
			[ 1, 0, 18 ],
			[ 2, 10, 30 ],
		] );
		expect( findNoteRange( value, 1 ) ).toEqual( { start: 0, end: 18 } );
		expect( findNoteRange( value, 2 ) ).toEqual( { start: 10, end: 30 } );
	} );

	it( 'keeps disjoint notes separate', () => {
		const value = applyAll( 'the quick brown fox jumps over', [
			[ 1, 0, 9 ],
			[ 2, 16, 25 ],
		] );
		expect( value.toHTMLString() ).toBe(
			'<mark data-id="1" class="wp-note">the quick</mark> brown <mark data-id="2" class="wp-note">fox jumps</mark> over'
		);
	} );

	it( 'preserves the note range when wrapping already-formatted text', () => {
		let record = create( { html: 'the quick brown fox jumps over' } );
		record = applyFormat( record, { type: 'core/bold' }, 4, 9 );
		record = applyNoteFormat( record, note( 1 ), 0, 18 );
		const value = RichTextData.fromHTMLString(
			new RichTextData( record ).toHTMLString()
		);
		expect( findNoteRange( value, 1 ) ).toEqual( { start: 0, end: 18 } );
	} );
} );

describe( 'getInlineMarkerStart', () => {
	// `findNoteInBlock` (which getInlineMarkerStart delegates to) walks rich-text
	// values and needs the `core/note` format registered to recognize the marker
	// elements the tests construct below.
	const FORMAT_NAME = 'core/note';

	const isRegistered = () =>
		!! select( richTextStore ).getFormatType( FORMAT_NAME );

	beforeAll( () => {
		if ( ! isRegistered() ) {
			registerFormatType( FORMAT_NAME, {
				title: 'Note',
				tagName: 'mark',
				className: 'wp-note',
				attributes: { 'data-id': 'data-id' },
				edit: () => null,
			} );
		}
	} );

	afterAll( () => {
		if ( isRegistered() ) {
			unregisterFormatType( FORMAT_NAME );
		}
	} );

	it( 'returns the block-level sentinel when the block carries no marker for the note', () => {
		const attributes = {
			content: RichTextData.fromHTMLString( 'hello world' ),
		};
		const thread = { id: 1 };
		expect( getInlineMarkerStart( thread, attributes ) ).toBe(
			BLOCK_LEVEL_NOTE_START
		);
	} );

	it( 'returns the marker start offset when the block carries a matching marker', () => {
		const attributes = {
			content: RichTextData.fromHTMLString(
				'hello <mark class="wp-note" data-id="7">marked</mark> world'
			),
		};
		expect( getInlineMarkerStart( { id: 7 }, attributes ) ).toBe( 6 );
	} );

	it( 'discovers the marker in a non-primary rich-text attribute', () => {
		const attributes = {
			content: RichTextData.fromHTMLString( 'no marker here' ),
			caption: RichTextData.fromHTMLString(
				'xx <mark class="wp-note" data-id="7">y</mark>'
			),
		};
		expect( getInlineMarkerStart( { id: 7 }, attributes ) ).toBe( 3 );
	} );

	it( 'returns the block-level sentinel when block attributes are empty', () => {
		expect( getInlineMarkerStart( { id: 7 }, {} ) ).toBe(
			BLOCK_LEVEL_NOTE_START
		);
	} );

	it( 'returns the block-level sentinel when block attributes are null', () => {
		expect( getInlineMarkerStart( { id: 7 }, null ) ).toBe(
			BLOCK_LEVEL_NOTE_START
		);
	} );

	it( 'is order-stable when used as a sort key: block-level first, then by start offset, then by id', () => {
		const attributes = {
			content: RichTextData.fromHTMLString(
				'a <mark class="wp-note" data-id="2">x</mark> b <mark class="wp-note" data-id="3">y</mark> c <mark class="wp-note" data-id="1">z</mark>'
			),
		};
		const threads = [
			// Block-level note (no marker) — should sort first.
			{ id: 99 },
			// Inline notes — should sort by marker offset, then id.
			{ id: 1 },
			{ id: 2 },
			{ id: 3 },
		];
		const sorted = [ ...threads ].sort( ( a, b ) => {
			const aStart = getInlineMarkerStart( a, attributes );
			const bStart = getInlineMarkerStart( b, attributes );
			if ( aStart !== bStart ) {
				return aStart - bStart;
			}
			return a.id - b.id;
		} );
		expect( sorted.map( ( t ) => t.id ) ).toEqual( [ 99, 2, 3, 1 ] );
	} );
} );

describe( 'removeNoteFormat', () => {
	// `create`/`findNoteRange` parse marker elements through the registered
	// `core/note` format, so register it for the fixtures below.
	const FORMAT_NAME = 'core/note';

	const isRegistered = () =>
		!! select( richTextStore ).getFormatType( FORMAT_NAME );

	beforeAll( () => {
		if ( ! isRegistered() ) {
			registerFormatType( FORMAT_NAME, {
				title: 'Note',
				tagName: 'mark',
				className: 'wp-note',
				attributes: { 'data-id': 'data-id' },
				edit: () => null,
			} );
		}
	} );

	afterAll( () => {
		if ( isRegistered() ) {
			unregisterFormatType( FORMAT_NAME );
		}
	} );

	it( 'returns null when the value is not rich text', () => {
		expect( removeNoteFormat( 'plain string', 1 ) ).toBeNull();
		expect( removeNoteFormat( undefined, 1 ) ).toBeNull();
	} );

	it( 'returns null when no marker matches the note id', () => {
		const value = RichTextData.fromHTMLString(
			'the <mark class="wp-note" data-id="2">quick</mark> brown fox'
		);
		expect( removeNoteFormat( value, 1 ) ).toBeNull();
	} );

	it( 'removes the marker while leaving the text intact', () => {
		const value = RichTextData.fromHTMLString(
			'the <mark class="wp-note" data-id="7">quick</mark> brown fox'
		);
		expect( removeNoteFormat( value, 7 ).toHTMLString() ).toBe(
			'the quick brown fox'
		);
	} );

	it( 'removes only the targeted note, leaving a co-located note intact', () => {
		// Note 2 wraps the whole string; note 1 nests inside it.
		const value = RichTextData.fromHTMLString(
			'<mark data-id="2" class="wp-note">the quick brown <mark data-id="1" class="wp-note">fox ju</mark>mps ove</mark>r'
		);
		const result = removeNoteFormat( value, 1 );
		expect( findNoteRange( result, 1 ) ).toBeNull();
		expect( findNoteRange( result, 2 ) ).toEqual( { start: 0, end: 29 } );
	} );

	it( 'matches numeric and string note ids', () => {
		const html = 'a <mark class="wp-note" data-id="5">b</mark> c';
		expect(
			removeNoteFormat(
				RichTextData.fromHTMLString( html ),
				5
			).toHTMLString()
		).toBe( 'a b c' );
		expect(
			removeNoteFormat(
				RichTextData.fromHTMLString( html ),
				'5'
			).toHTMLString()
		).toBe( 'a b c' );
	} );
} );
