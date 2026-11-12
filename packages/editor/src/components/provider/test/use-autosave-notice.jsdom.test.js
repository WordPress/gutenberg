import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useRegistry, useSelect } from '@wordpress/data';
import { privateApis as coreDataPrivateApis } from '@wordpress/core-data';
import useAutosaveNotice from '../use-autosave-notice';
import { SNAPSHOT_STATUS_SYNC_WAIT_MS } from '../use-entity-contains-snapshot';

vi.mock( import( '@wordpress/data' ), () => ( {
	useRegistry: vi.fn(),
	useSelect: vi.fn(),
} ) );

vi.mock( import( '@wordpress/core-data' ), () => ( {
	store: 'core',
	privateApis: {
		entityContainsSnapshot: vi.fn(),
	},
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

const { entityContainsSnapshot } = coreDataPrivateApis;

const createWarningNotice = vi.fn();
const removeNotice = vi.fn();
const setCurrentRevisionId = vi.fn();
const isCollaborationEnabledForCurrentPost = vi.fn();
const getEntitySyncConnectionStatus = vi.fn();
const getEditorSettings = vi.fn();

function select( store ) {
	if ( 'core' === store ) {
		return { getEntitySyncConnectionStatus };
	}

	return { isCollaborationEnabledForCurrentPost, getEditorSettings };
}

const PROPS = { postType: 'post', postId: 7, isNew: false, recovery: false };
const EDIT_LINK = '/wp-admin/revision.php?revision=123';
const NOTICE_TEXT =
	'There is an autosave of this post that is more recent than the version below.';

function renderAutosaveNotice( props ) {
	return renderHook( ( hookProps ) => useAutosaveNotice( hookProps ), {
		initialProps: { ...PROPS, ...props },
	} );
}

describe( 'useAutosaveNotice', () => {
	beforeEach( () => {
		vi.clearAllMocks();
		vi.useFakeTimers();

		useSelect.mockImplementation( ( callback ) => callback( select ) );
		useRegistry.mockReturnValue( {
			select,
			dispatch: ( store ) =>
				'core/notices' === store
					? { createWarningNotice, removeNotice }
					: { setCurrentRevisionId },
		} );

		entityContainsSnapshot.mockReturnValue( false );
		isCollaborationEnabledForCurrentPost.mockReturnValue( false );
		getEntitySyncConnectionStatus.mockReturnValue( undefined );
		getEditorSettings.mockReturnValue( {} );
	} );

	afterEach( () => {
		vi.useRealTimers();
	} );

	it( 'creates the notice immediately outside real-time collaboration', () => {
		renderAutosaveNotice( {
			autosave: { editLink: EDIT_LINK },
		} );

		expect( createWarningNotice ).toHaveBeenCalledTimes( 1 );
		expect( createWarningNotice ).toHaveBeenCalledWith(
			NOTICE_TEXT,
			expect.objectContaining( { id: 'autosave-exists' } )
		);
	} );

	it( 'removes the notice when unmounted', () => {
		const { unmount } = renderAutosaveNotice( {
			autosave: { editLink: EDIT_LINK },
		} );

		unmount();

		expect( removeNotice ).toHaveBeenCalledWith( 'autosave-exists' );
	} );

	it( 'does not create the notice without an autosave flag', () => {
		renderAutosaveNotice();

		act( () => {
			vi.advanceTimersByTime( SNAPSHOT_STATUS_SYNC_WAIT_MS );
		} );

		expect( createWarningNotice ).not.toHaveBeenCalled();
	} );

	it( 'does not create the notice in recovery mode', () => {
		renderAutosaveNotice( {
			recovery: true,
			autosave: { editLink: EDIT_LINK, crdtSnapshot: 'snapshot' },
		} );

		act( () => {
			vi.advanceTimersByTime( SNAPSHOT_STATUS_SYNC_WAIT_MS );
		} );

		expect( createWarningNotice ).not.toHaveBeenCalled();
	} );

	it( 'creates the notice immediately when collaboration is not enabled for the post', () => {
		renderAutosaveNotice( {
			autosave: { editLink: EDIT_LINK, crdtSnapshot: 'snapshot' },
		} );

		expect( createWarningNotice ).toHaveBeenCalledTimes( 1 );
		expect( entityContainsSnapshot ).not.toHaveBeenCalled();
	} );

	describe( 'under real-time collaboration', () => {
		const autosave = { editLink: EDIT_LINK, crdtSnapshot: 'snapshot' };

		beforeEach( () => {
			isCollaborationEnabledForCurrentPost.mockReturnValue( true );
			getEntitySyncConnectionStatus.mockReturnValue( {
				status: 'connecting',
			} );
		} );

		it( 'suppresses the notice when the shared document already contains the snapshot', () => {
			entityContainsSnapshot.mockReturnValue( true );

			renderAutosaveNotice( { autosave } );

			expect( entityContainsSnapshot ).toHaveBeenCalledWith(
				'postType',
				PROPS.postType,
				PROPS.postId,
				autosave.crdtSnapshot
			);

			act( () => {
				vi.advanceTimersByTime( SNAPSHOT_STATUS_SYNC_WAIT_MS );
			} );

			expect( createWarningNotice ).not.toHaveBeenCalled();
		} );

		it( 'keeps waiting while the shared document has not confirmed the snapshot', () => {
			renderAutosaveNotice( { autosave } );

			expect( createWarningNotice ).not.toHaveBeenCalled();
		} );

		it( 'suppresses the notice when the document confirms the snapshot after a sync update', () => {
			const { rerender } = renderAutosaveNotice( { autosave } );

			getEntitySyncConnectionStatus.mockReturnValue( {
				status: 'connected',
			} );
			entityContainsSnapshot.mockReturnValue( true );
			rerender( { ...PROPS, autosave } );

			act( () => {
				vi.advanceTimersByTime( SNAPSHOT_STATUS_SYNC_WAIT_MS );
			} );

			expect( createWarningNotice ).not.toHaveBeenCalled();
		} );

		it( 'shows the notice when the sync connection fails', () => {
			const { rerender } = renderAutosaveNotice( { autosave } );

			getEntitySyncConnectionStatus.mockReturnValue( {
				status: 'disconnected',
			} );
			rerender( { ...PROPS, autosave } );

			expect( createWarningNotice ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'shows the notice when collaboration is disabled after mount', () => {
			const { rerender } = renderAutosaveNotice( { autosave } );

			isCollaborationEnabledForCurrentPost.mockReturnValue( false );
			rerender( { ...PROPS, autosave } );

			expect( createWarningNotice ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'shows the notice at most once when the wait deadline expires', () => {
			const { rerender } = renderAutosaveNotice( { autosave } );

			act( () => {
				vi.advanceTimersByTime( SNAPSHOT_STATUS_SYNC_WAIT_MS );
			} );

			expect( createWarningNotice ).toHaveBeenCalledTimes( 1 );

			// Later signals must not create the notice again.
			getEntitySyncConnectionStatus.mockReturnValue( {
				status: 'disconnected',
			} );
			rerender( { ...PROPS, autosave } );

			expect( createWarningNotice ).toHaveBeenCalledTimes( 1 );
		} );
	} );

	describe( 'notice actions', () => {
		it( 'opens the autosave revision when the edit link has a revision ID', () => {
			renderAutosaveNotice( {
				autosave: { editLink: EDIT_LINK },
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
				autosave: { editLink },
			} );

			const [ , options ] = createWarningNotice.mock.calls[ 0 ];
			const [ action ] = options.actions;

			expect( action.onClick ).toBeUndefined();
			expect( action.url ).toBe( editLink );
		} );
	} );
} );
