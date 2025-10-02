/**
 * External dependencies
 */
import { describe, expect, it, jest, beforeEach } from '@jest/globals';

// Mock Yjs
const mockYDoc = {
	clientID: 12345,
	meta: new Map(),
	getMap: jest.fn(),
	transact: jest.fn( ( fn: () => void ) => fn() ),
	destroy: jest.fn(),
};

jest.mock( 'yjs', () => ( {
	Doc: jest.fn().mockImplementation( () => mockYDoc ),
} ) );

/**
 * Internal dependencies
 */
import { UndoManager } from '../undo-manager';

// Mock the y-utilities module - create shared instance that all tests use
const mockYMultiDocUndoManager = {
	addToScope: jest.fn(),
	undo: jest.fn(),
	redo: jest.fn(),
	canUndo: jest.fn(),
	canRedo: jest.fn(),
};

jest.mock( '../y-utilities/y-multidoc-undomanager', () => {
	return {
		YMultiDocUndoManager: jest
			.fn()
			.mockImplementation( () => mockYMultiDocUndoManager ),
	};
} );

describe( 'UndoManager', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	describe( 'create', () => {
		it( 'creates a singleton instance and initializes with correct properties', () => {
			const { YMultiDocUndoManager } = jest.requireMock(
				'../y-utilities/y-multidoc-undomanager'
			) as {
				YMultiDocUndoManager: jest.Mock;
			};

			const instance1 = UndoManager.create();
			const instance2 = UndoManager.create();

			expect( instance1 ).toBe( instance2 );
			expect( instance1 ).toBeInstanceOf( UndoManager );

			// Verify YMultiDocUndoManager was called once (not twice due to singleton)
			expect( YMultiDocUndoManager ).toHaveBeenCalledTimes( 1 );

			// Verify initialization properties
			const callArgs = YMultiDocUndoManager.mock.calls[ 0 ];
			const options = callArgs[ 1 ] as {
				captureTimeout: number;
				trackedOrigins: Set< string >;
			};

			expect( callArgs[ 0 ] ).toEqual( [] );
			expect( options.captureTimeout ).toBe( 200 );
			expect( options.trackedOrigins ).toBeInstanceOf( Set );
			expect( options.trackedOrigins.size ).toBe( 1 );
			expect( options.trackedOrigins.has( 'gutenberg' ) ).toBe( true );
		} );
	} );

	describe( 'addRecord', () => {
		it( 'is a no-op as Yjs automatically tracks changes', () => {
			const undoManager = UndoManager.create();

			// Should not throw
			expect( () => {
				undoManager.addRecord();
			} ).not.toThrow();

			expect( () => {
				undoManager.addRecord( undefined, false );
			} ).not.toThrow();

			expect( () => {
				undoManager.addRecord( undefined, true );
			} ).not.toThrow();
		} );
	} );

	describe( 'addToScope', () => {
		it( 'adds a Yjs map to the undo manager scope', () => {
			const undoManager = UndoManager.create();
			const mockYMap = { test: 'map' };

			undoManager.addToScope( mockYMap as any );

			expect( mockYMultiDocUndoManager.addToScope ).toHaveBeenCalledWith(
				mockYMap
			);
		} );

		it( 'can add multiple maps to scope', () => {
			const undoManager = UndoManager.create();
			const mockYMap1 = { test: 'map1' };
			const mockYMap2 = { test: 'map2' };

			undoManager.addToScope( mockYMap1 as any );
			undoManager.addToScope( mockYMap2 as any );

			expect( mockYMultiDocUndoManager.addToScope ).toHaveBeenCalledTimes(
				2
			);
			expect( mockYMultiDocUndoManager.addToScope ).toHaveBeenCalledWith(
				mockYMap1
			);
			expect( mockYMultiDocUndoManager.addToScope ).toHaveBeenCalledWith(
				mockYMap2
			);
		} );
	} );

	describe( 'undo', () => {
		it( 'returns undefined when there is nothing to undo', () => {
			const undoManager = UndoManager.create();
			mockYMultiDocUndoManager.canUndo.mockReturnValue( false );

			const result = undoManager.undo();

			expect( result ).toBeUndefined();
			expect( mockYMultiDocUndoManager.undo ).not.toHaveBeenCalled();
		} );

		it( 'performs undo and returns empty array when undo is available', () => {
			const undoManager = UndoManager.create();
			mockYMultiDocUndoManager.canUndo.mockReturnValue( true );

			const result = undoManager.undo();

			expect( mockYMultiDocUndoManager.undo ).toHaveBeenCalled();
			expect( result ).toEqual( [] );
		} );
	} );

	describe( 'redo', () => {
		it( 'returns undefined when there is nothing to redo', () => {
			const undoManager = UndoManager.create();
			mockYMultiDocUndoManager.canRedo.mockReturnValue( false );

			const result = undoManager.redo();

			expect( result ).toBeUndefined();
			expect( mockYMultiDocUndoManager.redo ).not.toHaveBeenCalled();
		} );

		it( 'performs redo and returns empty array when redo is available', () => {
			const undoManager = UndoManager.create();
			mockYMultiDocUndoManager.canRedo.mockReturnValue( true );

			const result = undoManager.redo();

			expect( mockYMultiDocUndoManager.redo ).toHaveBeenCalled();
			expect( result ).toEqual( [] );
		} );
	} );

	describe( 'hasUndo', () => {
		it( 'returns false when no undo is available', () => {
			const undoManager = UndoManager.create();
			mockYMultiDocUndoManager.canUndo.mockReturnValue( false );

			expect( undoManager.hasUndo() ).toBe( false );
		} );

		it( 'returns true when undo is available', () => {
			const undoManager = UndoManager.create();
			mockYMultiDocUndoManager.canUndo.mockReturnValue( true );

			expect( undoManager.hasUndo() ).toBe( true );
		} );
	} );

	describe( 'hasRedo', () => {
		it( 'returns false when no redo is available', () => {
			const undoManager = UndoManager.create();
			mockYMultiDocUndoManager.canRedo.mockReturnValue( false );

			expect( undoManager.hasRedo() ).toBe( false );
		} );

		it( 'returns true when redo is available', () => {
			const undoManager = UndoManager.create();
			mockYMultiDocUndoManager.canRedo.mockReturnValue( true );

			expect( undoManager.hasRedo() ).toBe( true );
		} );
	} );

	describe( 'integration workflow', () => {
		it( 'follows typical undo/redo workflow', () => {
			const undoManager = UndoManager.create();

			// Initially, no undo/redo available
			mockYMultiDocUndoManager.canUndo.mockReturnValue( false );
			mockYMultiDocUndoManager.canRedo.mockReturnValue( false );

			expect( undoManager.hasUndo() ).toBe( false );
			expect( undoManager.hasRedo() ).toBe( false );

			// After some changes, undo becomes available
			mockYMultiDocUndoManager.canUndo.mockReturnValue( true );
			expect( undoManager.hasUndo() ).toBe( true );

			// After undo, redo becomes available
			undoManager.undo();
			mockYMultiDocUndoManager.canUndo.mockReturnValue( false );
			mockYMultiDocUndoManager.canRedo.mockReturnValue( true );

			expect( undoManager.hasUndo() ).toBe( false );
			expect( undoManager.hasRedo() ).toBe( true );

			// After redo, undo becomes available again
			undoManager.redo();
			mockYMultiDocUndoManager.canUndo.mockReturnValue( true );
			mockYMultiDocUndoManager.canRedo.mockReturnValue( false );

			expect( undoManager.hasUndo() ).toBe( true );
			expect( undoManager.hasRedo() ).toBe( false );
		} );

		it( 'handles multiple scopes', () => {
			const undoManager = UndoManager.create();
			const mockYMap1 = { test: 'map1' };
			const mockYMap2 = { test: 'map2' };

			undoManager.addToScope( mockYMap1 as any );
			undoManager.addToScope( mockYMap2 as any );

			mockYMultiDocUndoManager.canUndo.mockReturnValue( true );

			// Undo should work across both scopes
			undoManager.undo();

			expect( mockYMultiDocUndoManager.undo ).toHaveBeenCalled();
		} );
	} );
} );
