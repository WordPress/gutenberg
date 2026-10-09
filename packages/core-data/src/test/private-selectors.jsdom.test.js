import { describe, expect, it, vi } from 'vitest';
import { getUndoManager } from '../private-selectors';

describe( 'getUndoManager', () => {
	it( 'returns the undo manager held in state', () => {
		const undoManager = {
			addRecord: vi.fn(),
			hasRedo: vi.fn(),
			hasUndo: vi.fn(),
			redo: vi.fn(),
			undo: vi.fn(),
		};

		expect( getUndoManager( { undoManager } ) ).toBe( undoManager );
	} );
} );
