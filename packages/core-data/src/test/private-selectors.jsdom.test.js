import { getUndoManager, getTemplateId } from '../private-selectors';
import { getSyncManager } from '../sync';
import { lock } from '../lock-unlock';

jest.mock( '../sync', () => ( {
	getSyncManager: jest.fn(),
} ) );

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

describe( 'getTemplateId', () => {
	// Stands in for the core store. `getHomePage` and `getPostsPageId` are read
	// through unlock(), so they are locked onto the same object.
	const setup = ( { savedSlug, editedSlug } ) => {
		const getDefaultTemplateId = jest.fn();
		const storeSelectors = {
			getEditedEntityRecord: () => ( {
				slug: editedSlug,
				template: '',
			} ),
			// A record that has never been saved has no raw entry at all.
			getRawEntityRecord: () =>
				savedSlug === undefined ? undefined : { slug: savedSlug },
			getEntityRecords: () => [],
			getDefaultTemplateId,
		};
		lock( storeSelectors, {
			getHomePage: () => ( { postType: 'wp_template', postId: 'home' } ),
			getPostsPageId: () => null,
		} );
		getTemplateId.registry = { select: () => storeSelectors };
		return getDefaultTemplateId;
	};

	it( 'ignores an unsaved slug edit, so typing does not trigger a lookup', () => {
		const getDefaultTemplateId = setup( {
			savedSlug: 'hello',
			editedSlug: 'hell',
		} );

		getTemplateId( {}, 'page', 1 );

		expect( getDefaultTemplateId ).toHaveBeenCalledWith( {
			slug: 'page-hello',
		} );
	} );

	it( 'falls back to the post type template when nothing is saved yet', () => {
		const getDefaultTemplateId = setup( {
			savedSlug: undefined,
			editedSlug: 'draft-in-progress',
		} );

		getTemplateId( {}, 'page', 1 );

		expect( getDefaultTemplateId ).toHaveBeenCalledWith( { slug: 'page' } );
	} );
} );
