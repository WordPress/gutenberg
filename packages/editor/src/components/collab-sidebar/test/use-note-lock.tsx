import { renderHook } from '@testing-library/react';
import { useSelect } from '@wordpress/data';
import { useNoteLock } from '../use-note-lock';

// Isolates the hook from the editor store so tests can drive the two sources
// it combines - the server-computed settings snapshot and the live post meta.
jest.mock( '@wordpress/data', () => ( { useSelect: jest.fn() } ) );

jest.mock( '../../../store', () => ( { store: 'core/editor' } ) );

function renderWithState( {
	lockedNoteActions,
	meta,
}: {
	lockedNoteActions?: string[];
	meta?: Record< string, unknown >;
} ) {
	( useSelect as jest.Mock ).mockImplementation(
		( mapSelect: ( select: unknown ) => unknown ) =>
			mapSelect( () => ( {
				getEditorSettings: () => ( { lockedNoteActions } ),
				getCurrentPostAttribute: ( attribute: string ) =>
					attribute === 'meta' ? meta : undefined,
			} ) )
	);

	return renderHook( () => useNoteLock() ).result.current;
}

describe( 'useNoteLock', () => {
	it( 'locks nothing when the editor settings carry no locked actions', () => {
		const { lockedActions, isFullyLocked } = renderWithState( {} );

		expect( lockedActions.size ).toBe( 0 );
		expect( isFullyLocked ).toBe( false );
	} );

	it( 'locks the actions the editor settings list', () => {
		const { lockedActions, isFullyLocked } = renderWithState( {
			lockedNoteActions: [ 'delete' ],
		} );

		expect( lockedActions.has( 'delete' ) ).toBe( true );
		expect( lockedActions.has( 'create' ) ).toBe( false );
		expect( isFullyLocked ).toBe( false );
	} );

	it( 'reports a full lock only once every action is locked', () => {
		const { isFullyLocked } = renderWithState( {
			lockedNoteActions: [ 'create', 'reply', 'edit', 'resolve' ],
		} );

		expect( isFullyLocked ).toBe( false );
	} );

	it( 'locks everything when the post meta is set, whatever the snapshot says', () => {
		const { lockedActions, isFullyLocked } = renderWithState( {
			lockedNoteActions: [],
			meta: { _wp_notes_locked: true },
		} );

		expect( isFullyLocked ).toBe( true );
		expect( lockedActions.has( 'create' ) ).toBe( true );
		expect( lockedActions.has( 'delete' ) ).toBe( true );
	} );

	it( 'ignores an unset post meta', () => {
		const { isFullyLocked } = renderWithState( {
			meta: { _wp_notes_locked: false },
		} );

		expect( isFullyLocked ).toBe( false );
	} );
} );
