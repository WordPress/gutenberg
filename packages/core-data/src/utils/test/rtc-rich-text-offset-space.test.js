/**
 * External dependencies
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

/**
 * WordPress dependencies
 */
import { Y } from '@wordpress/sync';

/**
 * Mock block schemas and sync providers.
 */
jest.mock( '@wordpress/blocks', () => {
	const actual = jest.requireActual( '@wordpress/blocks' );

	return {
		...actual,
		getBlockTypes: () => [
			{
				name: 'core/paragraph',
				attributes: {
					content: { type: 'rich-text' },
				},
			},
		],
	};
} );

jest.mock( '../../../../sync/src/providers', () => ( {
	getProviderCreators: jest.fn(),
} ) );

/**
 * Internal dependencies
 */
import { createSyncManager } from '../../../../sync/src/manager';
import { getProviderCreators } from '../../../../sync/src/providers';
import { CRDT_RECORD_MAP_KEY, Delta } from '../../sync';
import { applyPostChangesToCRDTDoc } from '../crdt';
import { mergeCrdtBlocks } from '../crdt-blocks';
import { getRootMap, richTextOffsetToHtmlIndex } from '../crdt-utils';

const mockGetProviderCreators = jest.mocked( getProviderCreators );

const SYNCED_PROPERTIES = new Set( [ 'blocks' ] );
const OLD_HTML = '<em>italic</em><em>italic</em>';
const NEW_HTML = '<em>italic</em>beta';
const TEXT_OFFSET = 10;
const OLD_AMBIGUOUS_HTML = '<em>a</em>';
const NEW_AMBIGUOUS_HTML = '<em>aa</em>';
const AMBIGUOUS_TEXT_OFFSET = 1;
const FUZZ_SEED = 0x5eed1234;
const FUZZ_CASE_COUNT = 500;
const PLACEMENT_FUZZ_CASE_COUNT = 500;
const FUZZ_CHARS = [ 'a', 'a', 'a', 'b', 'b', 'c', 'x', 'y' ];
const FUZZ_WRAPPERS = [
	( text ) => text,
	( text ) => `<em>${ text }</em>`,
	( text ) => `<strong>${ text }</strong>`,
	( text ) => `<strong><em>${ text }</em></strong>`,
	( text ) => `<a href="https://example.com">${ text }</a>`,
];

function makeParagraphBlock( content ) {
	return {
		clientId: 'block-1',
		name: 'core/paragraph',
		attributes: { content },
		innerBlocks: [],
	};
}

function getSelection() {
	return {
		selectionStart: {
			clientId: 'block-1',
			attributeKey: 'content',
			offset: TEXT_OFFSET,
		},
		selectionEnd: {
			clientId: 'block-1',
			attributeKey: 'content',
			offset: TEXT_OFFSET,
		},
	};
}

function getFirstBlockContentYText( yblocks ) {
	const attrs = yblocks.get( 0 ).get( 'attributes' );
	return attrs.get( 'content' );
}

function readFirstBlockContentFromYBlocks( yblocks ) {
	return getFirstBlockContentYText( yblocks ).toString();
}

function readFirstBlockContentFromDoc( ydoc ) {
	const ymap = getRootMap( ydoc, CRDT_RECORD_MAP_KEY );
	const yblocks = ymap.get( 'blocks' );
	return readFirstBlockContentFromYBlocks( yblocks );
}

function waitForNextTick() {
	return new Promise( ( resolve ) => setTimeout( resolve, 0 ) );
}

function createRandom( seed ) {
	const modulus = 2147483647;
	const multiplier = 48271;
	let state = seed % modulus;

	if ( state <= 0 ) {
		state += modulus - 1;
	}

	return () => {
		state = ( state * multiplier ) % modulus;
		return state / modulus;
	};
}

function randomInt( random, min, max ) {
	return min + Math.floor( random() * ( max - min + 1 ) );
}

function randomItem( random, items ) {
	return items[ randomInt( random, 0, items.length - 1 ) ];
}

function randomText( random, minLength, maxLength ) {
	const length = randomInt( random, minLength, maxLength );
	let text = '';

	for ( let i = 0; i < length; i++ ) {
		text += randomItem( random, FUZZ_CHARS );
	}

	return text;
}

function makeRandomRichTextHtml( random, text ) {
	let html = '';
	let offset = 0;

	while ( offset < text.length ) {
		const chunkLength = randomInt(
			random,
			1,
			Math.min( 3, text.length - offset )
		);
		const chunk = text.slice( offset, offset + chunkLength );
		html += randomItem( random, FUZZ_WRAPPERS )( chunk );
		offset += chunkLength;
	}

	return html;
}

function makeCursor( offset ) {
	return {
		attributeKey: 'content',
		clientId: 'block-1',
		offset,
	};
}

function deltaForUpdate( oldHtml, newHtml, cursorPosition ) {
	return new Delta( [ { insert: oldHtml } ] ).diffWithCursor(
		new Delta( [ { insert: newHtml } ] ),
		cursorPosition
	);
}

function applyDeltaToString( oldHtml, delta ) {
	return new Delta( [ { insert: oldHtml } ] )
		.compose( delta )
		.ops.map( ( op ) => ( typeof op.insert === 'string' ? op.insert : '' ) )
		.join( '' );
}

function areEqual( actual, expected ) {
	return JSON.stringify( actual ) === JSON.stringify( expected );
}

function assertEqualWithContext( actual, expected, context ) {
	if ( areEqual( actual, expected ) ) {
		return;
	}

	throw new Error(
		[
			'Unexpected fuzz result.',
			`Expected: ${ JSON.stringify( expected ) }`,
			`Actual: ${ JSON.stringify( actual ) }`,
			`Context: ${ JSON.stringify( context ) }`,
		].join( '\n' )
	);
}

describe( 'RTC rich-text offset-space bug', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockGetProviderCreators.mockReturnValue( [
			jest.fn( async () => ( {
				destroy: jest.fn(),
				on: jest.fn(),
			} ) ),
		] );
	} );

	it( 'preserves formatted paragraph content in mergeCrdtBlocks', () => {
		const doc = new Y.Doc();
		const yblocks = doc.getArray( 'blocks' );

		mergeCrdtBlocks( yblocks, [ makeParagraphBlock( OLD_HTML ) ], null );
		mergeCrdtBlocks(
			yblocks,
			[ makeParagraphBlock( NEW_HTML ) ],
			makeCursor( TEXT_OFFSET )
		);

		expect( readFirstBlockContentFromYBlocks( yblocks ) ).toBe( NEW_HTML );
	} );

	it( 'uses the updated rich-text HTML to place cursor-guided inserts', () => {
		const doc = new Y.Doc();
		const yblocks = doc.getArray( 'blocks' );
		const deltas = [];

		mergeCrdtBlocks(
			yblocks,
			[ makeParagraphBlock( OLD_AMBIGUOUS_HTML ) ],
			null
		);

		const content = getFirstBlockContentYText( yblocks );
		content.observe( ( event ) => {
			deltas.push( event.delta );
		} );

		mergeCrdtBlocks(
			yblocks,
			[ makeParagraphBlock( NEW_AMBIGUOUS_HTML ) ],
			{
				attributeKey: 'content',
				clientId: 'block-1',
				offset: AMBIGUOUS_TEXT_OFFSET,
			}
		);

		expect( content.toString() ).toBe( NEW_AMBIGUOUS_HTML );
		// Converting offset 1 through the old HTML would retain 5 and insert
		// after "a", which produces the same final string but the wrong edit.
		expect( deltas ).toEqual( [ [ { retain: 4 }, { insert: 'a' } ] ] );
	} );

	it( 'fuzzes formatted rich-text updates without content corruption', () => {
		const random = createRandom( FUZZ_SEED );
		let checkedCases = 0;

		for ( let i = 0; i < FUZZ_CASE_COUNT; i++ ) {
			const oldText = randomText( random, 1, 10 );
			const newText = randomText( random, 1, 10 );
			const oldHtml = makeRandomRichTextHtml( random, oldText );
			const newHtml = makeRandomRichTextHtml( random, newText );
			const cursorOffset = randomInt( random, 0, newText.length );
			const doc = new Y.Doc();
			const yblocks = doc.getArray( 'blocks' );

			mergeCrdtBlocks( yblocks, [ makeParagraphBlock( oldHtml ) ], null );
			mergeCrdtBlocks(
				yblocks,
				[ makeParagraphBlock( newHtml ) ],
				makeCursor( cursorOffset )
			);

			assertEqualWithContext(
				readFirstBlockContentFromYBlocks( yblocks ),
				newHtml,
				{
					seed: FUZZ_SEED,
					caseIndex: i,
					oldHtml,
					newHtml,
					cursorOffset,
				}
			);

			checkedCases++;
			doc.destroy();
		}

		expect( checkedCases ).toBe( FUZZ_CASE_COUNT );
	} );

	it( 'fuzzes cursor-guided deltas against updated HTML cursor indices', () => {
		const random = createRandom( FUZZ_SEED + 1 );
		let attempts = 0;
		let checkedCases = 0;
		let differentCursorIndexCases = 0;
		let oldHtmlWouldPlaceDifferentDeltaCases = 0;

		while ( checkedCases < PLACEMENT_FUZZ_CASE_COUNT ) {
			attempts++;
			const oldText = randomText( random, 1, 10 );
			const insertAt = randomInt( random, 0, oldText.length );
			const insertedText =
				oldText[ insertAt ] ??
				oldText[ insertAt - 1 ] ??
				randomItem( random, FUZZ_CHARS );
			const newText =
				oldText.slice( 0, insertAt ) +
				insertedText +
				oldText.slice( insertAt );
			const cursorOffset = insertAt + insertedText.length;
			const oldHtml = makeRandomRichTextHtml( random, oldText );
			const newHtml = makeRandomRichTextHtml( random, newText );
			const expectedCursorPosition = richTextOffsetToHtmlIndex(
				newHtml,
				cursorOffset
			);
			const oldHtmlCursorPosition = richTextOffsetToHtmlIndex(
				oldHtml,
				cursorOffset
			);
			const expectedDelta = deltaForUpdate(
				oldHtml,
				newHtml,
				expectedCursorPosition
			);
			const oldHtmlDelta = deltaForUpdate(
				oldHtml,
				newHtml,
				oldHtmlCursorPosition
			);

			if ( applyDeltaToString( oldHtml, expectedDelta ) !== newHtml ) {
				continue;
			}

			if ( expectedCursorPosition !== oldHtmlCursorPosition ) {
				differentCursorIndexCases++;
			}

			if ( ! areEqual( expectedDelta.ops, oldHtmlDelta.ops ) ) {
				oldHtmlWouldPlaceDifferentDeltaCases++;
			}

			const doc = new Y.Doc();
			const yblocks = doc.getArray( 'blocks' );

			mergeCrdtBlocks( yblocks, [ makeParagraphBlock( oldHtml ) ], null );

			const content = getFirstBlockContentYText( yblocks );
			const deltas = [];
			content.observe( ( event ) => {
				deltas.push( event.delta );
			} );

			mergeCrdtBlocks(
				yblocks,
				[ makeParagraphBlock( newHtml ) ],
				makeCursor( cursorOffset )
			);

			assertEqualWithContext( content.toString(), newHtml, {
				seed: FUZZ_SEED,
				attempts,
				checkedCases,
				oldHtml,
				newHtml,
				cursorOffset,
				expectedCursorPosition,
				oldHtmlCursorPosition,
			} );
			assertEqualWithContext( deltas, [ expectedDelta.ops ], {
				seed: FUZZ_SEED,
				attempts,
				checkedCases,
				oldHtml,
				newHtml,
				cursorOffset,
				expectedCursorPosition,
				oldHtmlCursorPosition,
				expectedDelta: expectedDelta.ops,
				oldHtmlDelta: oldHtmlDelta.ops,
			} );

			checkedCases++;
			doc.destroy();
		}

		expect( checkedCases ).toBe( PLACEMENT_FUZZ_CASE_COUNT );
		expect( attempts ).toBeLessThanOrEqual( PLACEMENT_FUZZ_CASE_COUNT * 2 );
		expect( differentCursorIndexCases ).toBeGreaterThan( 100 );
		expect( oldHtmlWouldPlaceDifferentDeltaCases ).toBeGreaterThan( 25 );
	} );

	it( 'preserves formatted paragraph content in applyPostChangesToCRDTDoc', () => {
		const doc = new Y.Doc();

		applyPostChangesToCRDTDoc(
			doc,
			{ blocks: [ makeParagraphBlock( OLD_HTML ) ] },
			SYNCED_PROPERTIES
		);

		applyPostChangesToCRDTDoc(
			doc,
			{
				blocks: [ makeParagraphBlock( NEW_HTML ) ],
				selection: getSelection(),
			},
			SYNCED_PROPERTIES
		);

		expect( readFirstBlockContentFromDoc( doc ) ).toBe( NEW_HTML );
	} );

	it( 'preserves formatted paragraph content in SyncManager.update', async () => {
		let capturedDoc;
		const manager = createSyncManager();
		const handlers = {
			addUndoMeta: jest.fn(),
			editRecord: jest.fn(),
			getEditedRecord: jest.fn( async () => ( {
				id: 1,
				blocks: [ makeParagraphBlock( OLD_HTML ) ],
			} ) ),
			onStatusChange: jest.fn(),
			persistCRDTDoc: jest.fn(),
			refetchRecord: jest.fn( async () => {} ),
			restoreUndoMeta: jest.fn(),
		};
		const syncConfig = {
			applyChangesToCRDTDoc: ( ydoc, changes ) => {
				capturedDoc = ydoc;
				applyPostChangesToCRDTDoc( ydoc, changes, SYNCED_PROPERTIES );
			},
			createAwareness: jest.fn(),
			getChangesFromCRDTDoc: jest.fn( () => ( {} ) ),
			getPersistedCRDTDoc: jest.fn( () => null ),
		};

		await manager.load(
			syncConfig,
			'postType/post',
			'1',
			{ id: 1, blocks: [ makeParagraphBlock( OLD_HTML ) ] },
			handlers
		);

		manager.update(
			'postType/post',
			'1',
			{
				blocks: [ makeParagraphBlock( NEW_HTML ) ],
				selection: getSelection(),
			},
			'LOCAL_EDITOR_ORIGIN'
		);
		await waitForNextTick();

		expect( readFirstBlockContentFromDoc( capturedDoc ) ).toBe( NEW_HTML );

		manager.unload( 'postType/post', '1' );
	} );
} );
