import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { select, dispatch } from '@wordpress/data';
import { uploadMedia } from '@wordpress/media-utils';
import mediaUpload from '../';
import {
	addFiles,
	getState,
	reset,
} from '../../../components/upload-progress-snackbar/tracker';

vi.mock( import( '@wordpress/media-utils' ), () => ( {
	uploadMedia: vi.fn(),
} ) );

// The module under test only reaches the stores through `select`/`dispatch`,
// so they stand in for the whole data layer here - importing the real editor
// store pulls in most of the editor.
vi.mock( import( '@wordpress/data' ), () => ( {
	select: vi.fn(),
	dispatch: vi.fn(),
} ) );
vi.mock( import( '@wordpress/core-data' ), () => ( { store: 'core' } ) );
vi.mock( import( '../../../store' ), () => ( { store: 'core/editor' } ) );

function file( name ) {
	return new window.File( [ 'x' ], name, { type: 'image/png' } );
}

/**
 * Returns the arguments of the nth `uploadMedia()` call, that is, of the nth
 * `mediaUpload()` call to start sending its files to the server.
 *
 * @param {number} index Index of the call.
 * @return {Object} The arguments passed to `uploadMedia()`.
 */
function startedUpload( index ) {
	return uploadMedia.mock.calls[ index ][ 0 ];
}

/**
 * Finishes every file of a started upload successfully.
 *
 * @param {Object} upload Arguments passed to `uploadMedia()`.
 */
function finishUpload( upload ) {
	upload.onFileChange(
		Array.from( upload.filesList ).map( ( _file, index ) => ( {
			id: index + 1,
		} ) )
	);
}

describe( 'mediaUpload', () => {
	beforeEach( () => {
		reset();
		uploadMedia.mockReset();
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

	afterEach( () => {
		// The upload queue lives as long as the module, so finish every upload
		// a test left running. Each one finished can start a waiting call,
		// which then shows up as a further `uploadMedia()` call to finish.
		for ( let index = 0; index < uploadMedia.mock.calls.length; index++ ) {
			finishUpload( startedUpload( index ) );
		}
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

	describe( 'upload limit', () => {
		it( 'sends at most two calls to the server at once', () => {
			mediaUpload( { filesList: [ file( 'a.png' ) ] } );
			mediaUpload( { filesList: [ file( 'b.png' ) ] } );
			mediaUpload( { filesList: [ file( 'c.png' ) ] } );

			expect( uploadMedia ).toHaveBeenCalledTimes( 2 );
		} );

		it( 'starts waiting calls in order as uploads finish', () => {
			mediaUpload( { filesList: [ file( 'a.png' ) ] } );
			mediaUpload( { filesList: [ file( 'b.png' ) ] } );
			mediaUpload( { filesList: [ file( 'c.png' ) ] } );
			mediaUpload( { filesList: [ file( 'd.png' ) ] } );

			finishUpload( startedUpload( 1 ) );

			expect( uploadMedia ).toHaveBeenCalledTimes( 3 );
			expect( startedUpload( 2 ).filesList[ 0 ].name ).toBe( 'c.png' );

			finishUpload( startedUpload( 0 ) );

			expect( uploadMedia ).toHaveBeenCalledTimes( 4 );
			expect( startedUpload( 3 ).filesList[ 0 ].name ).toBe( 'd.png' );
		} );

		it( 'keeps later calls waiting until every file of a mixed batch has uploaded or failed', () => {
			mediaUpload( {
				filesList: [
					file( 'a.png' ),
					file( 'b.png' ),
					file( 'c.png' ),
				],
			} );
			mediaUpload( { filesList: [ file( 'd.png' ) ] } );
			mediaUpload( { filesList: [ file( 'e.png' ) ] } );
			const batch = startedUpload( 0 );

			batch.onError( { message: 'a.png failed' } );
			batch.onFileChange( [ { id: 1 } ] );

			expect( uploadMedia ).toHaveBeenCalledTimes( 2 );

			batch.onFileChange( [ { id: 1 }, { id: 2 } ] );

			expect( uploadMedia ).toHaveBeenCalledTimes( 3 );
		} );

		it( 'does not count a file still showing its temporary blob URL as uploaded', () => {
			mediaUpload( { filesList: [ file( 'a.png' ) ] } );
			mediaUpload( { filesList: [ file( 'b.png' ) ] } );
			mediaUpload( { filesList: [ file( 'c.png' ) ] } );

			startedUpload( 0 ).onFileChange( [ { url: 'blob:a' } ] );

			expect( uploadMedia ).toHaveBeenCalledTimes( 2 );
		} );

		it( 'frees the slot of a call whose files are all rejected before uploading', () => {
			uploadMedia.mockImplementationOnce( ( { onError } ) =>
				onError( {
					message: 'Sorry, this file type is not supported.',
				} )
			);

			mediaUpload( { filesList: [ file( 'a.exr' ) ] } );
			mediaUpload( { filesList: [ file( 'b.png' ) ] } );
			mediaUpload( { filesList: [ file( 'c.png' ) ] } );

			expect( uploadMedia ).toHaveBeenCalledTimes( 3 );
		} );

		it( 'does not take a slot for a batch refused for a caller that only takes one file', () => {
			mediaUpload( {
				filesList: [ file( 'a.png' ), file( 'b.png' ) ],
				multiple: false,
			} );
			mediaUpload( { filesList: [ file( 'c.png' ) ] } );
			mediaUpload( { filesList: [ file( 'd.png' ) ] } );

			expect( uploadMedia ).toHaveBeenCalledTimes( 2 );
		} );

		it( 'does not limit transport calls from the upload-media queue', () => {
			mediaUpload( { filesList: [ file( 'a.png' ) ] } );
			mediaUpload( { filesList: [ file( 'b.png' ) ] } );
			mediaUpload( {
				filesList: [ file( 'c.png' ) ],
				isTransportOnly: true,
			} );
			mediaUpload( {
				filesList: [ file( 'd.png' ) ],
				isTransportOnly: true,
			} );

			expect( uploadMedia ).toHaveBeenCalledTimes( 4 );
		} );

		it( 'does not let transport calls take a slot', () => {
			mediaUpload( {
				filesList: [ file( 'a.png' ) ],
				isTransportOnly: true,
			} );
			mediaUpload( {
				filesList: [ file( 'b.png' ) ],
				isTransportOnly: true,
			} );
			mediaUpload( { filesList: [ file( 'c.png' ) ] } );
			mediaUpload( { filesList: [ file( 'd.png' ) ] } );

			expect( uploadMedia ).toHaveBeenCalledTimes( 4 );
		} );

		it( 'locks saving and shows progress for a call waiting for a slot', () => {
			const lockPostSaving = vi.fn();
			dispatch.mockReturnValue( {
				receiveEntityRecords: vi.fn(),
				lockPostSaving,
				unlockPostSaving: vi.fn(),
				lockPostAutosaving: vi.fn(),
				unlockPostAutosaving: vi.fn(),
			} );

			mediaUpload( { filesList: [ file( 'a.png' ) ] } );
			mediaUpload( { filesList: [ file( 'b.png' ) ] } );
			mediaUpload( { filesList: [ file( 'c.png' ) ] } );

			expect( uploadMedia ).toHaveBeenCalledTimes( 2 );
			expect( lockPostSaving ).toHaveBeenCalledTimes( 3 );
			expect( getState() ).toEqual(
				expect.objectContaining( { total: 3, completed: 0 } )
			);
		} );

		it( 'starts waiting calls after an upload throws', () => {
			uploadMedia.mockImplementationOnce( () => {
				throw new Error( 'Unexpected failure' );
			} );

			mediaUpload( { filesList: [ file( 'a.png' ) ] } );
			mediaUpload( { filesList: [ file( 'b.png' ) ] } );
			mediaUpload( { filesList: [ file( 'c.png' ) ] } );

			expect( uploadMedia ).toHaveBeenCalledTimes( 3 );
		} );

		it( 'reports an upload that throws once started from the queue as an error of its own call', () => {
			const onError = vi.fn();
			const onWaitingCallError = vi.fn();
			mediaUpload( { filesList: [ file( 'a.png' ) ], onError } );
			mediaUpload( { filesList: [ file( 'b.png' ) ] } );
			mediaUpload( {
				filesList: [ file( 'c.png' ) ],
				onError: onWaitingCallError,
			} );
			uploadMedia.mockImplementationOnce( () => {
				throw new Error( 'Unexpected failure' );
			} );

			expect( () => finishUpload( startedUpload( 0 ) ) ).not.toThrow();
			expect( onError ).not.toHaveBeenCalled();
			expect( onWaitingCallError ).toHaveBeenCalledWith(
				'Unexpected failure'
			);
			expect( getState() ).toEqual(
				expect.objectContaining( { completed: 2 } )
			);
		} );

		it( 'unlocks saving for an upload that throws', () => {
			const unlockPostSaving = vi.fn();
			dispatch.mockReturnValue( {
				receiveEntityRecords: vi.fn(),
				lockPostSaving: vi.fn(),
				unlockPostSaving,
				lockPostAutosaving: vi.fn(),
				unlockPostAutosaving: vi.fn(),
			} );
			uploadMedia.mockImplementationOnce( () => {
				throw new Error( 'Unexpected failure' );
			} );

			mediaUpload( { filesList: [ file( 'a.png' ) ] } );

			expect( unlockPostSaving ).toHaveBeenCalled();
		} );
	} );
} );
