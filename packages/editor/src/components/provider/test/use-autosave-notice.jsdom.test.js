import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDispatch, useRegistry } from '@wordpress/data';
import useAutosaveNotice from '../use-autosave-notice';

vi.mock( import( '@wordpress/data' ), () => ( {
	useDispatch: vi.fn(),
	useRegistry: vi.fn(),
} ) );

vi.mock( import( '@wordpress/notices' ), () => ( {
	store: 'core/notices',
} ) );

vi.mock( import( '../../../store' ), () => ( {
	store: 'core/editor',
} ) );

vi.mock( import( '../../../lock-unlock' ), () => ( {
	unlock: ( object ) => object,
} ) );

const createWarningNotice = vi.fn();
const setCurrentRevisionId = vi.fn();
const getEditorSettings = vi.fn();

function select() {
	return { getEditorSettings };
}

const POST = { type: 'post', id: 7 };
const EDIT_LINK = '/wp-admin/revision.php?revision=123';
const NOTICE_TEXT =
	'There is an autosave of this post that is more recent than the version below.';

function renderAutosaveNotice( props ) {
	return renderHook( ( hookProps ) => useAutosaveNotice( hookProps ), {
		initialProps: {
			post: POST,
			recovery: false,
			...props,
		},
	} );
}

describe( 'useAutosaveNotice', () => {
	beforeEach( () => {
		vi.clearAllMocks();

		useRegistry.mockReturnValue( { select } );
		useDispatch.mockImplementation( ( store ) => {
			if ( 'core/notices' === store ) {
				return { createWarningNotice };
			}

			return { setCurrentRevisionId };
		} );

		getEditorSettings.mockReturnValue( {} );
	} );

	it( 'creates the notice on mount', () => {
		renderAutosaveNotice( {
			settings: { autosave: { editLink: EDIT_LINK } },
		} );

		expect( createWarningNotice ).toHaveBeenCalledTimes( 1 );
		expect( createWarningNotice ).toHaveBeenCalledWith(
			NOTICE_TEXT,
			expect.objectContaining( { id: 'autosave-exists' } )
		);
	} );

	it( 'does not create the notice without an autosave flag', () => {
		renderAutosaveNotice( { settings: {} } );

		expect( createWarningNotice ).not.toHaveBeenCalled();
	} );

	it( 'does not create the notice in recovery mode', () => {
		renderAutosaveNotice( {
			recovery: true,
			settings: { autosave: { editLink: EDIT_LINK } },
		} );

		expect( createWarningNotice ).not.toHaveBeenCalled();
	} );

	describe( 'notice actions', () => {
		it( 'opens the autosave revision when the edit link has a revision ID', () => {
			renderAutosaveNotice( {
				settings: { autosave: { editLink: EDIT_LINK } },
			} );

			const [ , options ] = createWarningNotice.mock.calls[ 0 ];
			const [ action ] = options.actions;

			expect( action.label ).toBe( 'View the autosave' );

			action.onClick();

			expect( setCurrentRevisionId ).toHaveBeenCalledWith( 123 );
		} );

		it( 'links to the edit screen when the edit link has no revision ID', () => {
			const editLink = '/wp-admin/post.php?post=9&action=edit';

			renderAutosaveNotice( {
				settings: { autosave: { editLink } },
			} );

			const [ , options ] = createWarningNotice.mock.calls[ 0 ];
			const [ action ] = options.actions;

			expect( action.onClick ).toBeUndefined();
			expect( action.url ).toBe( editLink );
		} );
	} );
} );
