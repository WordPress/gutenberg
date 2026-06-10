/**
 * External dependencies
 */
import { Y } from '@wordpress/sync';
import { dispatch, select, subscribe, resolveSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { PostEditorAwareness } from '../post-editor-awareness';
import { SelectionType } from '../../utils/crdt-user-selections';
import type {
	SelectionNone,
	SelectionCursor,
	SelectionWholeBlock,
} from '../../types';
import { CRDT_RECORD_MAP_KEY } from '../../sync';
import type { CollaboratorInfo } from '../types';

// Mock WordPress dependencies
jest.mock( '@wordpress/data', () => ( {
	dispatch: jest.fn(),
	select: jest.fn(),
	subscribe: jest.fn(),
	resolveSelect: jest.fn(),
	// Needed because @wordpress/rich-text initialises its store at import time.
	combineReducers: jest.fn( () => jest.fn( () => ( {} ) ) ),
	createReduxStore: jest.fn( () => ( {} ) ),
	register: jest.fn(),
	createSelector: ( selector: Function ) => selector,
} ) );

jest.mock( '@wordpress/block-editor', () => ( {
	store: 'core/block-editor',
} ) );

// Mock window.navigator.userAgent
const mockUserAgent = ( userAgent: string ) => {
	Object.defineProperty( window.navigator, 'userAgent', {
		value: userAgent,
		configurable: true,
	} );
};

const mockAvatarUrls = {
	'24': 'https://example.com/avatar-24.png',
	'48': 'https://example.com/avatar-48.png',
	'96': 'https://example.com/avatar-96.png',
};

const createMockUser = () => ( {
	id: 1,
	name: 'Test User',
	slug: 'test-user',
	avatar_urls: mockAvatarUrls,
} );

type MockBlock = {
	clientId: string;
	name?: string;
	innerBlocks: MockBlock[];
};

interface MockBlockEditorOverrides {
	blocks?: MockBlock[];
	getBlocks?: jest.Mock;
	getBlockName?: string;
	getSelectionStart?: jest.Mock;
	getSelectionEnd?: jest.Mock;
}

type SeededRandom = {
	bool: ( probability?: number ) => boolean;
	int: ( maxExclusive: number ) => number;
	intBetween: ( minInclusive: number, maxInclusive: number ) => number;
	pick: < T >( values: readonly T[] ) => T;
};

/* eslint-disable no-bitwise */
function createSeededRandom( seed: number ): SeededRandom {
	let state = seed >>> 0;

	if ( state === 0 ) {
		state = 0x9e3779b9;
	}

	function nextUint32(): number {
		state += 0x6d2b79f5;
		let value = state;
		value = Math.imul( value ^ ( value >>> 15 ), value | 1 );
		value ^= value + Math.imul( value ^ ( value >>> 7 ), value | 61 );
		return ( value ^ ( value >>> 14 ) ) >>> 0;
	}

	function next(): number {
		return nextUint32() / 0x100000000;
	}

	function int( maxExclusive: number ): number {
		if ( maxExclusive <= 0 ) {
			return 0;
		}

		return Math.floor( next() * maxExclusive );
	}

	return {
		bool( probability = 0.5 ) {
			return next() < probability;
		},
		int,
		intBetween( minInclusive, maxInclusive ) {
			return minInclusive + int( maxInclusive - minInclusive + 1 );
		},
		pick< T >( values: readonly T[] ): T {
			if ( values.length === 0 ) {
				throw new Error( 'Cannot pick from an empty array.' );
			}

			return values[ int( values.length ) ];
		},
	};
}
/* eslint-enable no-bitwise */

const NESTED_SELECTION_SEEDS = Array.from(
	{ length: 8 },
	( _value, index ) => 1401 + index
);

/**
 * Mock the block-editor store selectors returned by `select( blockEditorStore )`.
 *
 * Only the fields that vary between tests need to be passed — everything else
 * gets sensible defaults. Pass `blocks` for the common case (static return
 * value) or `getBlocks` when you need `mockImplementation` (e.g. template mode).
 *
 * Returns `{ getBlocks }` so callers can assert on it (e.g. `toHaveBeenCalledWith`).
 *
 * @param overrides - Optional selector overrides.
 */
function mockBlockEditorStore( overrides: MockBlockEditorOverrides = {} ) {
	const defaultBlocks = [
		{
			clientId: 'block-1',
			name: 'core/paragraph',
			innerBlocks: [],
		},
	];

	const getBlocks =
		overrides.getBlocks ??
		jest.fn().mockReturnValue( overrides.blocks ?? defaultBlocks );

	( select as jest.Mock ).mockReturnValue( {
		getSelectionStart:
			overrides.getSelectionStart ?? jest.fn().mockReturnValue( {} ),
		getSelectionEnd:
			overrides.getSelectionEnd ?? jest.fn().mockReturnValue( {} ),
		getSelectedBlocksInitialCaretPosition: jest
			.fn()
			.mockReturnValue( null ),
		getBlockIndex: jest.fn().mockReturnValue( 0 ),
		getBlockRootClientId: jest.fn().mockReturnValue( '' ),
		getBlockName: jest
			.fn()
			.mockReturnValue( overrides.getBlockName ?? 'core/paragraph' ),
		getBlocks,
	} );

	return { getBlocks };
}

/**
 * Helper to create a single Yjs block with optional text content and inner blocks.
 * @param clientId
 * @param name
 * @param options
 * @param options.textContent
 * @param options.innerBlocks
 */
function createYBlock(
	clientId: string,
	name: string,
	{
		textContent,
		innerBlocks = [],
	}: { textContent?: string; innerBlocks?: Y.Map< any >[] } = {}
): Y.Map< any > {
	const block = new Y.Map();
	block.set( 'clientId', clientId );
	block.set( 'name', name );

	const attrs = new Y.Map();
	if ( textContent !== undefined ) {
		attrs.set( 'content', new Y.Text( textContent ) );
	}

	block.set( 'attributes', attrs );
	const inner = new Y.Array();
	if ( innerBlocks.length ) {
		inner.push( innerBlocks );
	}

	block.set( 'innerBlocks', inner );
	return block;
}

/**
 * Helper function to create a Y.Doc with blocks structure for testing
 * @param blocks
 */
function createTestDocWithBlocks( blocks?: Y.Map< any >[] ) {
	const ydoc = new Y.Doc();
	const documentMap = ydoc.getMap( CRDT_RECORD_MAP_KEY );
	const yBlocks = new Y.Array();
	documentMap.set( 'blocks', yBlocks );

	if ( blocks ) {
		yBlocks.push( blocks );
	} else {
		// Default: single block with content
		const block = createYBlock( 'block-1', 'core/paragraph', {
			textContent: 'Hello world',
		} );
		yBlocks.push( [ block ] );
	}

	return ydoc;
}

type NestedTextTarget = {
	label: string;
	text: Y.Text;
};

function createNestedAttributeBlock(
	clientId: string,
	seed: number
): {
	block: Y.Map< any >;
	targets: NestedTextTarget[];
} {
	const block = new Y.Map();
	block.set( 'clientId', clientId );
	block.set( 'name', 'test/nested-rich-text' );

	const attrs = new Y.Map();
	const hero = new Y.Map();
	const headline = new Y.Text( `Headline ${ seed } alpha beta` );
	const caption = new Y.Text( `Caption ${ seed } gamma delta` );
	hero.set( 'headline', headline );
	hero.set( 'caption', caption );

	const cards = new Y.Array();
	const card0 = new Y.Map();
	const card0Title = new Y.Text( `Card ${ seed } title one` );
	const card0Body = new Y.Text( `Card ${ seed } body one two` );
	const card0Meta = new Y.Map();
	const card0Caption = new Y.Text( `Meta ${ seed } caption` );
	card0.set( 'title', card0Title );
	card0.set( 'body', card0Body );
	card0Meta.set( 'caption', card0Caption );
	card0.set( 'meta', card0Meta );

	const card1 = new Y.Map();
	const card1Title = new Y.Text( `Card ${ seed } title two` );
	const card1Body = new Y.Text( `Card ${ seed } body three four` );
	card1.set( 'title', card1Title );
	card1.set( 'body', card1Body );
	cards.push( [ card0, card1 ] );

	attrs.set( 'hero', hero );
	attrs.set( 'cards', cards );
	block.set( 'attributes', attrs );
	block.set( 'innerBlocks', new Y.Array() );

	return {
		block,
		targets: [
			{ label: 'hero.headline', text: headline },
			{ label: 'hero.caption', text: caption },
			{ label: 'cards.0.title', text: card0Title },
			{ label: 'cards.0.body', text: card0Body },
			{ label: 'cards.0.meta.caption', text: card0Caption },
			{ label: 'cards.1.title', text: card1Title },
			{ label: 'cards.1.body', text: card1Body },
		],
	};
}

describe( 'PostEditorAwareness', () => {
	let doc: Y.Doc;
	let subscribeCallback: ( () => void ) | null = null;
	let mockEditEntityRecord: jest.Mock;

	beforeEach( () => {
		jest.useFakeTimers();
		doc = createTestDocWithBlocks();

		mockUserAgent(
			'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
		);

		jest.spyOn( Date, 'now' ).mockReturnValue( 1704067200000 );

		mockBlockEditorStore();

		// Mock subscribe to capture the callback
		( subscribe as jest.Mock ).mockImplementation( ( callback ) => {
			subscribeCallback = callback;
			return jest.fn(); // unsubscribe
		} );

		// Mock dispatch
		mockEditEntityRecord = jest.fn();
		( dispatch as jest.Mock ).mockReturnValue( {
			editEntityRecord: mockEditEntityRecord,
		} );

		// Mock resolveSelect for getCurrentUser
		( resolveSelect as jest.Mock ).mockReturnValue( {
			getCurrentUser: jest.fn().mockResolvedValue( createMockUser() ),
		} );
	} );

	afterEach( () => {
		jest.useRealTimers();
		jest.restoreAllMocks();
		subscribeCallback = null;
		doc.destroy();
	} );

	describe( 'construction', () => {
		test( 'should create instance with Y.Doc and entity info', () => {
			const awareness = new PostEditorAwareness(
				doc,
				'postType',
				'post',
				123
			);
			expect( awareness ).toBeInstanceOf( PostEditorAwareness );
		} );

		test( 'should have correct clientID from doc', () => {
			const awareness = new PostEditorAwareness(
				doc,
				'postType',
				'post',
				123
			);
			expect( awareness.clientID ).toBe( doc.clientID );
		} );
	} );

	describe( 'setUp', () => {
		test( 'should be idempotent', () => {
			const awareness = new PostEditorAwareness(
				doc,
				'postType',
				'post',
				123
			);

			awareness.setUp();
			awareness.setUp();

			// Subscribe should only be called once
			expect( subscribe ).toHaveBeenCalledTimes( 1 );
		} );

		test( 'should subscribe to selection changes', () => {
			const awareness = new PostEditorAwareness(
				doc,
				'postType',
				'post',
				123
			);

			awareness.setUp();

			expect( subscribe ).toHaveBeenCalled();
			expect( subscribeCallback ).not.toBeNull();
		} );
	} );

	describe( 'selection change handling', () => {
		test( 'should not trigger update when selection has not changed', () => {
			const awareness = new PostEditorAwareness(
				doc,
				'postType',
				'post',
				123
			);
			awareness.setUp();

			// Trigger subscribe callback with same selection
			subscribeCallback?.();

			// Should not call editEntityRecord for unchanged selection
			expect( mockEditEntityRecord ).not.toHaveBeenCalled();
		} );

		test( 'should trigger update when selection changes', () => {
			const mockGetSelectionStart = jest
				.fn()
				.mockReturnValueOnce( {} )
				.mockReturnValueOnce( {
					clientId: 'block-1',
					attributeKey: 'content',
					offset: 5,
				} );

			const mockGetSelectionEnd = jest
				.fn()
				.mockReturnValueOnce( {} )
				.mockReturnValueOnce( {
					clientId: 'block-1',
					attributeKey: 'content',
					offset: 5,
				} );

			mockBlockEditorStore( {
				getSelectionStart: mockGetSelectionStart,
				getSelectionEnd: mockGetSelectionEnd,
			} );

			const awareness = new PostEditorAwareness(
				doc,
				'postType',
				'post',
				123
			);
			awareness.setUp();

			// Trigger subscribe callback with new selection
			subscribeCallback?.();

			// Should call editEntityRecord
			expect( mockEditEntityRecord ).toHaveBeenCalledWith(
				'postType',
				'post',
				123,
				expect.objectContaining( {
					selection: expect.any( Object ),
				} ),
				expect.objectContaining( {
					undoIgnore: true,
				} )
			);
		} );

		test( 'should debounce local cursor updates', () => {
			const mockGetSelectionStart = jest
				.fn()
				.mockReturnValueOnce( {} )
				.mockReturnValueOnce( {
					clientId: 'block-1',
					attributeKey: 'content',
					offset: 5,
				} );

			const mockGetSelectionEnd = jest
				.fn()
				.mockReturnValueOnce( {} )
				.mockReturnValueOnce( {
					clientId: 'block-1',
					attributeKey: 'content',
					offset: 5,
				} );

			mockBlockEditorStore( {
				getSelectionStart: mockGetSelectionStart,
				getSelectionEnd: mockGetSelectionEnd,
			} );

			const awareness = new PostEditorAwareness(
				doc,
				'postType',
				'post',
				123
			);
			awareness.setUp();

			// Trigger selection change
			subscribeCallback?.();

			// Advance timers past debounce
			jest.advanceTimersByTime( 10 );

			// Should have processed the debounced update
			expect( mockEditEntityRecord ).toHaveBeenCalled();
		} );
	} );

	describe( 'areEditorStatesEqual', () => {
		test( 'should return true when both states are undefined', () => {
			const awareness = new PostEditorAwareness(
				doc,
				'postType',
				'post',
				123
			);

			// Access the protected method via testing
			// We can test this indirectly through setLocalStateField behavior
			awareness.setUp();

			// Set editorState with a selection
			const selectionState: SelectionNone = {
				type: SelectionType.None,
			};

			awareness.setLocalStateField( 'editorState', {
				selection: selectionState,
			} );

			// Subscribe to track updates
			const callback = jest.fn();
			awareness.onStateChange( callback );

			// Emit change event
			awareness.emit( 'change', [
				{
					added: [],
					updated: [ awareness.clientID ],
					removed: [],
				},
			] );
			callback.mockClear();

			// Set same state again - should not trigger unnecessary updates
			awareness.setLocalStateField( 'editorState', {
				selection: selectionState,
			} );

			// Emit change event again
			awareness.emit( 'change', [
				{
					added: [],
					updated: [ awareness.clientID ],
					removed: [],
				},
			] );

			// Callback should not be called for equal editor states
			expect( callback ).not.toHaveBeenCalled();
		} );

		test( 'should not notify when editorState without selection is unchanged', () => {
			const awareness = new PostEditorAwareness(
				doc,
				'postType',
				'post',
				123
			);
			awareness.setUp();

			awareness.setLocalStateField( 'editorState', {} );

			const callback = jest.fn();
			awareness.onStateChange( callback );

			awareness.emit( 'change', [
				{
					added: [],
					updated: [ awareness.clientID ],
					removed: [],
				},
			] );
			callback.mockClear();

			awareness.setLocalStateField( 'editorState', {} );
			awareness.emit( 'change', [
				{
					added: [],
					updated: [ awareness.clientID ],
					removed: [],
				},
			] );

			expect( callback ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'convertSelectionStateToAbsolute', () => {
		const defaultEditorBlocks = [
			{
				clientId: 'block-1',
				name: 'core/paragraph',
				innerBlocks: [],
			},
		];

		test( 'should return nulls when relative position cannot be resolved', () => {
			const awareness = new PostEditorAwareness(
				doc,
				'postType',
				'post',
				123
			);

			// Create a Y.Doc for creating a relative position, then destroy it
			// This creates a relative position that cannot be resolved in the awareness doc
			const tempDoc = new Y.Doc();
			const tempText = tempDoc.getText( 'temp' );
			tempText.insert( 0, 'Hello' );
			const relativePosition = Y.createRelativePositionFromTypeIndex(
				tempText,
				2
			);
			tempDoc.destroy();

			const selection: SelectionCursor = {
				type: SelectionType.Cursor,
				cursorPosition: {
					relativePosition,
					absoluteOffset: 2,
				},
			};

			const result = awareness.convertSelectionStateToAbsolute(
				selection,
				defaultEditorBlocks
			);

			// Should return nulls when the relative position's type cannot be found
			expect( result.richTextOffset ).toBeNull();
			expect( result.localClientId ).toBeNull();
		} );

		test( 'should return text index and block client ID for valid cursor selection', () => {
			const awareness = new PostEditorAwareness(
				doc,
				'postType',
				'post',
				123
			);

			// Get the Y.Text from the doc
			const documentMap = doc.getMap( CRDT_RECORD_MAP_KEY );
			const blocks = documentMap.get( 'blocks' ) as Y.Array<
				Y.Map< any >
			>;
			const block = blocks.get( 0 );
			const attrs = block.get( 'attributes' ) as Y.Map< Y.Text >;
			const yText = attrs.get( 'content' );

			// Create a relative position
			const relativePosition = Y.createRelativePositionFromTypeIndex(
				yText as Y.Text,
				5
			);

			const selection: SelectionCursor = {
				type: SelectionType.Cursor,
				cursorPosition: {
					relativePosition,
					absoluteOffset: 5,
					attributeKey: 'content',
				},
			};

			const result = awareness.convertSelectionStateToAbsolute(
				selection,
				defaultEditorBlocks
			);

			expect( result.richTextOffset ).toBe( 5 );
			expect( result.localClientId ).toBe( 'block-1' );
			expect( result.attributeKey ).toBe( 'content' );
		} );

		test( 'should resolve WholeBlock selection to block client ID', () => {
			const awareness = new PostEditorAwareness(
				doc,
				'postType',
				'post',
				123
			);

			// Get the blocks array from the doc
			const documentMap = doc.getMap( CRDT_RECORD_MAP_KEY );
			const blocks = documentMap.get( 'blocks' ) as Y.Array<
				Y.Map< any >
			>;

			// Create a block relative position
			const blockPosition = Y.createRelativePositionFromTypeIndex(
				blocks,
				0
			);

			const selection: SelectionWholeBlock = {
				type: SelectionType.WholeBlock,
				blockPosition,
			};

			const result = awareness.convertSelectionStateToAbsolute(
				selection,
				defaultEditorBlocks
			);

			expect( result.richTextOffset ).toBeNull();
			expect( result.localClientId ).toBe( 'block-1' );
			expect( result.attributeKey ).toBeNull();
		} );

		test( 'should return null attributeKey for SelectionType.None', () => {
			const awareness = new PostEditorAwareness(
				doc,
				'postType',
				'post',
				123
			);

			const result = awareness.convertSelectionStateToAbsolute(
				{ type: SelectionType.None },
				[]
			);

			expect( result.attributeKey ).toBeNull();
		} );

		test( 'should pass through nested attributeKey for a cursor selection', () => {
			const awareness = new PostEditorAwareness(
				doc,
				'postType',
				'post',
				123
			);

			const documentMap = doc.getMap( CRDT_RECORD_MAP_KEY );
			const blocks = documentMap.get( 'blocks' ) as Y.Array<
				Y.Map< any >
			>;
			const block = blocks.get( 0 );
			const attrs = block.get( 'attributes' ) as Y.Map< Y.Text >;
			const yText = attrs.get( 'content' );

			const relativePosition = Y.createRelativePositionFromTypeIndex(
				yText as Y.Text,
				3
			);

			const selection: SelectionCursor = {
				type: SelectionType.Cursor,
				cursorPosition: {
					relativePosition,
					absoluteOffset: 3,
					attributeKey: 'body.0.cells.0.content',
				},
			};

			const result = awareness.convertSelectionStateToAbsolute(
				selection,
				defaultEditorBlocks
			);

			expect( result.attributeKey ).toBe( 'body.0.cells.0.content' );
		} );
	} );

	describe( 'getDebugData', () => {
		test( 'should return debug data object', async () => {
			const awareness = new PostEditorAwareness(
				doc,
				'postType',
				'post',
				123
			);
			awareness.setUp();

			// Wait for async setup
			await Promise.resolve();

			// Emit a change to populate seenStates
			awareness.emit( 'change', [
				{
					added: [],
					updated: [ awareness.clientID ],
					removed: [],
				},
			] );

			const debugData = awareness.getDebugData();

			expect( debugData ).toHaveProperty( 'doc' );
			expect( debugData ).toHaveProperty( 'clients' );
			expect( debugData ).toHaveProperty( 'collaboratorMap' );
		} );

		test( 'should include document data', async () => {
			const awareness = new PostEditorAwareness(
				doc,
				'postType',
				'post',
				123
			);
			awareness.setUp();
			await Promise.resolve();

			const debugData = awareness.getDebugData();

			expect( debugData.doc ).toHaveProperty( CRDT_RECORD_MAP_KEY );
		} );

		test( 'should include client items', async () => {
			const awareness = new PostEditorAwareness(
				doc,
				'postType',
				'post',
				123
			);
			awareness.setUp();
			await Promise.resolve();

			const debugData = awareness.getDebugData();

			expect( debugData.clients ).toBeDefined();
			expect( typeof debugData.clients ).toBe( 'object' );
		} );
	} );

	describe( 'equalityFieldChecks', () => {
		test( 'should include collaboratorInfo check from baseEqualityFieldChecks', async () => {
			const awareness = new PostEditorAwareness(
				doc,
				'postType',
				'post',
				123
			);
			awareness.setUp();
			await Promise.resolve();

			// Set collaboratorInfo and verify equality check works
			const collaboratorInfo: CollaboratorInfo = {
				id: 1,
				name: 'Test',
				slug: 'test',
				avatar_urls: mockAvatarUrls,
				browserType: 'Chrome',
				enteredAt: 1704067200000,
			};

			awareness.setLocalStateField(
				'collaboratorInfo',
				collaboratorInfo
			);
			const storedInfo =
				awareness.getLocalStateField( 'collaboratorInfo' );

			expect( storedInfo ).toEqual( collaboratorInfo );
		} );

		test( 'should include editorState check', async () => {
			const awareness = new PostEditorAwareness(
				doc,
				'postType',
				'post',
				123
			);
			awareness.setUp();
			await Promise.resolve();

			const editorState = {
				selection: {
					type: SelectionType.None,
				} as SelectionNone,
			};

			awareness.setLocalStateField( 'editorState', editorState );
			const storedState = awareness.getLocalStateField( 'editorState' );

			expect( storedState ).toEqual( editorState );
		} );
	} );

	describe( 'state subscription', () => {
		test( 'should notify subscribers on editorState change', async () => {
			const awareness = new PostEditorAwareness(
				doc,
				'postType',
				'post',
				123
			);
			const callback = jest.fn();

			awareness.onStateChange( callback );
			awareness.setUp();
			await Promise.resolve();

			// Set initial state to trigger callback
			awareness.setLocalStateField( 'editorState', {
				selection: { type: SelectionType.None },
			} );

			// Emit change event
			awareness.emit( 'change', [
				{
					added: [],
					updated: [ awareness.clientID ],
					removed: [],
				},
			] );

			expect( callback ).toHaveBeenCalled();
		} );
	} );

	describe( 'convertSelectionStateToAbsolute with nested blocks', () => {
		test( 'should resolve cursor in second root block (path [1])', () => {
			const nestedDoc = createTestDocWithBlocks( [
				createYBlock( 'yjs-block-0', 'core/paragraph', {
					textContent: 'First',
				} ),
				createYBlock( 'yjs-block-1', 'core/paragraph', {
					textContent: 'Second',
				} ),
				createYBlock( 'yjs-block-2', 'core/paragraph', {
					textContent: 'Third',
				} ),
			] );

			const editorBlocks = [
				{
					clientId: 'local-0',
					name: 'core/paragraph',
					innerBlocks: [],
				},
				{
					clientId: 'local-1',
					name: 'core/paragraph',
					innerBlocks: [],
				},
				{
					clientId: 'local-2',
					name: 'core/paragraph',
					innerBlocks: [],
				},
			];

			const awareness = new PostEditorAwareness(
				nestedDoc,
				'postType',
				'post',
				123
			);

			// Create a cursor in the third block's text
			const documentMap = nestedDoc.getMap( CRDT_RECORD_MAP_KEY );
			const blocks = documentMap.get( 'blocks' ) as Y.Array<
				Y.Map< any >
			>;
			const block2 = blocks.get( 2 );
			const attrs2 = block2.get( 'attributes' ) as Y.Map< Y.Text >;
			const yText2 = attrs2.get( 'content' ) as Y.Text;

			const relativePosition = Y.createRelativePositionFromTypeIndex(
				yText2,
				2
			);

			const selection: SelectionCursor = {
				type: SelectionType.Cursor,
				cursorPosition: {
					relativePosition,
					absoluteOffset: 2,
				},
			};

			const result = awareness.convertSelectionStateToAbsolute(
				selection,
				editorBlocks
			);

			expect( result.richTextOffset ).toBe( 2 );
			expect( result.localClientId ).toBe( 'local-2' );

			nestedDoc.destroy();
		} );

		test( 'should resolve cursor in a nested inner block (path [0, 1])', () => {
			const innerParagraph0 = createYBlock(
				'yjs-inner-0',
				'core/paragraph',
				{ textContent: 'Inner zero' }
			);
			const innerParagraph1 = createYBlock(
				'yjs-inner-1',
				'core/paragraph',
				{ textContent: 'Inner one' }
			);
			const outerColumn = createYBlock( 'yjs-outer', 'core/column', {
				innerBlocks: [ innerParagraph0, innerParagraph1 ],
			} );

			const nestedDoc = createTestDocWithBlocks( [ outerColumn ] );

			const editorBlocks = [
				{
					clientId: 'local-outer',
					name: 'core/column',
					innerBlocks: [
						{
							clientId: 'local-inner-0',
							name: 'core/paragraph',
							innerBlocks: [],
						},
						{
							clientId: 'local-inner-1',
							name: 'core/paragraph',
							innerBlocks: [],
						},
					],
				},
			];

			const awareness = new PostEditorAwareness(
				nestedDoc,
				'postType',
				'post',
				123
			);

			// Create cursor in the second inner paragraph
			const documentMap = nestedDoc.getMap( CRDT_RECORD_MAP_KEY );
			const blocks = documentMap.get( 'blocks' ) as Y.Array<
				Y.Map< any >
			>;
			const outer = blocks.get( 0 );
			const innerBlocks = outer.get( 'innerBlocks' ) as Y.Array<
				Y.Map< any >
			>;
			const innerBlock1 = innerBlocks.get( 1 );
			const innerAttrs = innerBlock1.get(
				'attributes'
			) as Y.Map< Y.Text >;
			const yText = innerAttrs.get( 'content' ) as Y.Text;

			const relativePosition = Y.createRelativePositionFromTypeIndex(
				yText,
				5
			);

			const selection: SelectionCursor = {
				type: SelectionType.Cursor,
				cursorPosition: {
					relativePosition,
					absoluteOffset: 5,
				},
			};

			const result = awareness.convertSelectionStateToAbsolute(
				selection,
				editorBlocks
			);

			expect( result.richTextOffset ).toBe( 5 );
			expect( result.localClientId ).toBe( 'local-inner-1' );

			nestedDoc.destroy();
		} );

		test( 'should resolve WholeBlock for a nested image block', () => {
			const innerImage = createYBlock( 'yjs-img', 'core/image' );
			const outerColumn = createYBlock( 'yjs-col', 'core/column', {
				innerBlocks: [ innerImage ],
			} );

			const nestedDoc = createTestDocWithBlocks( [ outerColumn ] );

			const editorBlocks = [
				{
					clientId: 'local-col',
					name: 'core/column',
					innerBlocks: [
						{
							clientId: 'local-img',
							name: 'core/image',
							innerBlocks: [],
						},
					],
				},
			];

			const awareness = new PostEditorAwareness(
				nestedDoc,
				'postType',
				'post',
				123
			);

			// Create a WholeBlock relative position for the inner image
			const documentMap = nestedDoc.getMap( CRDT_RECORD_MAP_KEY );
			const blocks = documentMap.get( 'blocks' ) as Y.Array<
				Y.Map< any >
			>;
			const outer = blocks.get( 0 );
			const innerBlocks = outer.get( 'innerBlocks' ) as Y.Array<
				Y.Map< any >
			>;

			const blockPosition = Y.createRelativePositionFromTypeIndex(
				innerBlocks,
				0
			);

			const selection: SelectionWholeBlock = {
				type: SelectionType.WholeBlock,
				blockPosition,
			};

			const result = awareness.convertSelectionStateToAbsolute(
				selection,
				editorBlocks
			);

			expect( result.richTextOffset ).toBeNull();
			expect( result.localClientId ).toBe( 'local-img' );

			nestedDoc.destroy();
		} );

		test( 'should resolve a deeply nested block (path [1, 0, 1])', () => {
			const deepParagraph0 = createYBlock(
				'yjs-deep-0',
				'core/paragraph',
				{ textContent: 'Deep zero' }
			);
			const deepParagraph1 = createYBlock(
				'yjs-deep-1',
				'core/paragraph',
				{ textContent: 'Deep one content' }
			);
			const midColumn = createYBlock( 'yjs-mid', 'core/column', {
				innerBlocks: [ deepParagraph0, deepParagraph1 ],
			} );
			const outerColumns0 = createYBlock( 'yjs-outer-0', 'core/columns' );
			const outerColumns1 = createYBlock( 'yjs-outer-1', 'core/columns', {
				innerBlocks: [ midColumn ],
			} );

			const nestedDoc = createTestDocWithBlocks( [
				outerColumns0,
				outerColumns1,
			] );

			const editorBlocks = [
				{
					clientId: 'local-outer-0',
					name: 'core/columns',
					innerBlocks: [],
				},
				{
					clientId: 'local-outer-1',
					name: 'core/columns',
					innerBlocks: [
						{
							clientId: 'local-mid',
							name: 'core/column',
							innerBlocks: [
								{
									clientId: 'local-deep-0',
									name: 'core/paragraph',
									innerBlocks: [],
								},
								{
									clientId: 'local-deep-1',
									name: 'core/paragraph',
									innerBlocks: [],
								},
							],
						},
					],
				},
			];

			const awareness = new PostEditorAwareness(
				nestedDoc,
				'postType',
				'post',
				123
			);

			// Create cursor in the deeply nested second paragraph
			const documentMap = nestedDoc.getMap( CRDT_RECORD_MAP_KEY );
			const blocks = documentMap.get( 'blocks' ) as Y.Array<
				Y.Map< any >
			>;
			const outer1 = blocks.get( 1 );
			const outer1Inner = outer1.get( 'innerBlocks' ) as Y.Array<
				Y.Map< any >
			>;
			const mid = outer1Inner.get( 0 );
			const midInner = mid.get( 'innerBlocks' ) as Y.Array<
				Y.Map< any >
			>;
			const deep1 = midInner.get( 1 );
			const deep1Attrs = deep1.get( 'attributes' ) as Y.Map< Y.Text >;
			const yText = deep1Attrs.get( 'content' ) as Y.Text;

			const relativePosition = Y.createRelativePositionFromTypeIndex(
				yText,
				7
			);

			const selection: SelectionCursor = {
				type: SelectionType.Cursor,
				cursorPosition: {
					relativePosition,
					absoluteOffset: 7,
				},
			};

			const result = awareness.convertSelectionStateToAbsolute(
				selection,
				editorBlocks
			);

			expect( result.richTextOffset ).toBe( 7 );
			expect( result.localClientId ).toBe( 'local-deep-1' );

			nestedDoc.destroy();
		} );
	} );

	describe( 'convertSelectionStateToAbsolute with nested rich-text attributes', () => {
		const editorBlocks = [
			{
				clientId: 'local-nested-attrs',
				name: 'test/nested-rich-text',
				innerBlocks: [],
			},
		];

		test.each( NESTED_SELECTION_SEEDS )(
			'resolves fuzzed nested rich-text cursor (seed %i)',
			( seed ) => {
				const rng = createSeededRandom( seed );
				const { block, targets } = createNestedAttributeBlock(
					'yjs-nested-attrs',
					seed
				);
				const nestedDoc = createTestDocWithBlocks( [ block ] );

				const target = rng.pick( targets );
				const initialOffset = rng.intBetween(
					1,
					Math.max( 1, target.text.length - 1 )
				);
				const relativePosition = Y.createRelativePositionFromTypeIndex(
					target.text,
					initialOffset
				);
				let expectedOffset = initialOffset;

				if ( rng.bool() ) {
					const prefix = `p${ seed % 97 } `;
					target.text.insert( 0, prefix );
					expectedOffset += prefix.length;
				} else {
					const deleteLength = Math.min(
						initialOffset,
						rng.intBetween( 1, 3 )
					);
					target.text.delete( 0, deleteLength );
					expectedOffset -= deleteLength;
				}

				const awareness = new PostEditorAwareness(
					nestedDoc,
					'postType',
					'post',
					123
				);

				const selection: SelectionCursor = {
					type: SelectionType.Cursor,
					cursorPosition: {
						relativePosition,
						absoluteOffset: initialOffset,
					},
				};

				const result = awareness.convertSelectionStateToAbsolute(
					selection,
					editorBlocks
				);

				expect( result.richTextOffset ).toBe( expectedOffset );
				expect( result.localClientId ).toBe( 'local-nested-attrs' );

				nestedDoc.destroy();
			}
		);
	} );

	describe( 'post content blocks resolution', () => {
		test( 'should resolve cursor with post content blocks', () => {
			const templateDoc = createTestDocWithBlocks( [
				createYBlock( 'yjs-para-0', 'core/paragraph', {
					textContent: 'Post paragraph 1',
				} ),
				createYBlock( 'yjs-para-1', 'core/paragraph', {
					textContent: 'Post paragraph 2',
				} ),
			] );

			// The caller provides post content blocks directly
			// (template detection is handled by usePostContentBlocks).
			const postContentBlocks = [
				{
					clientId: 'local-para-0',
					name: 'core/paragraph',
					innerBlocks: [],
				},
				{
					clientId: 'local-para-1',
					name: 'core/paragraph',
					innerBlocks: [],
				},
			];

			const awareness = new PostEditorAwareness(
				templateDoc,
				'postType',
				'post',
				123
			);

			// Create cursor in the second post content paragraph
			const documentMap = templateDoc.getMap( CRDT_RECORD_MAP_KEY );
			const blocks = documentMap.get( 'blocks' ) as Y.Array<
				Y.Map< any >
			>;
			const block1 = blocks.get( 1 );
			const attrs = block1.get( 'attributes' ) as Y.Map< Y.Text >;
			const yText = attrs.get( 'content' ) as Y.Text;

			const relativePosition = Y.createRelativePositionFromTypeIndex(
				yText,
				4
			);

			const selection: SelectionCursor = {
				type: SelectionType.Cursor,
				cursorPosition: {
					relativePosition,
					absoluteOffset: 4,
				},
			};

			const result = awareness.convertSelectionStateToAbsolute(
				selection,
				postContentBlocks
			);

			expect( result.richTextOffset ).toBe( 4 );
			expect( result.localClientId ).toBe( 'local-para-1' );

			templateDoc.destroy();
		} );

		test( 'should resolve WholeBlock with post content blocks', () => {
			const templateDoc = createTestDocWithBlocks( [
				createYBlock( 'yjs-img', 'core/image' ),
			] );

			const postContentBlocks = [
				{
					clientId: 'local-img',
					name: 'core/image',
					innerBlocks: [],
				},
			];

			const awareness = new PostEditorAwareness(
				templateDoc,
				'postType',
				'post',
				123
			);

			const documentMap = templateDoc.getMap( CRDT_RECORD_MAP_KEY );
			const blocks = documentMap.get( 'blocks' ) as Y.Array<
				Y.Map< any >
			>;

			const blockPosition = Y.createRelativePositionFromTypeIndex(
				blocks,
				0
			);

			const selection: SelectionWholeBlock = {
				type: SelectionType.WholeBlock,
				blockPosition,
			};

			const result = awareness.convertSelectionStateToAbsolute(
				selection,
				postContentBlocks
			);

			expect( result.richTextOffset ).toBeNull();
			expect( result.localClientId ).toBe( 'local-img' );

			templateDoc.destroy();
		} );

		test( 'should resolve with root blocks directly', () => {
			const normalDoc = createTestDocWithBlocks( [
				createYBlock( 'yjs-para', 'core/paragraph', {
					textContent: 'Normal mode',
				} ),
			] );

			const editorBlocks = [
				{
					clientId: 'local-para',
					name: 'core/paragraph',
					innerBlocks: [],
				},
			];

			const awareness = new PostEditorAwareness(
				normalDoc,
				'postType',
				'post',
				123
			);

			const documentMap = normalDoc.getMap( CRDT_RECORD_MAP_KEY );
			const blocks = documentMap.get( 'blocks' ) as Y.Array<
				Y.Map< any >
			>;
			const block = blocks.get( 0 );
			const attrs = block.get( 'attributes' ) as Y.Map< Y.Text >;
			const yText = attrs.get( 'content' ) as Y.Text;

			const relativePosition = Y.createRelativePositionFromTypeIndex(
				yText,
				3
			);

			const selection: SelectionCursor = {
				type: SelectionType.Cursor,
				cursorPosition: {
					relativePosition,
					absoluteOffset: 3,
				},
			};

			const result = awareness.convertSelectionStateToAbsolute(
				selection,
				editorBlocks
			);

			expect( result.richTextOffset ).toBe( 3 );
			expect( result.localClientId ).toBe( 'local-para' );

			normalDoc.destroy();
		} );
	} );
} );
