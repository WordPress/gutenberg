import { beforeEach, describe, expect, it, vi } from 'vitest';
import { select, dispatch } from '@wordpress/data';
import { uploadMedia } from '@wordpress/media-utils';
import mediaUpload from '../';
import {
	addFiles,
	getState,
	reset,
} from '../../../components/upload-progress-snackbar/tracker';

vi.mock( '@wordpress/media-utils', () => ( {
	uploadMedia: vi.fn(),
} ) );

// The module under test only reaches the stores through `select`/`dispatch`,
// so they stand in for the whole data layer here - importing the real editor
// store pulls in most of the editor.
vi.mock( '@wordpress/data', () => ( {
	select: vi.fn(),
	dispatch: vi.fn(),
} ) );
vi.mock( '@wordpress/core-data', () => ( { store: 'core' } ) );
vi.mock( '../../../store', () => ( { store: 'core/editor' } ) );

function file( name ) {
	return new window.File( [ 'x' ], name, { type: 'image/png' } );
}

describe( 'mediaUpload', () => {
	beforeEach( () => {
		reset();
		uploadMedia.mockClear();
		select.mockReturnValue( {
			getCurrentPost: () => ( { id: 1 } ),
			getEditorSettings: () => ( {} ),
		} );
		dispatch.mockReturnValue( {
			receiveEntityRecords: vi.fn(),
			lockPostSaving: vi.fn(),
			unlockPostSaving: vi.fn(),
			lockPostAutosaving: vi.fn(),
			unlockPostAutosaving: vi.fn(),
		} );
	} );

	it( 'uploads a batch when the caller takes more than one file', () => {
		mediaUpload( {
			filesList: [ file( 'a.png' ), file( 'b.png' ) ],
			multiple: true,
		} );

		expect( uploadMedia ).toHaveBeenCalled();
		expect( getState() ).toEqual(
			expect.objectContaining( { total: 2, completed: 0 } )
		);
	} );

	it( 'uploads a single file for a caller that only takes one', () => {
		mediaUpload( {
			filesList: [ file( 'a.png' ) ],
			multiple: false,
		} );

		expect( uploadMedia ).toHaveBeenCalled();
		expect( getState() ).toEqual(
			expect.objectContaining( { total: 1, completed: 0 } )
		);
	} );

	it( 'refuses a batch of more than one file for a caller that only takes one', () => {
		const onError = vi.fn();

		mediaUpload( {
			filesList: [ file( 'a.png' ), file( 'b.png' ), file( 'c.png' ) ],
			multiple: false,
			onError,
		} );

		expect( onError ).toHaveBeenCalledTimes( 1 );
		expect( onError ).toHaveBeenCalledWith(
			'Only one file can be used here.'
		);
		expect( uploadMedia ).not.toHaveBeenCalled();
	} );

	it( 'keeps a refused batch out of the upload progress tracker', () => {
		// `uploadMedia()` reports the refusal as a single error, so registering
		// the batch here would strand the rest of it as "uploading" forever -
		// and the tracker folds every later upload into that stuck session
		// (see gutenberg#82041).
		mediaUpload( {
			filesList: [ file( 'a.png' ), file( 'b.png' ), file( 'c.png' ) ],
			multiple: false,
		} );

		expect( getState() ).toBeNull();

		// The next upload therefore starts a session of its own.
		addFiles( [ 'later.png' ] );
		expect( getState() ).toEqual(
			expect.objectContaining( { total: 1, completed: 0 } )
		);
	} );
} );
