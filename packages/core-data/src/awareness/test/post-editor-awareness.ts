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
import type { SelectionNone, SelectionCursor } from '../../types';
import { CRDT_RECORD_MAP_KEY } from '../../sync';
import type { CollaboratorInfo } from '../types';

// Mock WordPress dependencies
jest.mock( '@wordpress/data', () => ( {
	dispatch: jest.fn(),
	select: jest.fn(),
	subscribe: jest.fn(),
	resolveSelect: jest.fn(),
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

/**
 * Helper function to create a Y.Doc with blocks structure for testing
 */
function createTestDocWithBlocks() {
	const ydoc = new Y.Doc();
	const documentMap = ydoc.getMap( CRDT_RECORD_MAP_KEY );
	const blocks = new Y.Array();
	documentMap.set( 'blocks', blocks );

	// Create a block with content
	const block = new Y.Map();
	block.set( 'clientId', 'block-1' );
	const attrs = new Y.Map();
	attrs.set( 'content', new Y.Text( 'Hello world' ) );
	block.set( 'attributes', attrs );
	block.set( 'innerBlocks', new Y.Array() );
	blocks.push( [ block ] );

	return ydoc;
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

		// Mock select to return block editor selectors
		( select as jest.Mock ).mockReturnValue( {
			getSelectionStart: jest.fn().mockReturnValue( {} ),
			getSelectionEnd: jest.fn().mockReturnValue( {} ),
			getSelectedBlocksInitialCaretPosition: jest
				.fn()
				.mockReturnValue( null ),
		} );

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

			( select as jest.Mock ).mockReturnValue( {
				getSelectionStart: mockGetSelectionStart,
				getSelectionEnd: mockGetSelectionEnd,
				getSelectedBlocksInitialCaretPosition: jest
					.fn()
					.mockReturnValue( null ),
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

			( select as jest.Mock ).mockReturnValue( {
				getSelectionStart: mockGetSelectionStart,
				getSelectionEnd: mockGetSelectionEnd,
				getSelectedBlocksInitialCaretPosition: jest
					.fn()
					.mockReturnValue( null ),
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
	} );

	describe( 'getAbsolutePositionIndex', () => {
		test( 'should return null when relative position cannot be resolved', () => {
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
				blockId: 'block-1',
				cursorPosition: {
					relativePosition,
					absoluteOffset: 2,
				},
			};

			const result = awareness.getAbsolutePositionIndex( selection );

			// Should return null when the relative position's type cannot be found
			expect( result ).toBeNull();
		} );

		test( 'should return absolute position index for valid selection', () => {
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
				blockId: 'block-1',
				cursorPosition: {
					relativePosition,
					absoluteOffset: 5,
				},
			};

			const result = awareness.getAbsolutePositionIndex( selection );

			expect( result ).toBe( 5 );
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
} );
