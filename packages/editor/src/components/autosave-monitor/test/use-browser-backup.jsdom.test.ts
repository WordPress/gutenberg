import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useRegistry, useSelect } from '@wordpress/data';
import useBrowserBackup from '../use-browser-backup';
import {
	getBrowserBackup,
	localAutosaveSet,
} from '../../../store/local-autosave';

vi.mock(
	import( '@wordpress/data' ),
	() => ( { useRegistry: vi.fn(), useSelect: vi.fn() } ) as any
);

vi.mock(
	import( '@wordpress/core-data' ),
	() => ( { store: 'core', privateApis: {} } ) as any
);

vi.mock(
	import( '../../../store' ),
	() => ( { store: 'core/editor' } ) as any
);

vi.mock( import( '../../../lock-unlock' ), () => ( {
	unlock: ( object: any ) => object,
} ) );

const POST_ID = 7;

let state: {
	isSaving: boolean;
	isDirty: boolean;
	isNew: boolean;
	isLocked: boolean;
	edits: object;
};
let listeners: Array< () => void >;

function select( store: string ) {
	if ( 'core' === store ) {
		return { getReferenceByDistinctEdits: () => state.edits };
	}

	return {
		getEditorSettings: () => ( {} ),
		isSavingPost: () => state.isSaving,
		isEditedPostDirty: () => state.isDirty,
		isEditedPostNew: () => state.isNew,
		isPostAutosavingLocked: () => state.isLocked,
		getCurrentPostId: () => POST_ID,
		didPostSaveRequestFail: () => false,
	};
}

function update( changes: Partial< typeof state > ) {
	Object.assign( state, changes );
	listeners.forEach( ( listener ) => listener() );
}

async function leavePage() {
	await act( async () => {
		window.dispatchEvent( new Event( 'pagehide' ) );
	} );
}

describe( 'useBrowserBackup', () => {
	beforeEach( () => {
		vi.useFakeTimers( { toFake: [ 'Date' ] } );
		state = {
			isSaving: false,
			isDirty: true,
			isNew: false,
			isLocked: false,
			edits: {},
		};
		listeners = [];
		vi.mocked( useSelect ).mockImplementation( ( callback: any ) =>
			callback( select )
		);
		vi.mocked( useRegistry ).mockReturnValue( {
			select,
			dispatch: () => ( {
				autosave: async () =>
					localAutosaveSet(
						POST_ID,
						state.isNew,
						'',
						'Backup',
						'',
						undefined
					),
			} ),
			subscribe: ( listener: () => void ) => {
				listeners.push( listener );
				return () => {};
			},
		} as any );
	} );

	afterEach( () => {
		window.sessionStorage.clear();
		vi.useRealTimers();
	} );

	it( 'keeps a backup written after a save started', async () => {
		renderHook( () => useBrowserBackup() );

		vi.setSystemTime( 1000 );
		update( { isSaving: true } );
		vi.setSystemTime( 2000 );
		await leavePage();
		update( { isSaving: false } );

		expect( getBrowserBackup( POST_ID, false ) ).toMatchObject( {
			time: 2000,
		} );
	} );

	it( 'moves the backup of a new post to its ID once saved', async () => {
		state.isNew = true;
		renderHook( () => useBrowserBackup() );

		vi.setSystemTime( 1000 );
		update( { isSaving: true } );
		vi.setSystemTime( 2000 );
		await leavePage();
		update( { isNew: false, isSaving: false } );
		await leavePage();

		expect( getBrowserBackup( POST_ID, true ) ).toBeNull();
		expect( getBrowserBackup( POST_ID, false ) ).not.toBeNull();
	} );

	it( 'does not back up while autosaving is locked', async () => {
		state.isLocked = true;
		renderHook( () => useBrowserBackup() );

		await leavePage();

		expect( getBrowserBackup( POST_ID, false ) ).toBeNull();
	} );
} );
