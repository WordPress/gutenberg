import { createElement } from '@wordpress/element';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import NotesSidebar from '../index';

const state = vi.hoisted( () => ( {
	notes: [],
	noteId: [ 1, 2 ],
	selectNote: vi.fn(),
} ) );

vi.mock( '../../../lock-unlock', () => ( { unlock: ( value ) => value } ) );
vi.mock( '@wordpress/block-editor', () => ( {
	store: 'block-editor',
	privateApis: {
		NoteIconToolbarSlotFill: { Fill: ( { children } ) => children },
	},
} ) );
vi.mock( '../../../store', () => ( { store: 'editor' } ) );
vi.mock( '@wordpress/interface', () => ( { store: 'interface' } ) );
vi.mock( '@wordpress/preferences', () => ( { store: 'preferences' } ) );
vi.mock( '@wordpress/keyboard-shortcuts', () => ( { useShortcut: () => {} } ) );
vi.mock( '@wordpress/data', async ( importOriginal ) => {
	const actual = await importOriginal();
	const selectors = {
		getSelectedBlockClientId: () => 'block-a',
		getBlockAttributes: () => ( { metadata: { noteId: state.noteId } } ),
		getBlockName: () => 'core/paragraph',
		get: () => false,
		getSelectedNote: () => undefined,
		getCurrentPostId: () => 1,
		getEditorMode: () => 'visual',
		isRevisionsMode: () => false,
		getActiveComplementaryArea: () => 'edit-post/collab-sidebar',
		getSettings: () => ( {
			__experimentalDiscussionSettings: { avatarURL: 'default-avatar' },
		} ),
	};
	return {
		...actual,
		useSelect: ( callback ) =>
			typeof callback === 'function'
				? callback( () => selectors )
				: selectors,
		useDispatch: () => ( {
			enableComplementaryArea: vi.fn(),
			toggleBlockSpotlight: vi.fn(),
			selectBlock: vi.fn(),
			selectNote: state.selectNote,
		} ),
	};
} );
vi.mock( '../hooks', () => ( {
	useEnableFloatingSidebar: () => {},
	useNoteThreads: () => ( {
		notes: state.notes,
		unresolvedNotes: state.notes.filter(
			( note ) => note.status === 'hold'
		),
	} ),
} ) );
vi.mock( '../../global-styles', () => ( { useGlobalStyles: () => ( {} ) } ) );
vi.mock( '../../post-type-support-check', () => ( {
	default: ( { children } ) => children,
} ) );
vi.mock( '../../plugin-sidebar', () => ( { default: () => null } ) );
vi.mock( '../notes', () => ( { Notes: () => null } ) );
vi.mock( '../add-note-menu-item', () => ( { AddNoteMenuItem: () => null } ) );
vi.mock( '../note-highlight-styles', () => ( {
	NoteHighlightStyles: () => null,
} ) );

const makeNote = ( id, author, overrides = {} ) => ( {
	id,
	author,
	author_name: `User ${ author }`,
	date: `2026-01-0${ id }T00:00:00`,
	status: 'hold',
	blockClientId: 'block-a',
	reply: [],
	...overrides,
} );

const avatars = () =>
	within( screen.getByRole( 'button', { name: 'View notes' } ) ).getAllByRole(
		'img'
	);

describe( 'block toolbar note participants', () => {
	beforeEach( () => {
		state.noteId = [ 1, 2 ];
		state.notes = [ makeNote( 1, 1 ), makeNote( 2, 2 ) ];
		state.selectNote.mockClear();
	} );
	it( 'shows participants from every selected-block thread and excludes other blocks', () => {
		state.notes.push( makeNote( 3, 3, { blockClientId: 'block-b' } ) );
		render( createElement( NotesSidebar ) );
		expect( avatars().map( ( avatar ) => avatar.alt ) ).toEqual( [
			'User 1',
			'User 2',
		] );
		expect( avatars()[ 0 ] ).toHaveAttribute( 'src', 'default-avatar' );
	} );

	it( 'updates participants when a thread is resolved, reopened, and deleted', () => {
		const { rerender } = render( createElement( NotesSidebar ) );
		state.notes = [
			state.notes[ 0 ],
			{ ...state.notes[ 1 ], status: 'approved' },
		];
		rerender( createElement( NotesSidebar ) );
		expect( avatars().map( ( avatar ) => avatar.alt ) ).toEqual( [
			'User 1',
		] );
		state.notes = [
			state.notes[ 0 ],
			{ ...state.notes[ 1 ], status: 'hold' },
		];
		rerender( createElement( NotesSidebar ) );
		expect( avatars() ).toHaveLength( 2 );
		state.noteId = [ 1 ];
		state.notes = [ state.notes[ 0 ] ];
		rerender( createElement( NotesSidebar ) );
		expect( avatars() ).toHaveLength( 1 );
	} );

	it( 'shows two avatars and the remaining count for four distinct participants', () => {
		state.notes[ 1 ].reply = [
			makeNote( 3, 3 ),
			makeNote( 4, 4 ),
			makeNote( 5, 1 ),
		];
		render( createElement( NotesSidebar ) );
		expect( avatars() ).toHaveLength( 2 );
		expect( screen.getByText( '+2' ) ).toBeVisible();
	} );

	it( 'opens the primary thread when View notes is activated', async () => {
		render( createElement( NotesSidebar ) );
		fireEvent.click( screen.getByRole( 'button', { name: 'View notes' } ) );
		await vi.waitFor( () =>
			expect( state.selectNote ).toHaveBeenCalledWith( 1, {
				focus: true,
			} )
		);
	} );

	it( 'keeps resolved threads visible and hides the indicator when no threads remain', () => {
		state.notes = state.notes.map( ( note ) => ( {
			...note,
			status: 'approved',
		} ) );
		const { rerender } = render( createElement( NotesSidebar ) );
		expect( avatars() ).toHaveLength( 2 );
		state.notes = [];
		rerender( createElement( NotesSidebar ) );
		expect(
			screen.queryByRole( 'button', { name: 'View notes' } )
		).not.toBeInTheDocument();
	} );
} );
