import '@testing-library/jest-dom';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NoteThread } from '../note-thread';

const mockSelectNote = jest.fn();
const mockSelectBlock = jest.fn();
const mockToggleBlockHighlight = jest.fn();
const mockToggleBlockSpotlight = jest.fn();

jest.mock( '@wordpress/block-editor', () => ( {
	store: 'block-editor-store',
	privateApis: {
		useBlockElement: () => null,
	},
} ) );

jest.mock( '@wordpress/components', () => {
	const { forwardRef } = jest.requireActual( '@wordpress/element' );
	return {
		Button: forwardRef(
			(
				{ accessibleWhenDisabled, children, disabled, label, ...props },
				ref
			) => (
				<button
					ref={ ref }
					type="button"
					aria-label={ label }
					disabled={ disabled && ! accessibleWhenDisabled }
					aria-disabled={ disabled || undefined }
					{ ...props }
				>
					{ children }
				</button>
			)
		),
		__experimentalConfirmDialog: () => null,
	};
} );

jest.mock( '@wordpress/data', () => ( {
	useDispatch: ( store ) =>
		store === 'editor-store'
			? { selectNote: mockSelectNote }
			: {
					selectBlock: mockSelectBlock,
					toggleBlockHighlight: mockToggleBlockHighlight,
					toggleBlockSpotlight: mockToggleBlockSpotlight,
			  },
	useSelect: ( store ) => {
		if ( store === 'editor-store' ) {
			return { getSelectedNote: () => 42 };
		}
		return store( ( selectedStore ) => {
			if ( selectedStore === 'editor-store' ) {
				return { getSelectedNote: () => 42 };
			}
			return {};
		} );
	},
} ) );

jest.mock( '../../../store', () => ( {
	store: 'editor-store',
} ) );

jest.mock( '../../../lock-unlock', () => ( {
	unlock: ( value ) => value,
} ) );

jest.mock( '../note-card', () => ( {
	NoteCard: ( { actions, children, role } ) => (
		<div role={ role }>
			{ actions }
			{ children }
		</div>
	),
} ) );

jest.mock( '../note-form', () => ( {
	NoteForm: () => null,
} ) );

jest.mock( '../add-note', () => ( {
	AddNote: () => null,
} ) );

jest.mock( '../utils', () => ( {
	focusNoteThread: jest.fn( () => Promise.resolve() ),
	getNoteExcerpt: () => 'A note',
	scrollNoteThreadIntoView: jest.fn( () => Promise.resolve() ),
} ) );

const note = {
	id: 42,
	blockClientId: 'client-1',
	parent: 0,
	status: 'hold',
	type: 'note',
	meta: {},
	content: {
		raw: 'A note',
		rendered: 'A note',
	},
	author_name: 'Author',
	reply: [],
};

describe( 'NoteThread actions menu', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'keeps the thread selected while its non-modal menu has focus', async () => {
		const user = userEvent.setup();
		const onOutsideClick = jest.fn();

		render(
			<div>
				<div role="tree">
					<NoteThread
						note={ note }
						onEditNote={ jest.fn() }
						onAddReply={ jest.fn() }
						onDeleteNote={ jest.fn() }
						isSelected
						sidebarRef={ { current: null } }
						onKeyDown={ jest.fn() }
					/>
				</div>
				<button type="button" onClick={ onOutsideClick }>
					Outside
				</button>
			</div>
		);

		const trigger = screen.getByRole( 'button', { name: 'Actions' } );
		act( () => trigger.focus() );
		expect( trigger ).toHaveFocus();
		await user.keyboard( '{ArrowDown}' );
		const editItem = await screen.findByRole( 'menuitem', {
			name: 'Edit',
		} );
		await waitFor( () => expect( editItem ).toHaveFocus() );
		await new Promise( ( resolve ) => setTimeout( resolve, 0 ) );

		expect( mockSelectNote ).not.toHaveBeenCalledWith( undefined );
		expect(
			screen.getByRole( 'treeitem', { name: 'Note: A note' } )
		).toHaveAttribute( 'aria-expanded', 'true' );

		const outsideButton = screen.getByRole( 'button', { name: 'Outside' } );
		await user.click( outsideButton );

		expect( onOutsideClick ).toHaveBeenCalledTimes( 1 );
		await waitFor( () =>
			expect( mockSelectNote ).toHaveBeenCalledWith( undefined )
		);
	} );
} );
