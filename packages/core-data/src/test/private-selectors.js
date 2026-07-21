/**
 * Internal dependencies
 */
import {
	getUndoManager,
	hasSyncProviders as selectHasSyncProviders,
} from '../private-selectors';
import { getSyncManager, hasSyncProviders } from '../sync';

jest.mock( '../sync', () => ( {
	getSyncManager: jest.fn(),
	hasSyncProviders: jest.fn(),
} ) );

describe( 'hasSyncProviders', () => {
	it.each( [ true, false ] )(
		'returns provider availability when it is %s',
		( isAvailable ) => {
			hasSyncProviders.mockReturnValue( isAvailable );

			expect( selectHasSyncProviders() ).toBe( isAvailable );
		}
	);
} );

describe( 'getUndoManager', () => {
	afterEach( () => {
		getSyncManager.mockReset();
	} );

	it( 'returns the sync undo manager when one is available', () => {
		const syncUndoManager = {
			addRecord: jest.fn(),
			hasRedo: jest.fn(),
			hasUndo: jest.fn(),
			redo: jest.fn(),
			undo: jest.fn(),
		};
		const fallbackUndoManager = {
			addRecord: jest.fn(),
			hasRedo: jest.fn(),
			hasUndo: jest.fn(),
			redo: jest.fn(),
			undo: jest.fn(),
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
			addRecord: jest.fn(),
			hasRedo: jest.fn(),
			hasUndo: jest.fn(),
			redo: jest.fn(),
			undo: jest.fn(),
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
