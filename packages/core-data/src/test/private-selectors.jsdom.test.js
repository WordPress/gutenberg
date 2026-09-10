import { afterEach, describe, expect, it, vi } from 'vitest';
import { getUndoManager } from '../private-selectors';
import { getSyncManager } from '../sync';

vi.mock( '../sync', () => ( {
	getSyncManager: vi.fn(),
} ) );

describe( 'getUndoManager', () => {
	afterEach( () => {
		getSyncManager.mockReset();
	} );

	it( 'returns the sync undo manager when one is available', () => {
		const syncUndoManager = {
			addRecord: vi.fn(),
			hasRedo: vi.fn(),
			hasUndo: vi.fn(),
			redo: vi.fn(),
			undo: vi.fn(),
		};
		const fallbackUndoManager = {
			addRecord: vi.fn(),
			hasRedo: vi.fn(),
			hasUndo: vi.fn(),
			redo: vi.fn(),
			undo: vi.fn(),
		};
		getSyncManager.mockReturnValue( {
			undoManager: syncUndoManager,
		} );

		const state = {
			undoManager: fallbackUndoManager,
			syncUndoManagerState: {
				hasRedo: false,
				hasUndo: false,
			},
		};

		expect( getUndoManager( state ) ).toBe( syncUndoManager );
	} );

	it( 'returns the default undo manager when there is no sync undo manager', () => {
		const fallbackUndoManager = {
			addRecord: vi.fn(),
			hasRedo: vi.fn(),
			hasUndo: vi.fn(),
			redo: vi.fn(),
			undo: vi.fn(),
		};
		getSyncManager.mockReturnValue( undefined );

		expect(
			getUndoManager( {
				undoManager: fallbackUndoManager,
				syncUndoManagerState: {
					hasRedo: false,
					hasUndo: false,
				},
			} )
		).toBe( fallbackUndoManager );
	} );
} );
