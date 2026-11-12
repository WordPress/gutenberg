import { describe, expect, it, vi, type Mock } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSelect } from '@wordpress/data';
import { useNoteLock } from '../use-note-lock';

type EditorStore = ( typeof import( '../../../store' ) )[ 'store' ];

// Isolates the hook from the editor store so tests can drive the two sources
// it combines - the server-computed settings snapshot and the live post meta.
vi.mock( import( '@wordpress/data' ), () => ( { useSelect: vi.fn() } ) );

vi.mock( import( '../../../store' ), () => ( {
	store: 'core/editor' as unknown as EditorStore,
} ) );

const ALL_ACTIONS = [ 'create', 'reply', 'edit', 'resolve', 'delete', 'react' ];

function renderWithState( {
	lockedNoteActions,
	meta,
}: {
	lockedNoteActions?: { unlocked?: string[]; locked?: string[] };
	meta?: Record< string, unknown >;
} ) {
	( useSelect as Mock ).mockImplementation(
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

	it( 'locks the actions the snapshot lists for an unlocked post', () => {
		const { lockedActions, isFullyLocked } = renderWithState( {
			lockedNoteActions: { unlocked: [ 'delete' ], locked: ALL_ACTIONS },
		} );

		expect( lockedActions.has( 'delete' ) ).toBe( true );
		expect( lockedActions.has( 'create' ) ).toBe( false );
		expect( isFullyLocked ).toBe( false );
	} );

	it( 'reports a full lock only once every action is locked', () => {
		const { isFullyLocked } = renderWithState( {
			lockedNoteActions: {
				unlocked: [ 'create', 'reply', 'edit', 'resolve', 'delete' ],
			},
		} );

		expect( isFullyLocked ).toBe( false );
	} );

	it( 'follows the snapshot for a locked post once the meta is set', () => {
		const { lockedActions, isFullyLocked } = renderWithState( {
			lockedNoteActions: { unlocked: [], locked: ALL_ACTIONS },
			meta: { _wp_notes_locked: true },
		} );

		expect( isFullyLocked ).toBe( true );
		expect( lockedActions.has( 'create' ) ).toBe( true );
	} );

	it( 'keeps the exceptions a filter carves out of a locked post', () => {
		const { lockedActions, isFullyLocked } = renderWithState( {
			lockedNoteActions: { unlocked: [], locked: [] },
			meta: { _wp_notes_locked: true },
		} );

		expect( lockedActions.size ).toBe( 0 );
		expect( isFullyLocked ).toBe( false );
	} );

	it( 'unlocks once the meta is cleared mid-session', () => {
		const { lockedActions } = renderWithState( {
			lockedNoteActions: { unlocked: [], locked: ALL_ACTIONS },
			meta: { _wp_notes_locked: false },
		} );

		expect( lockedActions.size ).toBe( 0 );
	} );

	it( 'locks everything for a locked post without a snapshot', () => {
		const { isFullyLocked } = renderWithState( {
			meta: { _wp_notes_locked: true },
		} );

		expect( isFullyLocked ).toBe( true );
	} );
} );
